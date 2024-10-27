const express = require('express');
const router = express.Router();
const categoriaMetasController = require('../controllers/categoriaMetasController')

router.get("/", categoriaMetasController.getCategoriasMetas)
router.post("/create", categoriaMetasController.postCategoriasMetas)
router.put("/update/:categoria_meta_id", categoriaMetasController.putCategoriasMetas)
router.delete("/delete/:categoria_meta_id", categoriaMetasController.deleteCategoriasMetas)

module.exports = router