const express = require('express');
const router = express.Router();
const categoriaModulosController = require('../controllers/categoriasModulosController');

router.get("/", categoriaModulosController.getCategoriasModulos);
router.post("/create", categoriaModulosController.postCategoriaModulo);
router.put("/update/:categoria_modulo_id", categoriaModulosController.putCategoriasModulos);
router.delete("/delete/:categoria_modulo_id", categoriaModulosController.deleteCategoriasModulos);

module.exports = router
