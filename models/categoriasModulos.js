const db = require("../config/db");
const { getById } = require("./modulosEducativos");

const CategoriaModulo = {
  // Obtener todas las categorías de módulos educativos
  getAll: (callback) => {
    const query = "SELECT * FROM categorias_modulos";
    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Crear una nueva categoría de módulo educativo
  create: (data, callback) => {
    const { nombre_categoria } = data;
    const query =
      "INSERT INTO categorias_modulos (nombre_categoria) VALUES (?)";
    db.query(query, [nombre_categoria], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Actualizar una categoría de módulo educativo por ID
  update: (categoria_modulo_id, data, callback) => {
    const { nombre_categoria } = data;
    const query =
      "UPDATE categorias_modulos SET nombre_categoria = ? WHERE categoria_modulo_id = ?";
    db.query(query, [nombre_categoria, categoria_modulo_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar una categoría de módulo educativo por ID
  delete: (categoria_modulo_id, callback) => {
    const query =
      "DELETE FROM categorias_modulos WHERE categoria_modulo_id = ?";
    db.query(query, [categoria_modulo_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = CategoriaModulo;
