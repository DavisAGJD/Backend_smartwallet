const express = require("express");
const router = express.Router();
const notificacionController = require("../controllers/notificacionesController");
const token = require("../middleware/authMiddleware");

router.get("/user/:usuario_id", token.verificarToken, notificacionController.getNotificacionesByUserId);
router.post("/create", token.verificarToken, notificacionController.postNotificacion);
router.put("/update/:notificacion_id", token.verificarToken, notificacionController.putNotificacion);
router.delete("/delete/:notificacion_id", token.verificarToken, notificacionController.deleteNotificacion);

module.exports = router;
