const cron = require("node-cron");
const {
  generarNotificacionesDeGastos,
  generarNotificacionesDeMetas,
  generarNotificacionesDeRecordatorios,
  eliminarNotificacionesViejas,
  generarNotificacionesDeMetasVencidas,
  generarNotificacionesFinancieras,
} = require("./controllers/notificacionAutomaticaController");
const { analizarYNotificarUsuario } = require("./controllers/agenteController");

cron.schedule("0 */9 * * *", async () => {
  try {
    console.log(
      "Ejecutando análisis y generación de notificaciones cada 9 horas"
    );

    await generarNotificacionesDeGastos();
    console.log("Notificaciones de gastos generadas.");

    await generarNotificacionesDeMetas();
    console.log("Notificaciones de metas generadas.");

    await generarNotificacionesDeRecordatorios();
    console.log("Notificaciones de recordatorios generadas.");

    await generarNotificacionesFinancieras();
    console.log("Notificaciones financieras generadas.");

    await analizarYNotificarUsuario(10205);
    console.log("Análisis del agente y notificación generada.");

    console.log("Ejecutando limpieza de notificaciones viejas...");
    await eliminarNotificacionesViejas();
    console.log("Limpieza de notificaciones viejas completada.");

    await generarNotificacionesDeMetasVencidas();
    console.log("Notificaciones de metas vencidas generadas.");

    console.log("Tarea de cron completada.");
  } catch (error) {
    console.error("Error en el cron job:", error);
  }
});
