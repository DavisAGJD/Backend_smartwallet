const db = require("../config/db");

const Usuario = {
  getAll: (callback) => {
    const query = "SELECT * FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  getById: (id, callback) => {
    db.query(
      "SELECT * FROM usuarios WHERE usuario_id = ?",
      [id],
      (err, results) => {
        if (err) {
          return callback(err, null);
        }
        callback(null, results[0]);
      }
    );
  },

  getTotalUsuarios: (callback) => {
    const query = "SELECT COUNT(*) AS totalUsuarios FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0].totalUsuarios);
    });
  },

  getUsuariosMesActual: (callback) => {
    const query = `
      SELECT COUNT(*) AS usuariosMes 
      FROM usuarios 
      WHERE MONTH(fecha_registro) = MONTH(CURDATE()) 
      AND YEAR(fecha_registro) = YEAR(CURDATE())
    `;
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0].usuariosMes);
    });
  },

  getGraficaUsuarios: (callback) => {
    const query = `
      SELECT DATE_FORMAT(fecha_registro, '%Y-%m') AS month, COUNT(*) AS value 
      FROM usuarios 
      GROUP BY month
      ORDER BY month
    `;
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
      callback(null, result[0]);
    });
  },

  getUsuariosPaginados: (offset, limit, callback) => {
    const query = `
      SELECT nombre_usuario, fecha_registro, tipo_suscripcion, image
      FROM usuarios
      LIMIT ? OFFSET ?
    `;
    db.query(query, [limit, offset], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  create: (data, callback) => {
    const { nombre_usuario, email, password_usuario, image } = data;
    const query = `
      INSERT INTO usuarios (nombre_usuario, email, password_usuario, image)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      query,
      [nombre_usuario, email, password_usuario, image],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  updateData: (usuario_id, data, callback) => {
    const fields = [];
    const values = [];

    if (data.nombre_usuario) {
      fields.push("nombre_usuario = ?");
      values.push(data.nombre_usuario);
    }
    if (data.email) {
      fields.push("email = ?");
      values.push(data.email);
    }
    if (data.password_usuario) {
      fields.push("password_usuario = ?");
      values.push(data.password_usuario);
    }
    if (data.ingresos !== undefined) {
      fields.push("ingresos = ?");
      values.push(data.ingresos);
    }
    if (data.image) {
      fields.push("image = ?");
      values.push(data.image);
    }

    if (fields.length === 0) {
      return callback(new Error("No hay campos para actualizar"), null);
    }

    const query = `
      UPDATE usuarios
      SET ${fields.join(", ")}
      WHERE usuario_id = ?
    `;
    values.push(usuario_id);

    db.query(query, values, (err, result) => {
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
  },

  updateLoginInfo: (usuarioId, firstLogin, lastLogin, racha, callback) => {
    const query = `UPDATE usuarios SET first_login = ?, last_login = ?, racha = ? WHERE usuario_id = ?`;
    const values = [firstLogin, lastLogin, racha, usuarioId];
    db.query(query, values, callback);
  },

  getGastosYSalario: (usuario_id, callback) => {
    // Primero, obtenemos los ingresos del usuario
    db.query(
      "SELECT ingresos FROM usuarios WHERE usuario_id = ?",
      [usuario_id],
      (err, usuarioResult) => {
        if (err) return callback(err, null);
        if (usuarioResult.length === 0)
          return callback({ kind: "not_found" }, null);

        const ingresos = usuarioResult[0].ingresos || 0;

        // Luego, se suman todos los gastos asociados al usuario
        db.query(
          "SELECT SUM(monto) AS totalGastos FROM gastos WHERE usuario_id = ?",
          [usuario_id],
          (err, gastosResult) => {
            if (err) return callback(err, null);
            const totalGastos = gastosResult[0].totalGastos || 0;
            callback(null, { ingresos, totalGastos });
          }
        );
      }
    );
  },
};

module.exports = Usuario;
