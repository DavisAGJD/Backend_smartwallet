const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosControllers')

router.get("/", usuariosController.getUsuarios);
router.get("/info", usuariosController.getInfoUsuarios);
router.post("/register", usuariosController.createUsuarios);
router.post("/login", usuariosController.loginUsuario)
router.put("/update/:usuario_id", usuariosController.putUsuario)
router.delete("/delete/:usuario_id", usuariosController.deleteUsuario)

module.exports = router