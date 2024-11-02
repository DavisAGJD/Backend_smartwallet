const cron = require("node-cron");
const {
  generarNotificacionesDeGastos,
  generarNotificacionesDeMetas,
  generarNotificacionesDeRecordatorios,
  eliminarNotificacionesViejas,
  generarNotificacionesDeMetasVencidas
} = require("./controllers/notificacionAutomaticaController");

cron.schedule("0 */4 * * *", () => {
  console.log(
    "Ejecutando análisis para generar notificaciones cada 4 horas..."
  );
  generarNotificacionesDeGastos();
  generarNotificacionesDeMetas();
  generarNotificacionesDeRecordatorios();
  console.log("Ejecutando limpieza diaria de notificaciones viejas...");
  eliminarNotificacionesViejas();
  console.log("Ejecutando análisis para metas vencidas...");
  generarNotificacionesDeMetasVencidas();
});
