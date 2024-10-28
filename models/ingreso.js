const db = require('../config/db'); 


const Ingreso = {
    // Obtener el ingreso de un usuario por ID
    getIngresoByUserId: (usuario_id, callback) => {
        const query = "SELECT ingresos FROM usuarios WHERE usuario_id = ?";
        db.query(query, [usuario_id], (err, results) => {
          if (err) return callback(err, null);
          callback(null, results[0]); // Devuelve el ingresos del usuario
        });
      },
  
    // Actualizar el ingreso de un usuario por ID
    updateIngreso: (usuario_id, ingresos, callback) => {
        const query = `
          UPDATE usuarios 
          SET ingresos = ? 
          WHERE usuario_id = ?
        `;
        db.query(query, [ingresos, usuario_id], (err, result) => {
          if (err) return callback(err, null);
          callback(null, result);
        });
      },
    };
  
  module.exports = Ingreso;