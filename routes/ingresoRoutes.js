const express = require("express");
const router = express.Router();
const ingresoController = require("../controllers/ingresoController");
const token = require("../middleware/authMiddleware")


router.get("/usuario/:usuario_id", ingresoController.getIngresoByUserId);
router.put("/usuario/:usuario_id", token.verificarToken, ingresoController.updateIngreso);

module.exports = router;
