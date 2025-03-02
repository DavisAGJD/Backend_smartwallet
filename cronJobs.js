const cron = require("node-cron");
const {
  generarNotificacionesDeGastos,
  generarNotificacionesDeMetas,
  generarNotificacionesDeRecordatorios,
  eliminarNotificacionesViejas,
  generarNotificacionesDeMetasVencidas,
  generarNotificacionesFinancieras
} = require("./controllers/notificacionAutomaticaController");

cron.schedule("0 0,9,18 * * *", async () => {
  try {
    console.log("Ejecutando análisis para generar notificaciones cada 9 horas...");
    await generarNotificacionesDeGastos();
    await generarNotificacionesDeMetas();
    await generarNotificacionesDeRecordatorios();
    await generarNotificacionesFinancieras();
    console.log("Ejecutando limpieza diaria de notificaciones viejas...");
    await eliminarNotificacionesViejas();
    console.log("Ejecutando análisis para metas vencidas...");
    await generarNotificacionesDeMetasVencidas();
  } catch (error) {
    console.error("Error en el cron job:", error);
  }
});
