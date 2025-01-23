const db = require("../config/db");

const Gasto = {
  // Obtener todos los gastos
  getAll: (callback) => {
    const query = "SELECT * FROM gastos";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },
  getGastosPaginados: (offset, limit, callback) => {
    const query = `
      SELECT * FROM gastos
      LIMIT ? OFFSET ?
    `;
    db.query(query, [limit, offset], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  // Obtener todos los gastos de un usuario por ID
  getByUserId: (usuario_id, callback) => {
    const query = `
      SELECT gastos.*, categorias_gasto.nombre_categoria 
      FROM gastos 
      JOIN categorias_gasto ON gastos.categoria_gasto_id = categorias_gasto.categoria_gasto_id
      WHERE gastos.usuario_id = ?
    `;

    db.query(query, [usuario_id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  getByCategoriaId: (categoria_gasto_id, callback) => {
    const query = "SELECT * FROM gastos WHERE categoria_gasto_id = ?";
    db.query(query, [categoria_gasto_id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results);
    });
  },

  // Crear un nuevo gasto
  create: (usuario_id, data, callback) => {
    const { monto, categoria_gasto_id, descripcion } = data;
    const query = `
      INSERT INTO gastos (usuario_id, monto, categoria_gasto_id, fecha, descripcion)
      VALUES (?, ?, ?, NOW(), ?)
    `;
    db.query(
      query,
      [usuario_id, monto, categoria_gasto_id, descripcion],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getTotalGastos: (callback) => {
    const query = `
      SELECT COUNT(*) AS total FROM gastos
    `;
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0].total); // Devuelve el total de gastos
    });
  },


  // Actualizar un gasto por ID
  updateData: (id_gasto, usuario_id, data, callback) => {
    const { monto, categoria_gasto_id, descripcion } = data;
    const query = `
      UPDATE gastos
      SET monto = ?, categoria_gasto_id = ?, descripcion = ?
      WHERE id_gasto = ? AND usuario_id = ?
    `;
    db.query(
      query,
      [monto, categoria_gasto_id, descripcion, id_gasto, usuario_id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Eliminar un gasto por ID
  delete: (id_gasto, callback) => {
    const query = "DELETE FROM gastos WHERE id_gasto = ?";
    db.query(query, [id_gasto], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  agregarPuntos: (usuario_id, puntos, callback) => {
    const query =
      "UPDATE usuarios SET puntos = puntos + ? WHERE usuario_id = ?";
    db.query(query, [puntos, usuario_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = Gasto;
