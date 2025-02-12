let nerPipeline;
let isModelLoading = false;

const loadModel = async () => {
  if (!nerPipeline && !isModelLoading) {
    isModelLoading = true;
    try {
      const { pipeline } = await import('@xenova/transformers');
      nerPipeline = await pipeline('ner', 'Xenova/distilbert-base-multilingual-cased', {
        quantized: true // Habilita cuantización
      });
      console.log("Modelo cargado");
    } catch (error) {
      console.error("Error cargando modelo:", error);
    }
    isModelLoading = false;
  }
};

// Llama a loadModel() al iniciar
loadModel();

// Middleware para verificar modelo
const checkModel = async (req, res, next) => {
  if (!nerPipeline) {
    await loadModel();
    if (!nerPipeline) {
      return res.status(503).json({ error: 'Modelo aún no disponible' });
    }
  }
  next();
};


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