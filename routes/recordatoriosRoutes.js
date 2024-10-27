const express = require("express");
const router = express.Router();
const recordatorioController = require("../controllers/recordatorioController");

router.get("/", recordatorioController.getRecordatorios);
router.post("/create", recordatorioController.postRecordatorio);
router.put("/update/:recordatorio_id", recordatorioController.putRecordatorio);
router.delete("/delete/:recordatorio_id", recordatorioController.deleteRecordatorio);

module.exports = router;
