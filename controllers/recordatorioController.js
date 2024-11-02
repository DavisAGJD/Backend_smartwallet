const Recordatorio = require("../models/recordatorios");

const getRecordatorios = (req, res) => {
  Recordatorio.getAll((err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener los recordatorios" });
    }
    res.status(200).json(data);
  });
};

const getRecordatoriosByUserId = (req, res) => {
  const { usuario_id } = req.params;

  Recordatorio.getByUserId(usuario_id, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener los recordatorios del usuario" });
    }
    res.status(200).json(data);
  });
};

const postRecordatorio = (req, res) => {
  const { usuario_id, descripcion, fecha_recordatorio } = req.body;

  // Validar que los campos obligatorios estén presentes
  if (!usuario_id || !descripcion || !fecha_recordatorio) {
    return res.status(400).json({
      error:
        "Todos los campos (usuario_id, descripcion, fecha_recordatorio) son obligatorios.",
    });
  }

  // Crear el objeto del nuevo recordatorio
  const nuevoRecordatorio = {
    usuario_id,
    descripcion,
    fecha_recordatorio,
  };

  // Llamar al modelo para crear el nuevo recordatorio
  Recordatorio.create(nuevoRecordatorio, (err, data) => {
    if (err) {
      console.error(`Error al crear recordatorio: ${err}`);
      return res.status(500).json({ error: "Error al crear recordatorio" });
    }

    // Devolver la respuesta con éxito y el ID del nuevo recordatorio
    res.status(201).json({
      message: "Recordatorio añadido exitosamente",
      recordatorioId: data.insertId, // Si quieres devolver el ID del nuevo recordatorio
    });
  });
};

const putRecordatorio = (req, res) => {
  const { recordatorio_id } = req.params;
  const { usuario_id, descripcion, fecha_recordatorio } = req.body;

  if (!recordatorio_id) {
    return res.status(400).json({
      error: "Se requiere el ID del recordatorio para actualizar.",
    });
  }

  if (!usuario_id || !descripcion || !fecha_recordatorio) {
    return res.status(400).json({
      error:
        "Todos los campos (usuario_id, descripcion, fecha_recordatorio) son obligatorios.",
    });
  }

  let updateData = {
    usuario_id,
    descripcion,
    fecha_recordatorio,
  };

  Recordatorio.updateData(recordatorio_id, updateData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al actualizar recordatorio", detalles: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

    res.status(200).json({
      message: "Recordatorio actualizado correctamente",
      result: result,
    });
  });
};

const deleteRecordatorio = (req, res) => {
  const { recordatorio_id } = req.params;

  if (!recordatorio_id) {
    return res.status(400).json({
      error: "Se requiere el ID del recordatorio para eliminar.",
    });
  }

  Recordatorio.delete(recordatorio_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar el recordatorio: ${err}`);
      return res
        .status(500)
        .json({ error: "Error al eliminar el recordatorio" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

    res.status(200).json({ message: "Recordatorio eliminado exitosamente" });
  });
};

module.exports = {
  getRecordatorios,
  getRecordatoriosByUserId,
  postRecordatorio,
  putRecordatorio,
  deleteRecordatorio
};
