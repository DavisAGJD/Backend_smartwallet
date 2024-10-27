const db = require("../config/db");

const MetaAhorro = {
  // Obtener todas las metas de ahorro
  getAll: (callback) => {
    const query = "SELECT * FROM metas_de_ahorro";
    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Obtener metas de ahorro por usuario
  getByUserId: (usuario_id, callback) => {
    const query = "SELECT * FROM metas_de_ahorro WHERE usuario_id = ?";
    db.query(query, [usuario_id], (err, result) => {
      if (err) return callback(err, null);
      if (result.length === 0) return callback(null, null);
      callback(null, result);
    });
  },

  getByCategoriaId: (categoria_meta_id, callback) => {
    const query = "SELECT * FROM metas_de_ahorro WHERE categoria_meta_id = ?";
    db.query(query, [categoria_meta_id], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results);
    });
  },

  // Crear una nueva meta de ahorro
  create: (usuario_id, data, callback) => {
    const {
      nombre_meta,
      monto_objetivo,
      fecha_limite,
      descripcion,
      categoria_meta_id,
    } = data;
    const query = `
      INSERT INTO metas_de_ahorro (usuario_id, nombre_meta, monto_objetivo, fecha_limite, descripcion, categoria_meta_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        usuario_id,
        nombre_meta,
        monto_objetivo,
        fecha_limite,
        descripcion,
        categoria_meta_id,
      ],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Actualizar una meta de ahorro
  updateData: (meta_id, data, callback) => {
    const {
      nombre_meta,
      monto_objetivo,
      monto_actual,
      descripcion,
      estado_de_meta,
    } = data;
    const query = `
      UPDATE metas_de_ahorro
      SET nombre_meta = ?, monto_objetivo = ?, monto_actual = ?, descripcion = ?, estado_de_meta = ?
      WHERE meta_id = ?
    `;
    db.query(
      query,
      [
        nombre_meta,
        monto_objetivo,
        monto_actual,
        descripcion,
        estado_de_meta,
        meta_id,
      ],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // metaAhorroModel.js
  updateMontoActual: (meta_id, montoAdicional, callback) => {
    const query = `
    UPDATE metas_de_ahorro
    SET monto_actual = monto_actual + ?
    WHERE meta_id = ?
  `;
    db.query(query, [montoAdicional, meta_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  // Eliminar una meta de ahorro
  delete: (meta_id, callback) => {
    const query = "DELETE FROM metas_de_ahorro WHERE meta_id = ?";
    db.query(query, [meta_id], (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = MetaAhorro;
