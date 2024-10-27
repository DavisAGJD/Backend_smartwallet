const db = require('../config/db');

const Usuario = {
  getAll: (callback) => {
    const query = "SELECT * FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  getByEmail: (email, callback) => {
    const query = "SELECT * FROM usuarios WHERE email = ?";
    db.query(query, [email], (err, result) => {
      if (err) return callback(err, null);
      if (result.length === 0) return callback(null, null); 
      callback(null, result[0]);;
    });
  },

  create: (data, callback) => {
    const { nombre_usuario, email, password_usuario} = data;
    const query = `
      INSERT INTO usuarios (nombre_usuario, email, password_usuario)
      VALUES (?, ?, ?)
    `;
    db.query(query, [nombre_usuario, email, password_usuario], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  updateData: (usuario_id, data, callback) => {
    const { nombre_usuario, email, password_usuario } = data;
    const query = `
      UPDATE usuarios
      SET nombre_usuario = ?, email = ?, password_usuario = ? WHERE usuario_id = ?
    `;
    db.query(query, [nombre_usuario, email, password_usuario, usuario_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  delete: (usuario_id, callback) => {
    const query = "DELETE FROM usuarios WHERE usuario_id = ?";
    db.query(query, [usuario_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  }
};

module.exports = Usuario;
