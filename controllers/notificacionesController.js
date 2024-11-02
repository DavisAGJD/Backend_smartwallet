const Notificacion = require("../models/notificaciones");

const getNotificacionesByUserId = (req, res) => {
  const { usuario_id } = req.params;

  Notificacion.getByUserId(usuario_id, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener las notificaciones del usuario" });
    }
    res.status(200).json(data);
  });
};

const postNotificacion = (req, res) => {
  const { usuario_id, tipo, mensaje } = req.body;

  // Validar que los campos obligatorios estén presentes
  if (!usuario_id || !tipo || !mensaje) {
    return res.status(400).json({
      error: "Todos los campos (usuario_id, tipo, mensaje) son obligatorios.",
    });
  }

  // Crear el objeto de la nueva notificación
  const nuevaNotificacion = {
    usuario_id,
    tipo,
    mensaje,
  };

  // Llamar al modelo para crear la nueva notificación
  Notificacion.create(nuevaNotificacion, (err, data) => {
    if (err) {
      console.error(`Error al crear notificación: ${err}`);
      return res.status(500).json({ error: "Error al crear notificación" });
    }

    // Devolver la respuesta con éxito y el ID de la nueva notificación
    res.status(201).json({
      message: "Notificación añadida exitosamente",
      notificacionId: data.insertId, // Si quieres devolver el ID de la nueva notificación
    });
  });
};

const putNotificacion = (req, res) => {
  const { notificacion_id } = req.params;
  const { usuario_id, tipo, mensaje, leida } = req.body;

  if (!notificacion_id) {
    return res.status(400).json({
      error: "Se requiere el ID de la notificación para actualizar.",
    });
  }

  if (!usuario_id || !tipo || !mensaje || leida === undefined) {
    return res.status(400).json({
      error: "Todos los campos (usuario_id, tipo, mensaje, leida) son obligatorios.",
    });
  }

  let updateData = {
    usuario_id,
    tipo,
    mensaje,
    leida,
  };

  Notificacion.updateData(notificacion_id, updateData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al actualizar notificación", detalles: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.status(200).json({
      message: "Notificación actualizada correctamente",
      result: result,
    });
  });
};

const deleteNotificacion = (req, res) => {
  const { notificacion_id } = req.params;

  if (!notificacion_id) {
    return res.status(400).json({
      error: "Se requiere el ID de la notificación para eliminar.",
    });
  }

  Notificacion.delete(notificacion_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar la notificación: ${err}`);
      return res
        .status(500)
        .json({ error: "Error al eliminar la notificación" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.status(200).json({ message: "Notificación eliminada exitosamente" });
  });
};

module.exports = {
  getNotificacionesByUserId,
  postNotificacion,
  putNotificacion,
  deleteNotificacion
};
