const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
require("./cronJobs"); // Asegúrate de que este archivo exista y se esté usando correctamente
const port = process.env.PORT;
const NEWS_API_KEY = process.env.NEWS_API_KEY;


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
app.use("/api/notificaciones", notificacionesRoutes);

app.get("/api/articles", async (req, res) => {
  const { keyword = "finance" } = req.query;
  const url = `https://newsapi.org/v2/everything?q=${keyword}&language=es&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error en NewsAPI: ${response.status} - ${response.statusText}`);
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data.articles);
  } catch (error) {
    console.error("Error en la solicitud al NewsAPI:", error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Servidor prendido desde http://localhost:${port}`);
});
