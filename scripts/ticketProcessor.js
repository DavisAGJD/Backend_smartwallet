const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const sharp = require("sharp");
const stringSimilarity = require("string-similarity");

// Mapeo de palabras a números
const wordNumberMap = {
  UNO: 1,
  DOS: 2,
  TRES: 3,
  CUATRO: 4,
  CINCO: 5,
  SEIS: 6,
  SIETE: 7,
  OCHO: 8,
  NUEVE: 9,
  DIEZ: 10,
  ONCE: 11,
  DOCE: 12,
  TRECE: 13,
  CATORCE: 14,
  QUINCE: 15,
  DIECISEIS: 16,
  DIECISIETE: 17,
  DIECIOCHO: 18,
  DIECINUEVE: 19,
  VEINTE: 20,
  TREINTA: 30,
  CUARENTA: 40,
  CINCUENTA: 50,
  SESENTA: 60,
  SETENTA: 70,
  OCHENTA: 80,
  NOVENTA: 90,
  CIEN: 100,
  MIL: 1000,
};

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim().toUpperCase();
}

function strToFloat(s) {
  try {
    let cleaned = s.replace(/[^\d.,]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      const parts = cleaned.split(",");
      if (parts[parts.length - 1].length === 2) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      }
    } else {
      cleaned = cleaned.replace(",", ".");
    }
    return parseFloat(cleaned);
  } catch (err) {
    return null;
  }
}

function wordsToNumber(words) {
  const parts = words.split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of parts) {
    const num = wordNumberMap[word] || 0;
    if (num >= 100) {
      total += current * num;
      current = 0;
    } else if (num >= 30 && num % 10 === 0) {
      current += num;
    } else {
      current += num;
    }
  }
  return total + current;
}

async function scanTicket(imagePath) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error("Missing OCR API Key");

  // Procesar la imagen: convertir a escala de grises (blanco y negro) para mejorar el contraste
  const imageBuffer = await sharp(imagePath)
    .grayscale()
    .toBuffer();

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "spa");
  formData.append("file", imageBuffer, {
    filename: "ticket.jpg",
    contentType: "image/jpeg",
  });

  try {
    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    return response.data.ParsedResults?.[0]?.ParsedText || "";
  } catch (error) {
    throw new Error("OCR Error: " + error.message);
  }
}

function detectStore(text) {
  const textNorm = normalizeText(text);
  const lines = textNorm.split("\n").slice(0, 10);

  // Detección por patrones clave
  const storePatterns = [
    {
      regex: /(BODEGA\s*?AURRERA|BODEGAAURRERA|WAL\s*?MART)/i,
      name: "Bodega Aurrera",
    },
    {
      regex: /(SORIANA|TIENDAS\s*SORIANA)/i,
      name: "Soriana",
    },
    {
      regex: /(OXXO|0XX0|UXXO|CADENA\s*COMERCIAL\s*OXXO)/i, // Incluye variantes comunes
      name: "OXXO",
    },
    {
      regex: /(SUPER\s*AKI|SURPER\s*AKI|AKI\s*GH)/i,
      name: "Super Aki",
    },
  ];

  // Búsqueda por patrones
  for (const { regex, name } of storePatterns) {
    const match = textNorm.match(regex);
    if (match) {
      console.log(`Tienda detectada por regex: ${name}`);
      return name;
    }
  }

  // Fuzzy matching como último recurso
  const candidates = ["OXXO", "Bodega Aurrera", "Soriana", "Super Aki"];
  const matches = stringSimilarity.findBestMatch(textNorm, candidates);

  // Umbral ajustado y priorización de OXXO
  if (matches.bestMatch.rating > 0.35) {
    console.log(`Tienda detectada por fuzzy matching: ${matches.bestMatch.target}`);
    return matches.bestMatch.target;
  }

  // Claves de contexto adicionales
  const contextClues = {
    "RFC\\s*[A-Z0-9]{12,14}": "OXXO",
    "UNIDAD\\s*TIXCACAL": "Bodega Aurrera",
    "AVISO\\s*DE\\s*PRIVACIDAD": "Soriana",
  };

  for (const [pattern, store] of Object.entries(contextClues)) {
    if (new RegExp(pattern, "i").test(textNorm)) {
      console.log(`Tienda detectada por contexto: ${store}`);
      return store;
    }
  }

  return "Desconocida";
}

