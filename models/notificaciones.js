const db = require("../config/db");

const Notificacion = {
  // Obtener todas las notificaciones de un usuario
  getByUserId: (usuario_id, callback) => {
    const query =
      "SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha DESC";
    db.query(query, [usuario_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Crear una nueva notificación
  create: async (data) => {
    const { usuario_id, tipo, mensaje } = data;
    const query =
      "INSERT INTO notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)";

    return new Promise((resolve, reject) => {
      db.query(query, [usuario_id, tipo, mensaje], (err, result) => {
        if (err) {
          return reject(err); // Rechaza la promesa si hay un error
        }
        resolve(result); // Resuelve la promesa con el resultado de la inserción
      });
    });
  },
  // Marcar una notificación como leída
  markAsRead: (notificacion_id, callback) => {
    const query =
      "UPDATE notificaciones SET leida = TRUE WHERE notificacion_id = ?";
    db.query(query, [notificacion_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar una notificación
  delete: (notificacion_id, callback) => {
    const query = "DELETE FROM notificaciones WHERE notificacion_id = ?";
    db.query(query, [notificacion_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = Notificacion;
