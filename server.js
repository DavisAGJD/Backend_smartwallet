const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
require("./cronJobs"); // Asegúrate de que este archivo exista y se esté usando correctamente
const port = process.env.PORT;

const usuariosRoutes = require("./routes/usuariosRoutes");
const categoriasMetasRoutes = require("./routes/categoriasMetasRoutes");
const categoriasGastosRoutes = require("./routes/categoriasGastosRoutes");
const gastosRoutes = require("./routes/gastosRoutes");
const metasAhorroRoutes = require("./routes/metasAhorroRoutes");
const recordatoriosRoutes = require("./routes/recordatoriosRoutes");
const reportesRoutes = require("./routes/reportesRoutes");
const ingresoRoutes = require("./routes/ingresoRoutes");
const notificacionesRoutes = require("./routes/notificacionesRoutes");

app.use(
  cors({
    origin: " http://localhost:5173", // Cambia este URL por el dominio de tu frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Define los métodos permitidos
    credentials: true, // Si usas cookies o autenticación basada en sesiones
  })
);
app.use(express.json());

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categoriasMetas", categoriasMetasRoutes);
app.use("/api/categoriasGastos", categoriasGastosRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/metas", metasAhorroRoutes);
app.use("/api/recordatorios", recordatoriosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/ingresos", ingresoRoutes);
app.use("/api/notificaciones", notificacionesRoutes);

app.listen(port, () => {
  console.log(`Servidor prendido desde http://localhost:${port}`);
});
