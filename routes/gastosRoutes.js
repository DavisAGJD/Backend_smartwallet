const express = require("express");
const router = express.Router();
const gastosController = require("../controllers/gastoController");
const token = require("../middleware/authMiddleware")

router.get("/", gastosController.getGastos);
router.get("/user/:usuario_id",gastosController.getGastoByUserId);
router.get("/category/:categoria_gasto_id", gastosController.getGastoByCategoria);
router.post("/create", token.verificarToken ,gastosController.postGasto);
router.put("/update/:id_gasto", token.verificarToken, gastosController.putGasto);
router.delete("/delete/:id_gasto", gastosController.deleteGasto);
router.get("/paginados", gastosController.getGastosPaginados);
router.post("/gastoScan", token.verificarToken, gastosController.postGastoFromScan);

module.exports = router;
