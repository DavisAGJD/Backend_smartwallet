const FormData = require('form-data');
const axios = require('axios');

const uploadImageToImgBB = async (imageBuffer) => {
  // Validación del buffer de la imagen
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("El buffer de la imagen está vacío o es inválido.");
  }

  // Validación del tamaño de la imagen
  const MAX_IMAGE_SIZE = 32 * 1024 * 1024; // 32 MB
  if (imageBuffer.length > MAX_IMAGE_SIZE) {
    throw new Error("La imagen es demasiado grande. El tamaño máximo permitido es 32 MB.");
  }

  // Crear el formulario y adjuntar la imagen
  const formData = new FormData();
  formData.append('image', imageBuffer, { 
    filename: 'imagen.jpg',
    contentType: 'image/jpeg'
  });

  try {
    // Subir la imagen a ImgBB
    const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
      params: {
        key: process.env.IMGBB_API_KEY, // API Key de ImgBB
      },
      headers: formData.getHeaders(),
    });

    // Retornar la URL de la imagen
    return response.data.data.url;
  } catch (error) {
    // Manejo de errores
    if (error.response) {
      throw new Error(`Error al subir la imagen: ${error.response.status} - ${error.response.data.error.message}`);
    } else {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }
  }
};

module.exports = { uploadImageToImgBB };