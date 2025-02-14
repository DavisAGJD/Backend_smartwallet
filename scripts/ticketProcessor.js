// ticketProcessor.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const stringSimilarity = require("string-similarity"); // npm install string-similarity

/**
 * Normaliza el texto: elimina espacios extra y lo pasa a mayúsculas.
 */
function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim().toUpperCase();
}

/**
 * Convierte una cadena numérica con formato (puntos, comas) a float.
 */
function strToFloat(s) {
  try {
    // Elimina caracteres que no sean dígitos, punto o coma
    let cleaned = s.replace(/[^\d.,]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      // Si aparecen ambos, asumimos que la coma es decimal si tiene 2 dígitos al final
      const parts = cleaned.split(",");
      const decimalPart = parts[parts.length - 1];
      if (decimalPart.length === 2) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      }
    } else {
      cleaned = cleaned.replace(",", ".");
    }
    const value = parseFloat(cleaned);
    if (value > 10 && value < 100000) {
      return Math.round(value * 100) / 100;
    }
    return null;
  } catch (err) {
    console.warn(`Error al convertir '${s}': ${err}`);
    return null;
  }
}

/**
 * Envía la imagen a la API OCRSpace y devuelve el texto reconocido.
 * Se espera que la variable de ambiente OCR_SPACE_API_KEY esté definida.
 */
async function scanTicket(imagePath) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    throw new Error("No se encontró la API key de OCRSpace en OCR_SPACE_API_KEY");
  }

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("language", "spa");
  formData.append("isOverlayRequired", "false");
  formData.append("file", fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    if (
      response.data &&
      response.data.ParsedResults &&
      response.data.ParsedResults.length > 0
    ) {
      const parsedText = response.data.ParsedResults.map(
        (result) => result.ParsedText
      ).join(" ");
      return parsedText;
    } else {
      throw new Error("No se obtuvieron resultados de OCRSpace.");
    }
  } catch (error) {
    console.error("Error llamando a OCRSpace API:", error.message);
    throw error;
  }
}

/**
 * Detecta la tienda a partir del texto OCR usando:
 * 1. Patrones con expresiones regulares.
 * 2. Keywords.
 * 3. Fuzzy matching.
 */
function detectStore(text) {
  const textNorm = normalizeText(text);
  const lines = textNorm.split(".").slice(0, 5);

  // 1. Búsqueda por patrones (regex)
  const patterns = {
    "\\b(?:SUPER[\\-\\s]?AK[I1P]|SUPERAK[I1P]|SUP\\.?AK[I1P]|AK[I1P]\\s?GH|[CS]?AK(?:[I1PT]))\\b":
      "Super Aki",
    "\\b(?:BODEGA[\\-\\s]?AURRERA|WAL[\\-\\s]?MART|BODEGAAURRERA|B0DEGA\\sAURRERA)\\b":
      "Bodega Aurrera",
    "\\b(?:S[O0]R[I1][A4]N[A4]|SORIANA|SORI@NA)\\b": "Soriana",
    "\\b(?:CHEDRAUI|CHEDRAUY|CHEDRAÜI)\\b": "Chedraui",
    "\\b(?:OXXO|7\\-?ELEVEN)\\b": "OXXO",
    "\\b(?:LA\\sCOMER|COMERCIAL\\sMEXICANA)\\b": "La Comer",
    "\\b(?:TIENDA\\s?CONVENIENCIA)\\b": "Tienda Conveniencia",
  };

  for (const pattern in patterns) {
    const regex = new RegExp(pattern, "i");
    for (const line of lines) {
      if (regex.test(line)) {
        console.log(
          `Tienda detectada por patrón: ${patterns[pattern]} (patrón: ${pattern})`
        );
        return patterns[pattern];
      }
    }
  }

  // 2. Búsqueda por keywords
  const keywords = {
    AKI: "Super Aki",
    AKP: "Super Aki",
    AKT: "Super Aki",
    AURRERA: "Bodega Aurrera",
    WALMART: "Bodega Aurrera",
    SORIANA: "Soriana",
    CHEDRAUI: "Chedraui",
    OXXO: "OXXO",
    CONVENIENCIA: "Tienda Conveniencia",
  };

  for (const key in keywords) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(textNorm)) {
      console.log(`Tienda detectada por keyword: ${keywords[key]}`);
      return keywords[key];
    }
  }

  // 3. Fuzzy matching sobre cada línea
  const candidates = [
    "Super Aki",
    "Bodega Aurrera",
    "Soriana",
    "Chedraui",
    "OXXO",
    "La Comer",
    "7-Eleven",
    "Tienda Conveniencia",
  ];
  let bestScore = 0;
  let bestCandidate = "Desconocida";
  const allLines = textNorm.split(".");

  for (const line of allLines) {
    for (const candidate of candidates) {
      // stringSimilarity devuelve un valor entre 0 y 1
      const score = stringSimilarity.compareTwoStrings(candidate, line) * 100;
      if (score > bestScore && score > 70) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }
  console.log(
    `Tienda detectada por fuzzy matching: ${bestCandidate} (score: ${bestScore})`
  );
  return bestCandidate;
}

