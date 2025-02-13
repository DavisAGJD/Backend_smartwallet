const { env } = require('@xenova/transformers');
env.useBrowser = false;

let nerPipeline = null;
let isModelActive = false;

// Carga el modelo en segundo plano sin bloquear
const loadModel = async () => {
  try {
    const { pipeline } = await import('@xenova/transformers');
    nerPipeline = await pipeline('ner', 'Xenova/distilbert-base-multilingual-cased', {
      quantized: true,
      revision: 'main'
    });
    isModelActive = true;
    console.log("⚡ Modelo IA cargado (modo no crítico)");
  } catch (error) {
    console.log("⚠️ IA desactivada:", error.message);
    nerPipeline = null;
    isModelActive = false;
  }
};

// Middleware no bloqueante
const checkModel = (req, res, next) => {
  req.hasAI = isModelActive;
  next(); // Siempre continúa
};

const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Respuesta base por defecto
    const extractedInfo = {
      amount: null,
      category: null,
      warning: !isModelActive ? "IA desactivada - Usando valores por defecto" : null
    };

    // Intenta usar IA si está disponible
    if (isModelActive && nerPipeline && text) {
      const entities = await nerPipeline(text);
      
      for (const entity of entities) {
        if (entity.entity === "MISC" && !isNaN(parseFloat(entity.word))) {
          extractedInfo.amount = entity.word;
        } else if (entity.entity === "ORG") {
          extractedInfo.category = entity.word;
        }
      }
    }

    // Siempre responde éxito
    res.json({ 
      success: true,
      data: extractedInfo
    });
    
  } catch (error) {
    console.log("🔴 Error IA ignorado:", error.message);
    res.json({ 
      success: true,
      data: { amount: null, category: null }
    });
  }
};

// Carga el modelo después de 10 segundos (no crítico)
setTimeout(() => {
  loadModel();
}, 10000);

module.exports = {
  analyzeText,
  checkModel
};