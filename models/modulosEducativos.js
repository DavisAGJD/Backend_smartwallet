const db = require("../config/db");

const ModuloEducativo = {
  // Obtener todos los módulos educativos
  getAll: (callback) => {
    const query = "SELECT * FROM modulos_educativos";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  // Obtener un módulo educativo por ID
  getById: (modulo_id, callback) => {
    const query = "SELECT * FROM modulos_educativos WHERE modulo_id = ?";
    db.query(query, [modulo_id], (err, result) => {
      if (err) return callback(err, null);
      if (result.length === 0) return callback(null, null); // No se encontró
      callback(null, result[0]); // Retornar el primer registro
    });
  },

  getByCategoriaId: (categoria_modulo_id, callback) => {
    const query =
      "SELECT * FROM modulos_educativos WHERE categoria_modulo_id = ?";
    db.query(query, [categoria_modulo_id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results);
    });
  },

  // Crear un nuevo módulo educativo
  create: (data, callback) => {
    const query =
      "INSERT INTO modulos_educativos (titulo, contenido, categoria_modulo_id, imagen_modulo) VALUES (?, ?, ?, ?)";
    db.query(
      query,
      [
        data.titulo,
        data.contenido,
        data.categoria_modulo_id,
        data.imagen_modulo,
      ],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, { id: result.insertId, ...data }); // Retornar el nuevo registro con ID
      }
    );
  },

  // Actualizar un módulo educativo por ID
  updateData: (modulo_id, data, callback) => {
    const query = `
      UPDATE modulos_educativos 
      SET titulo = ?, contenido = ?, categoria_modulo_id = ?, imagen_modulo = ? 
      WHERE modulo_id = ?`;

    db.query(
      query,
      [
        data.titulo,
        data.contenido,
        data.categoria_modulo_id,
        data.imagen_modulo,
        modulo_id,
      ],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.affectedRows === 0) return callback(null, null); // No se encontró
        callback(null, { ...data, modulo_id });
      }
    );
  },

  // Eliminar un módulo educativo por ID
  delete: (modulo_id, callback) => {
    const query = "DELETE FROM modulos_educativos WHERE modulo_id = ?";
    db.query(query, [modulo_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, { affectedRows: result.affectedRows });
    });
  },
};

module.exports = ModuloEducativo;