/**
 * Extrae el total utilizando varias estrategias:
 * 1. Búsqueda de la palabra TOTAL y un número.
 * 2. Patrón para TOTAL A PAGAR o IMPORTE.
 * 3. Búsqueda de "$" seguido de número.
 * 4. Selección del último número encontrado.
 * 5. Diferencia entre EFECTIVO y CAMBIO.
 * 6. Máximo de todos los números encontrados.
 */
function extractTotal(text) {
  const textNorm = normalizeText(text);
  const strategies = [];

  // Estrategia 1
  strategies.push(() => {
    const regex = /T[O0O]+T[A4]+L.*?(\d[\d.,]+\b)/i;
    const match = textNorm.match(regex);
    return match ? strToFloat(match[1]) : null;
  });

  // Estrategia 2
  strategies.push(() => {
    const regex = /(?:TOTAL\s*A\s*PAGAR|IMPORTE).*?(\d[\d.,]+)/i;
    const match = textNorm.match(regex);
    return match ? strToFloat(match[1]) : null;
  });

  // Estrategia 3
  strategies.push(() => {
    const regex = /\$\s*(\d[\d.,]+\b)/i;
    const match = textNorm.match(regex);
    return match ? strToFloat(match[1]) : null;
  });

  // Estrategia 4: último número en el texto
  strategies.push(() => {
    const regex = /\b\d[\d.,]+\b/g;
    const matches = textNorm.match(regex);
    return matches && matches.length > 0
      ? strToFloat(matches[matches.length - 1])
      : null;
  });

  // Estrategia 5: diferencia entre EFECTIVO y CAMBIO
  strategies.push(() => {
    const regexEfectivo = /EFECTIVO.*?(\d[\d.,]+)/i;
    const regexCambio = /CAMBIO.*?(\d[\d.,]+)/i;
    const matchE = textNorm.match(regexEfectivo);
    const matchC = textNorm.match(regexCambio);
    const efectivo = matchE ? strToFloat(matchE[1]) : null;
    const cambio = matchC ? strToFloat(matchC[1]) : null;
    if (efectivo !== null && cambio !== null) {
      return efectivo - cambio;
    }
    return null;
  });

  // Estrategia 6: máximo de todos los números encontrados
  strategies.push(() => {
    const regex = /\b\d[\d.,]+\b/g;
    const matches = textNorm.match(regex);
    if (matches) {
      const numbers = matches
        .map((s) => strToFloat(s))
        .filter((n) => n !== null);
      if (numbers.length > 0) {
        return Math.max(...numbers);
      }
    }
    return null;
  });

  // Estrategia 7: nuevamente último número (replicando lógica Python)
  strategies.push(() => {
    const regex = /\b\d[\d.,]+\b/g;
    const matches = textNorm.match(regex);
    return matches && matches.length > 0
      ? strToFloat(matches[matches.length - 1])
      : null;
  });

  const validValues = [];
  strategies.forEach((strategy) => {
    try {
      const result = strategy();
      if (result !== null && result > 10 && result < 100000) {
        validValues.push(result);
      }
    } catch (e) {
      console.warn(`Error en estrategia de extracción: ${e}`);
    }
  });

  let total = null;
  if (validValues.length > 0) {
    // Se selecciona el valor que más se repita
    const frequency = {};
    validValues.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    total = validValues.reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b
    );
  }

  // Si aún no se encontró, intentar con fuzzy matching en líneas que contengan "TOTAL"
  if (total === null) {
    const lines = textNorm.split("\n");
    for (const line of lines) {
      if (stringSimilarity.compareTwoStrings("TOTAL", line) * 100 > 70) {
        const match = line.match(/(\d[\d.,]+)/);
        if (match) {
          total = strToFloat(match[1]);
          if (total !== null) {
            console.log(`Total detectado por fuzzy matching: ${total}`);
            break;
          }
        }
      }
    }
  }

  return total;
}

/**
 * Función principal que:
 * 1. Envía la imagen a OCRSpace para extraer el texto.
 * 2. Procesa el texto para detectar la tienda y el total.
 * 3. Devuelve un objeto con { tienda, total, texto_ocr }.
 */
async function analyzeTicket(imagePath) {
  try {
    const ocrText = await scanTicket(imagePath);
    const tienda = detectStore(ocrText);
    const total = extractTotal(ocrText);

    // Si no se detecta tienda o total, podrías agregar llamadas adicionales o lógica extra
    return {
      tienda,
      total,
      texto_ocr: normalizeText(ocrText),
    };
  } catch (error) {
    console.error("Error en el análisis del ticket:", error.message);
    return { error: error.message };
  }
}

module.exports = { analyzeTicket };
