const db = require("../config/db");

const CategoriaGasto = {
  // Obtener todas las categorías de gasto
  getAll: (callback) => {
    const query = "SELECT * FROM categorias_gasto";
    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Crear una nueva categoría de gasto
  create: (data, callback) => {
    const { nombre_categoria } = data;
    const query = "INSERT INTO categorias_gasto (nombre_categoria) VALUES (?)";
    db.query(query, [nombre_categoria], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Actualizar una categoría de gasto por ID
  update: (categoria_gasto_id, data, callback) => {
    const { nombre_categoria } = data;
    const query =
      "UPDATE categorias_gasto SET nombre_categoria = ? WHERE categoria_gasto_id = ?";
    db.query(query, [nombre_categoria, categoria_gasto_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar una categoría de gasto por ID
  delete: (categoria_gasto_id, callback) => {
    const query = "DELETE FROM categorias_gasto WHERE categoria_gasto_id = ?";
    db.query(query, [categoria_gasto_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = CategoriaGasto;
