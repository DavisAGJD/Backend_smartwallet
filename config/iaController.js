const { pipeline, env } = require('@xenova/transformers'); // <- Cambio crucial aquí

// Configuración esencial para Render
env.useBrowser = false; // <- Obligatorio para entornos serverless
env.remoteHost = 'https://huggingface.co'; // <- Fuerza conexión correcta

let nerPipeline;
let isModelLoading = false;

const loadModel = async () => {
  if (!nerPipeline && !isModelLoading) {
    isModelLoading = true;
    try {
      nerPipeline = await pipeline('ner', 'Xenova/distilbert-base-multilingual-cased', {
        quantized: true,
        revision: 'main', // <- Añadir esta línea
      });
      console.log("Modelo cargado correctamente");
      
      // Liberar memoria después de carga exitosa
      if (global.gc) global.gc();
    } catch (error) {
      console.error("Error crítico cargando modelo:", error);
      process.exit(1); // <- Detener la app si falla
    } finally {
      isModelLoading = false;
    }
  }
};

// Middleware modificado
const checkModel = async (req, res, next) => {
  if (!nerPipeline) {
    try {
      await loadModel();
    } catch (error) {
      return res.status(503).json({ 
        error: 'Servicio no disponible. Intente nuevamente en 30 segundos'
      });
    }
  }
  next();
};

// En tu analyzeText, añade esto al final:
res.json({ success: true, data: extractedInfo });

// Liberar memoria después de responder
if (global.gc) {
  setTimeout(() => global.gc(), 5000); // GC diferido
}

const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Texto no proporcionado" });
    }

    if (!nerPipeline) {
      return res.status(500).json({ error: "Modelo de IA no está listo aún" });
    }

    const entities = await nerPipeline(text);

    const extractedInfo = {
      amount: null,
      category: null,
    };

    for (const entity of entities) {
      if (entity.entity === "MISC" && !isNaN(parseFloat(entity.word))) {
        extractedInfo.amount = entity.word;
      } else if (entity.entity === "ORG") {
        extractedInfo.category = entity.word;
      }
    }

    res.json({ success: true, data: extractedInfo });
  } catch (error) {
    console.error("Error al procesar el texto con IA:", error);
    res.status(500).json({ error: "Error al procesar el texto" });
  }
};

// Exportar la función
module.exports = {
  analyzeText,
  checkModel
};
