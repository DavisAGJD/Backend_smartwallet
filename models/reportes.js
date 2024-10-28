const db = require("../config/db");

const Reporte = {
  // Obtener todos los reportes
  getAll: (callback) => {
    const query = "SELECT * FROM Reportes";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  // Obtener reportes por ID de usuario
  getByUserId: (usuario_id, callback) => {
    const query = `
      SELECT * FROM Reportes
      WHERE usuario_id = ?
    `;
    db.query(query, [usuario_id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  // Crear un nuevo reporte
    create: (usuario_id, data, callback) => {
        const { titulo, descripcion } = data;
        const query = `
        INSERT INTO Reportes (usuario_id, titulo, descripcion)
        VALUES (?, ?, ?)
        `;
        db.query(query, [usuario_id, titulo, descripcion], (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
        });
    },

  // Actualizar un reporte
  update: (reporte_id, data, callback) => {
    const { titulo, descripcion, estado } = data;
    const query = `
      UPDATE Reportes
      SET titulo = ?, descripcion = ?, estado = ?
      WHERE reporte_id = ?
    `;
    db.query(query, [titulo, descripcion, estado, reporte_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar un reporte
  delete: (reporte_id, callback) => {
    const query = "DELETE FROM Reportes WHERE reporte_id = ?";
    db.query(query, [reporte_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = Reporte;
