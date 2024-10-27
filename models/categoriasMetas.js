const db = require("../config/db");

const CategoriaMeta = {
  // Obtener todas las categorías de metas
  getAll: (callback) => {
    const query = "SELECT * FROM categorias_metas";
    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Crear una nueva categoría de meta
  create: (data, callback) => {
    const { nombre_categoria } = data;
    const query = "INSERT INTO categorias_metas (nombre_categoria) VALUES (?)";
    db.query(query, [nombre_categoria], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Actualizar una categoría de meta por ID
  update: (categoria_meta_id, data, callback) => {
    const { nombre_categoria } = data;
    const query =
      "UPDATE categorias_metas SET nombre_categoria = ? WHERE categoria_meta_id = ?";
    db.query(query, [nombre_categoria, categoria_meta_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar una categoría de meta por ID
  delete: (categoria_meta_id, callback) => {
    const query = "DELETE FROM categorias_metas WHERE categoria_meta_id = ?";
    db.query(query, [categoria_meta_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = CategoriaMeta;
