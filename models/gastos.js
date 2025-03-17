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

  getGastosPaginadosByUserId: (usuario_id, offset, limit, callback) => {
    const query = `
      SELECT * FROM gastos 
      WHERE usuario_id = ? 
      ORDER BY fecha DESC 
      LIMIT ? OFFSET ?`;
    db.query(query, [usuario_id, limit, offset], (err, results) => {
      if (err) {
        console.error("Error al obtener gastos paginados:", err);
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  getTotalGastosByUserId: (usuario_id, callback) => {
    const query = `
      SELECT COUNT(*) as total 
      FROM gastos 
      WHERE usuario_id = ?`;
    db.query(query, [usuario_id], (err, results) => {
      if (err) {
        console.error("Error al obtener el total de gastos:", err);
        return callback(err, null);
      }
      callback(null, results[0].total);
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

  getGastosPorCategoria: (callback) => {
    const query = `
      SELECT 
        u.usuario_id,
        u.nombre_usuario,
        c.nombre_categoria,
        SUM(g.monto) AS total_gastado
      FROM usuarios u
      LEFT JOIN gastos g ON u.usuario_id = g.usuario_id
      LEFT JOIN categorias_gasto c ON g.categoria_gasto_id = c.categoria_gasto_id
      GROUP BY u.usuario_id, c.categoria_gasto_id
      ORDER BY u.nombre_usuario, c.nombre_categoria;
    `;

    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  // Dentro del objeto Gasto, agrega:
  getGastosDelMesPorCategoria: (usuario_id, callback) => {
    const query = `
      SELECT u.usuario_id, c.nombre_categoria, SUM(g.monto) AS total_gastado, u.ingresos
      FROM gastos g
      JOIN categorias_gasto c ON g.categoria_gasto_id = c.categoria_gasto_id
      JOIN usuarios u ON g.usuario_id = u.usuario_id
      WHERE g.usuario_id = ?
        AND YEAR(g.fecha) = YEAR(CURRENT_DATE())
        AND MONTH(g.fecha) = MONTH(CURRENT_DATE())
      GROUP BY u.usuario_id, c.nombre_categoria, u.ingresos
      ORDER BY c.nombre_categoria;
    `;
    db.query(query, [usuario_id], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },
};

module.exports = Gasto;
