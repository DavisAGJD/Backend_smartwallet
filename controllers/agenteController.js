// analisisNotificaciones.js
const axios = require("axios");
require("dotenv").config();

// Modelos y configuraciones
const Usuario = require("../models/gastos"); // Se asume que existe un método para obtener usuario con gastos e ingresos
const Notificacion = require("../models/notificaciones");

// Función para obtener el usuario con gastos
const obtenerUsuarioConGastos = (usuario_id) => {
  return new Promise((resolve, reject) => {
    Usuario.getGastosDelMesPorCategoria(usuario_id, (err, userData) => {
      if (err) return reject(err);
      if (!userData || userData.length === 0) {
        return resolve(null);
      }
      // Se asume que en cada fila se repite el mismo valor de ingresos, por lo que se extrae de la primera fila.
      const ingresos = userData[0].ingresos;
      // Se transforma el array de filas en un arreglo de gastos con la información necesaria.
      const gastos = userData.map((row) => ({
        categoria: row.nombre_categoria,
        total: row.total_gastado,
      }));
      resolve({ ingresos, gastos });
    });
  });
};

// Función principal para analizar la información financiera y notificar al usuario
const analizarYNotificarUsuario = async (usuario_id) => {
  const usuario = await obtenerUsuarioConGastos(usuario_id);
  if (!usuario || !usuario.ingresos || usuario.gastos.length === 0) {
    throw new Error(
      "No se encontraron datos financieros completos para este usuario"
    );
  }

  // 2. Preparar el prompt para enviar a OpenAI.
  const prompt = `Analiza la siguiente información financiera y ofrece un consejo práctico y breve (máximo 150 caracteres) para notificación en una app móvil:\n${JSON.stringify(
    usuario
  )}`;

  // 3. Llamada a la API de OpenAI utilizando el modelo "40-mini".
  const openaiResponse = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un asesor financiero. Analiza la información proporcionada y genera un consejo financiero breve (máximo 150 caracteres) y conciso, apto para ser una notificación en una app móvil.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  const analisisAgente = openaiResponse.data.choices[0].message.content;

  // 4. Crear notificación para el usuario únicamente con el consejo del agente.
  await Notificacion.create({
    usuario_id: usuario.usuario_id,
    tipo: "consejo_financiero",
    mensaje: analisisAgente,
  });

  return analisisAgente;
};

module.exports = {
  analizarYNotificarUsuario,
};
