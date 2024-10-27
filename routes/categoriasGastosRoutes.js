const express = require("express");
const router = express.Router();
const categoriaGastosController = require("../controllers/categoriaGastosController");

router.get("/", categoriaGastosController.getCategoriasGastos);
router.post("/create", categoriaGastosController.postCategoriasGastos);
router.put("/update/:categoria_gasto_id", categoriaGastosController.putCategoriasGastos);
router.delete("/delete/:categoria_gasto_id", categoriaGastosController.deleteCategoriasGastos);

module.exports = router;
