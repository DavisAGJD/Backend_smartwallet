const express = require("express");
const router = express.Router();
const metasAhorroController = require("../controllers/metaAhorroController");
const token = require("../middleware/authMiddleware")


router.get("/", metasAhorroController.getMetasAhorro);
router.get("/user/:usuario_id", metasAhorroController.getMetasByUserId);
router.get("/category/:categoria_meta_id", metasAhorroController.getMetasByCategoria);
router.post("/create", token.verificarToken  ,metasAhorroController.postMetaAhorro);
router.put("/update/:meta_id", metasAhorroController.putMetaAhorro);
router.put("/updateMonto/:meta_id", metasAhorroController.putMontoActual);
router.delete("/delete/:meta_id", metasAhorroController.deleteMetaAhorro);

module.exports = router;
