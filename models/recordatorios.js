const db = require('../config/db');

const Recordatorio = {
  // Obtener todos los recordatorios de un usuario
  getByUserId: (usuario_id, callback) => {
    const query = "SELECT * FROM recordatorios WHERE usuario_id = ?";
    db.query(query, [usuario_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Obtener todos los recordatorios
  getAll: (callback) => {
    const query = "SELECT * FROM recordatorios";
    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Crear un nuevo recordatorio
  create: (data, callback) => {
    const { usuario_id, descripcion, fecha_recordatorio } = data;
    const query = "INSERT INTO recordatorios (usuario_id, descripcion, fecha_recordatorio) VALUES (?, ?, ?)";
    db.query(query, [usuario_id, descripcion, fecha_recordatorio], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Actualizar un recordatorio por ID
  updateData: (recordatorio_id, data, callback) => {
    const { descripcion, fecha_recordatorio } = data;
    const query = "UPDATE recordatorios SET descripcion = ?, fecha_recordatorio = ? WHERE recordatorio_id = ?";
    db.query(query, [descripcion, fecha_recordatorio, recordatorio_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar un recordatorio por ID
  delete: (recordatorio_id, callback) => {
    const query = "DELETE FROM recordatorios WHERE recordatorio_id = ?";
    db.query(query, [recordatorio_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  }
};

module.exports = Recordatorio;
