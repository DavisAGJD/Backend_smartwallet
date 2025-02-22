const FormData = require("form-data");
const axios = require("axios");

const uploadImageToImgBB = async (imageBuffer) => {
  try {
    // Validación del buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Buffer de imagen inválido");
    }

    // Convertir a base64 URL-safe (requerido por ImgBB)
    const base64Data = imageBuffer.toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Configurar form-data
    const formData = new FormData();
    formData.append("image", base64Data); // ¡Clave! No usar buffer directamente

    // Headers personalizados para evitar bloqueos
    const headers = {
      ...formData.getHeaders(),
      "User-Agent": "MyFinanceApp/1.0 (https://tuapp.com)",
      "Accept": "application/json"
    };

    // Hacer la petición
    const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
      params: {
        key: process.env.IMGBB_API_KEY,
        expiration: 600 // Opcional: 10 minutos de expiración
      },
      headers: headers
    });

    return response.data.data.url;

  } catch (error) {
    // Manejo detallado de errores
    let errorMessage = "Error al subir imagen";
    
    if (error.response) {
      const { status, data } = error.response;
      errorMessage = `ImgBB Error ${status}: ${data.error?.message || "Sin mensaje"}`;
    } else if (error.request) {
      errorMessage = "No se recibió respuesta de ImgBB";
    } else {
      errorMessage = `Error interno: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};

module.exports = { uploadImageToImgBB };