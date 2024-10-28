const Reporte = require("../models/reportes");

// Obtener todos los reportes
const getReportes = (req, res) => {
  Reporte.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los reportes" });
    }
    res.status(200).json(data);
  });
};

// Obtener reportes por ID de usuario
const getReportesByUserId = (req, res) => {
  const { usuario_id } = req.params;

  Reporte.getByUserId(usuario_id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los reportes del usuario" });
    }
    res.status(200).json(data);
  });
};

// Crear un nuevo reporte
const postReporte = (req, res) => {
  const { titulo, descripcion } = req.body;
  const usuario_id = req.userId; // Obtener el usuario_id del token

  if (!titulo || !descripcion) {
    return res.status(400).json({ error: "Título y descripción son obligatorios" });
  }

  const nuevoReporte = { titulo, descripcion };

  Reporte.create(usuario_id, nuevoReporte, (err, data) => {
    if (err) {
      console.error(`Error al crear reporte: ${err}`);
      return res.status(500).json({ error: "Error al crear el reporte" });
    }
    res.status(201).json({ message: "Reporte añadido exitosamente", data });
  });
};

// Actualizar un reporte por ID
const putReporte = (req, res) => {
  const { reporte_id } = req.params;
  const { titulo, descripcion, estado } = req.body;

  if (!titulo || !descripcion || !estado) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const updateData = { titulo, descripcion, estado };

  Reporte.update(reporte_id, updateData, (err, result) => {
    if (err) {
      console.error(`Error al actualizar el reporte: ${err}`);
      return res.status(500).json({ error: "Error al actualizar el reporte" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    res.status(200).json({ message: "Reporte actualizado correctamente", result });
  });
};

// Eliminar un reporte por ID
const deleteReporte = (req, res) => {
  const { reporte_id } = req.params;

  Reporte.delete(reporte_id, (err, result) => {
    if (err) {
      console.error(`Error al eliminar el reporte: ${err}`);
      return res.status(500).json({ error: "Error al eliminar el reporte" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    res.status(200).json({ message: "Reporte eliminado exitosamente" });
  });
};

module.exports = {
  getReportes,
  getReportesByUserId,
  postReporte,
  putReporte,
  deleteReporte,
};
