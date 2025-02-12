let nerPipeline;

(async () => {
    const { pipeline } = await import('@xenova/transformers');
    nerPipeline = await pipeline('ner', 'Xenova/bert-base-multilingual-cased');
    console.log("Modelo de IA cargado correctamente");
})();

// Función para analizar el texto con IA
const analyzeText = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Texto no proporcionado' });
        }

        // Procesar el texto con el modelo de Transformers
        const entities = await nerPipeline(text);

        // Extraer información relevante (monto y categoría)
        const extractedInfo = {
            amount: null,
            category: null,
        };

        for (const entity of entities) {
            if (entity.entity === 'MISC' && !isNaN(parseFloat(entity.word))) {
                extractedInfo.amount = entity.word; // Extraer montos
            } else if (entity.entity === 'ORG') {
                extractedInfo.category = entity.word; // Extraer categorías
            }
        }

        res.json({ success: true, data: extractedInfo });
    } catch (error) {
        console.error("Error al procesar el texto con IA:", error);
        res.status(500).json({ error: 'Error al procesar el texto' });
    }
};

// Exportar la función
module.exports = {
    analyzeText,
};