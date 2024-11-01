const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT;
const usuariosRoutes = require("./routes/usuariosRoutes");
const categoriasMetasRoutes = require("./routes/categoriasMetasRoutes");
const categoriasGastosRoutes = require("./routes/categoriasGastosRoutes");
const gastosRoutes = require("./routes/gastosRoutes");
const metasAhorroRoutes = require("./routes/metasAhorroRoutes");
const recordatoriosRoutes = require("./routes/recordatoriosRoutes");
const reportesRoutes = require("./routes/reportesRoutes");
const ingresoRoutes = require("./routes/ingresoRoutes");

app.use(
  cors({
    origin: "https://smartwallet-front.vercel.app", // Cambia este URL por el dominio de tu frontend
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

app.listen(port, () => {
  console.log(`Servidor prendido desde http://localhost:${port}`);
});
