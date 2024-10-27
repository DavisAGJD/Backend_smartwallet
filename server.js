const express = require("express");
const app = express();
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT;
const usuariosRoutes = require("./routes/usuariosRoutes");
const categoriasMetasRoutes = require("./routes/categoriasMetasRoutes");
const categoriasModulosRoutes = require("./routes/categoriasModulosRoutes");
const categoriasGastosRoutes = require("./routes/categoriasGastosRoutes");
const gastosRoutes = require("./routes/gastosRoutes");
const metasAhorroRoutes = require("./routes/metasAhorroRoutes");
const recordatoriosRoutes = require("./routes/recordatoriosRoutes");
const modulosRoutes = require("./routes/modulosRoutes");

app.use(cors()); 
app.use(express.json());

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categoriasMetas", categoriasMetasRoutes);
app.use("/api/categoriasModulos", categoriasModulosRoutes);
app.use("/api/categoriasGastos", categoriasGastosRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/metas", metasAhorroRoutes);
app.use("/api/recordatorios", recordatoriosRoutes);
app.use("/api/modulos", modulosRoutes);

app.listen(port, () => {
  console.log(`Servidor prendido desde http://localhost:${port}`);
});
