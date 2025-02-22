const FormData = require("form-data");
const axios = require("axios");

const uploadImageToImgBB = async (imageBuffer) => {
  try {
    // Validación del buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Buffer de imagen inválido");
    }

    // 1. Usar base64 estándar SIN modificaciones
    const base64Data = imageBuffer.toString("base64");

    // 2. Crear payload con formato correcto
    const formData = new FormData();
    formData.append("image", base64Data); // ← Base64 puro

    // 3. Headers esenciales
    const headers = {
      ...formData.getHeaders(),
      "User-Agent": "MyFinanceApp/1.0",
      "Accept": "application/json"
    };

    // 4. Enviar petición
    const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
      params: {
        key: process.env.IMGBB_API_KEY,
        expiration: 600
      },
      headers: headers
    });

    return response.data.data.url;

  } catch (error) {
    // Manejo mejorado de errores
    let errorDetails = "Error desconocido";
    
    if (error.response?.data?.error) {
      errorDetails = `${error.response.data.error.message} (código: ${error.response.data.error.code})`;
    }
    
    throw new Error(`Fallo en ImgBB: ${errorDetails}`);
  }
};

module.exports = { uploadImageToImgBB };