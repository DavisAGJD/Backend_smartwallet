const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/reportesController");
const token = require("../middleware/authMiddleware");

// Obtener todos los reportes
router.get("/", reportesController.getReportes);

// Obtener reportes por ID de usuario
router.get("/user/:usuario_id", reportesController.getReportesByUserId);

// Crear un nuevo reporte (requiere autenticación)
router.post("/create", token.verificarToken, reportesController.postReporte);

// Actualizar un reporte por ID (requiere autenticación)
router.put("/update/:reporte_id", token.verificarToken, reportesController.putReporte);

// Eliminar un reporte por ID
router.delete("/delete/:reporte_id", reportesController.deleteReporte);

module.exports = router;
