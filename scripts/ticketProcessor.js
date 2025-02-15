const axios = require("axios");
const FormData = require("form-data");
const stringSimilarity = require("string-similarity");
const sharp = require("sharp");

// Mapeo de palabras a números (igual que antes)
const wordNumberMap = {
  UNO: 1, DOS: 2, TRES: 3, CUATRO: 4, CINCO: 5,
  SEIS: 6, SIETE: 7, OCHO: 8, NUEVE: 9, DIEZ: 10,
  ONCE: 11, DOCE: 12, TRECE: 13, CATORCE: 14, QUINCE: 15,
  DIECISEIS: 16, DIECISIETE: 17, DIECIOCHO: 18, DIECINUEVE: 19,
  VEINTE: 20, TREINTA: 30, CUARENTA: 40, CINCUENTA: 50,
  SESENTA: 60, SETENTA: 70, OCHENTA: 80, NOVENTA: 90,
  CIEN: 100, MIL: 1000,
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

async function scanTicket(fileBuffer) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error("Missing OCR API Key");

  try {
    // Procesa la imagen desde el buffer
    const processedImage = await sharp(fileBuffer)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .greyscale()
      .modulate({ brightness: 1.1 })
      .normalise({ upper: 96 })
      .sharpen({ sigma: 0.8, m1: 1, m2: 3 })
      .linear(1.1, -(64 * 0.1))
      .toBuffer();

    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("language", "spa");
    formData.append("OCREngine", "2");
    formData.append("isTable", "true");
    formData.append("file", processedImage, {
      filename: "processed.jpg",
      contentType: "image/jpeg",
    });

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      { headers: formData.getHeaders() }
    );

    return response.data.ParsedResults?.[0]?.ParsedText || "";
  } catch (error) {
    throw new Error("Image processing/OCR Error: " + error.message);
  }
}

function detectStore(text) {
  const textNorm = normalizeText(text);
  const lines = textNorm.split("\n").slice(0, 10);

  const storePatterns = [
    { regex: /(BODEGA\s*?AURRERA|BODEGAAURRERA|WAL\s*?MART)/i, name: "Bodega Aurrera" },
    { regex: /(SORIANA|TIENDAS\s*SORIANA)/i, name: "Soriana" },
    { regex: /(OXXO|0XX0|UXXO|CADENA\s*COMERCIAL\s*OXXO)/i, name: "OXXO" },
    { regex: /(SUPER\s*AKI|SURPER\s*AKI|AKI\s*GH)/i, name: "Super Aki" },
  ];

  for (const { regex, name } of storePatterns) {
    if (textNorm.match(regex)) {
      console.log(`Tienda detectada por regex: ${name}`);
      return name;
    }
  }

  const candidates = ["OXXO", "Bodega Aurrera", "Soriana", "Super Aki"];
  const matches = stringSimilarity.findBestMatch(textNorm, candidates);
  if (matches.bestMatch.rating > 0.35) {
    console.log(`Tienda detectada por fuzzy matching: ${matches.bestMatch.target}`);
    return matches.bestMatch.target;
  }

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

  strategies.push(() => {
    const lines = textNorm.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("TOTAL")) {
        const currentLineMatch = lines[i].match(/(\d+[\.,]\d{2})/);
        if (currentLineMatch) return strToFloat(currentLineMatch[1]);
        if (i + 1 < lines.length) {
          const nextLineMatch = lines[i + 1].match(/(\d+[\.,]\d{2})/);
          if (nextLineMatch) return strToFloat(nextLineMatch[1]);
        }
      }
    }
    return null;
  });

  strategies.push(() => {
    const regex = /TOTAL\s+(\d+[\.,]\d{2})/i;
    const match = textNorm.match(regex);
    return match ? strToFloat(match[1]) : null;
  });

  strategies.push(() => {
    const numbers = textNorm.match(/\d+[\.,]\d{2}/g) || [];
    const excludeKeywords = ["EFECTIVO", "CAMBIO", "AJUSTE"];
    const validNumbers = numbers.filter((numStr) => {
      const context = textNorm.substr(textNorm.indexOf(numStr) - 20, 40);
      return !excludeKeywords.some((keyword) => context.includes(keyword));
    });
    return validNumbers.length > 0 ? Math.max(...validNumbers.map(strToFloat)) : null;
  });

  strategies.push(() => {
    const exclude = [
      /\d{2}\/\d{2}\/\d{4}/,
      /\d{2}:\d{2}/,
      /C\.P\.\s*\d{5}/,
      /\d{16,19}/,
      /(\d{2}\/\d{2}\/\d{2})/,
      /(\d{2}:\d{2})/,
      /(C\.P\.\s?\d{5})/,
    ];
    const numbers = textNorm.match(/\d+[\.,]\d{2}/g) || [];
    const valid = numbers
      .map(strToFloat)
      .filter((n) => n > 1 && n < 10000 && !exclude.some((p) => p.test(n)));
    return valid.length > 0 ? Math.max(...valid) : null;
  });

  strategies.push(() => {
    const match = textNorm.match(/QUINCE\s+PESOS\s+00\/100/i);
    return match ? 15.0 : null;
  });

  strategies.push(() => {
    const efectivo = textNorm.match(/EFECTIVO\s+(\d+[\.,]\d{2})/i);
    const cambio = textNorm.match(/CAMBIO\s+(\d+[\.,]\d{2})/i);
    return efectivo && cambio ? strToFloat(efectivo[1]) - strToFloat(cambio[1]) : null;
  });

  const results = strategies
    .map((strategy) => {
      try {
        return strategy();
      } catch {
        return null;
      }
    })
    .filter((n) => n !== null);

  const frequency = results.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(frequency).length > 0
    ? Number(Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0])
    : null;
}

async function analyzeTicket(fileBuffer) {
  try {
    const ocrText = await scanTicket(fileBuffer);
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
