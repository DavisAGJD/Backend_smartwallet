const express = require("express");
const router = express.Router();
const recordatorioController = require("../controllers/recordatorioController")
const token = require("../middleware/authMiddleware")
;

router.get("/", recordatorioController.getRecordatorios);
router.get("/user/:usuario_id", token.verificarToken, recordatorioController.getRecordatoriosByUserId);
router.post("/create", recordatorioController.postRecordatorio);
router.put("/update/:recordatorio_id", token.verificarToken, recordatorioController.putRecordatorio);
router.delete("/delete/:recordatorio_id", recordatorioController.deleteRecordatorio);

module.exports = router;
