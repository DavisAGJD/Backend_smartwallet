const express = require("express");
const router = express.Router();
const modulosController = require("../controllers/modulosController");

router.get("/", modulosController.getModulos);
router.get(
  "/category/:categoria_modulo_id",
  modulosController.getModulosByCategoria
);
router.post("/create", modulosController.postModulos);
router.put("/update/:modulo_id", modulosController.putModulos);
router.delete("/delete/:modulo_id", modulosController.deleteModulos);

module.exports = router;
