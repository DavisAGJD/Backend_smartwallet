const Notificacion = require("../models/notificaciones");
const db = require("../config/db");

async function generarNotificacionesDeGastos() {
  const usuarios = await obtenerUsuarios();

  for (const usuario of usuarios) {
    if (!usuario.ingresos) continue;

    const totalGastos = await obtenerGastosDelMes(usuario.usuario_id);
    const ingresoMensual = usuario.ingresos;
    const porcentajeGasto = (totalGastos / ingresoMensual) * 100;

    if (porcentajeGasto >= 20) {
      await Notificacion.create({
        usuario_id: usuario.usuario_id,
        tipo: "gastos",
        mensaje: "Has alcanzado el 20% de tu ingreso mensual en gastos.",
      });
    }
  }
}

async function generarNotificacionesDeMetas() {
  const metas = await obtenerMetas();

  metas.forEach(async (meta) => {
    const porcentajeMeta = (meta.monto_actual / meta.monto_objetivo) * 100;

    if (porcentajeMeta >= 90) {
      await Notificacion.create({
        usuario_id: meta.usuario_id,
        tipo: "meta",
        mensaje: `Estás cerca de completar tu meta: ${meta.nombre_meta}.`,
      });
    }
  });
}

// Nueva función para metas vencidas
async function generarNotificacionesDeMetasVencidas() {
  const metasVencidas = await obtenerMetasVencidas();

  metasVencidas.forEach(async (meta) => {
    const porcentajeAhorrado = (meta.monto_actual / meta.monto_objetivo) * 100;

    const mensaje = `Lo sentimos, no has podido cumplir la meta: ${meta.nombre_meta}. Solo lograste ahorrar ${meta.monto_actual}. No te desanimes, ¡enfócate en mejorar las otras metas!`;

    // Enviar notificación al usuario
    await Notificacion.create({
      usuario_id: meta.usuario_id,
      tipo: "meta_vencida",
      mensaje,
    });

    // Eliminar la meta vencida de la base de datos
    await eliminarMeta(meta.meta_id);
  });
}

async function generarNotificacionesDeRecordatorios() {
  const recordatorios = await obtenerRecordatoriosProximos();

  recordatorios.forEach(async (recordatorio) => {
    const fechaHoy = new Date();
    const fechaRecordatorio = new Date(recordatorio.fecha_recordatorio);

    const diferenciaDias = Math.ceil(
      (fechaRecordatorio - fechaHoy) / (1000 * 60 * 60 * 24)
    );

    let mensaje = `Recordatorio próximo: ${recordatorio.descripcion} el ${recordatorio.fecha_recordatorio}.`;

    if (diferenciaDias === 1) {
      mensaje = `Tu recordatorio está programado para mañana: ${recordatorio.descripcion}`;
    } else if (diferenciaDias === 0) {
      mensaje = `¡Hoy es el día para: ${recordatorio.descripcion}!`;
    }

    if (diferenciaDias <= 1) {
      await Notificacion.create({
        usuario_id: recordatorio.usuario_id,
        tipo: "recordatorio",
        mensaje,
      });
    }
  });
}

async function eliminarNotificacionesViejas() {
  const query = `DELETE FROM notificaciones WHERE fecha < NOW() - INTERVAL 1 DAY`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error al eliminar notificaciones viejas:", err);
    } else {
      console.log(`Notificaciones viejas eliminadas: ${result.affectedRows}`);
    }
  });
}

// Nuevas funciones para obtener metas vencidas y eliminar una meta
const obtenerMetasVencidas = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT meta_id, usuario_id, nombre_meta, monto_objetivo, monto_actual, fecha_limite
      FROM metas_de_ahorro
      WHERE fecha_limite < CURDATE() AND monto_actual < monto_objetivo
    `;
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const eliminarMeta = async (metaId) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM metas_de_ahorro WHERE meta_id = ?`;
    db.query(query, [metaId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Otros métodos para obtener usuarios, gastos y recordatorios
const obtenerUsuarios = async () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT usuario_id, ingresos FROM usuarios";
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const obtenerGastosDelMes = async (usuarioId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COALESCE(SUM(monto), 0) AS total
      FROM gastos
      WHERE usuario_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
    `;
    db.query(query, [usuarioId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].total);
    });
  });
};

const obtenerMetas = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT meta_id, usuario_id, nombre_meta, monto_objetivo, monto_actual, fecha_limite
      FROM metas_de_ahorro
    `;
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const obtenerRecordatoriosProximos = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT recordatorio_id, usuario_id, descripcion, fecha_recordatorio
      FROM recordatorios
      WHERE fecha_recordatorio BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `;
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

module.exports = {
  generarNotificacionesDeGastos,
  generarNotificacionesDeMetas,
  generarNotificacionesDeRecordatorios,
  eliminarNotificacionesViejas,
  generarNotificacionesDeMetasVencidas // Exportamos la nueva función
};
