const express = require("express");
const app = express();
require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const multer = require("multer");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("./cronJobs");

// Validar variables de entorno
if (!process.env.PORT || !process.env.NEWSDATA_API_KEY || !process.env.STRIPE_SECRET_KEY) {
  console.error("Faltan variables de entorno necesarias.");
  process.exit(1);
}

// Configuración de Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Configuración de multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middlewares
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["https://smartwallet-front.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rutas
const usuariosRoutes = require("./routes/usuariosRoutes");
const categoriasMetasRoutes = require("./routes/categoriasMetasRoutes");
const categoriasGastosRoutes = require("./routes/categoriasGastosRoutes");
const gastosRoutes = require("./routes/gastosRoutes");
const metasAhorroRoutes = require("./routes/metasAhorroRoutes");
const recordatoriosRoutes = require("./routes/recordatoriosRoutes");
const reportesRoutes = require("./routes/reportesRoutes");
const ingresoRoutes = require("./routes/ingresoRoutes");
const notificacionesRoutes = require("./routes/notificacionesRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categoriasMetas", categoriasMetasRoutes);
app.use("/api/categoriasGastos", categoriasGastosRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/metas", metasAhorroRoutes);
app.use("/api/recordatorios", recordatoriosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/ingresos", ingresoRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/payments", paymentRoutes);

// Ruta para obtener artículos
app.get("/api/articles", async (req, res) => {
  const { keyword = "finance" } = req.query;
  const url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&q=${keyword}&language=es`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching articles: ${await response.text()}`);
    const data = await response.json();
    res.json(data.results);
  } catch (error) {
    console.error("Error en la solicitud a NewsData.io:", error);
    res.status(500).json({ error: "Error fetching articles" });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ error: "Algo salió mal en el servidor" });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Iniciar servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${process.env.PORT}`);
});