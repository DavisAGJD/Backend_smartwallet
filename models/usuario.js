const db = require("../config/db");

const Usuario = {
  getAll: (callback) => {
    const query = "SELECT * FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },

  // Obtener el total de usuarios
  getTotalUsuarios: (callback) => {
    const query = "SELECT COUNT(*) AS totalUsuarios FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0].totalUsuarios);
    });
  },

  // Obtener los usuarios registrados en el mes actual
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

  // Obtener datos para la gráfica (usuarios por mes)
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

  create: (data, callback) => {
    const { nombre_usuario, email, password_usuario } = data;
    const query = `
      INSERT INTO usuarios (nombre_usuario, email, password_usuario)
      VALUES (?, ?, ?)
    `;
    db.query(
      query,
      [nombre_usuario, email, password_usuario],
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

    console.log("Campos a actualizar:", fields);
    console.log("Valores a usar:", values);

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
};

module.exports = Usuario;