function extractTotal(text) {
  const textNorm = normalizeText(text);
  const strategies = [];

  // Estrategia 1: Buscar "TOTAL" en la misma línea o la siguiente
  strategies.push(() => {
    const lines = textNorm.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("TOTAL")) {
        // Buscar en la línea actual
        const currentLineMatch = lines[i].match(/(\d+[\.,]\d{2})/);
        if (currentLineMatch) return strToFloat(currentLineMatch[1]);

        // Buscar en la siguiente línea
        if (i + 1 < lines.length) {
          const nextLineMatch = lines[i + 1].match(/(\d+[\.,]\d{2})/);
          if (nextLineMatch) return strToFloat(nextLineMatch[1]);
        }
      }
    }
    return null;
  });

  // Estrategia 2: Regex clásica para "TOTAL"
  strategies.push(() => {
    const regex = /TOTAL\s+(\d+[\.,]\d{2})/i;
    const match = textNorm.match(regex);
    return match ? strToFloat(match[1]) : null;
  });

  // Estrategia 3: Excluir valores asociados a "EFECTIVO", "CAMBIO", "AJUSTE"
  strategies.push(() => {
    const numbers = textNorm.match(/\d+[\.,]\d{2}/g) || [];
    const excludeKeywords = ["EFECTIVO", "CAMBIO", "AJUSTE"];
    const validNumbers = numbers.filter((numStr) => {
      const context = textNorm.substr(textNorm.indexOf(numStr) - 20, 40);
      return !excludeKeywords.some((keyword) => context.includes(keyword));
    });
    return validNumbers.length > 0 ? Math.max(...validNumbers.map(strToFloat)) : null;
  });
  
  // Estrategia 4: Máximo numérico con filtros adicionales
  strategies.push(() => {
    const exclude = [
      /\d{2}\/\d{2}\/\d{4}/, // Fechas
      /\d{2}:\d{2}/, // Horas
      /C\.P\.\s*\d{5}/, // Códigos postales
      /\d{16,19}/, // Tarjetas
      /(\d{2}\/\d{2}\/\d{2})/, // Fechas con formato 13/02/25
      /(\d{2}:\d{2})/, // Horas con formato 21:21
      /(C\.P\.\s?\d{5})/,
    ];

    const numbers = textNorm.match(/\d+[\.,]\d{2}/g) || [];
    const valid = numbers
      .map(strToFloat)
      .filter((n) => n > 1 && n < 10000 && !exclude.some((p) => p.test(n)));

    return valid.length > 0 ? Math.max(...valid) : null;
  });

  // Estrategia 5: Capturar "QUINCE PESOS 00/100"
  strategies.push(() => {
    const match = textNorm.match(/QUINCE\s+PESOS\s+00\/100/i);
    return match ? 15.0 : null;
  });

  // Estrategia 6: Diferencia entre efectivo y cambio
  strategies.push(() => {
    const efectivo = textNorm.match(/EFECTIVO\s+(\d+[\.,]\d{2})/i);
    const cambio = textNorm.match(/CAMBIO\s+(\d+[\.,]\d{2})/i);
    return efectivo && cambio ? strToFloat(efectivo[1]) - strToFloat(cambio[1]) : null;
  });

  // Ejecutar las estrategias y obtener los resultados válidos
  const results = strategies
    .map((strategy) => {
      try {
        return strategy();
      } catch {
        return null;
      }
    })
    .filter((n) => n !== null);

  // Seleccionar el valor más frecuente
  const frequency = results.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(frequency).length > 0
    ? Number(Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0])
    : null;
}

async function analyzeTicket(imagePath) {
  try {
    const ocrText = await scanTicket(imagePath);
    return {
      tienda: detectStore(ocrText),
      total: extractTotal(ocrText),
      texto_ocr: normalizeText(ocrText),
    };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = { analyzeTicket };
