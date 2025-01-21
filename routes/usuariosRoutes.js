const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosControllers');
const { verificarToken } = require('../middleware/authMiddleware');

router.get("/", usuariosController.getUsuarios);
router.get("/info", usuariosController.getInfoUsuarios);
router.post("/register", usuariosController.createUsuarios);
router.get("/paginados", usuariosController.getUsuariosPaginados);
router.post("/login", usuariosController.loginUsuario)
router.put("/update/:usuario_id", usuariosController.putUsuario)
router.delete("/delete/:usuario_id", usuariosController.deleteUsuario)
router.post("/suscripcion/:usuario_id", verificarToken,  usuariosController.canjearRecompensaPremium)
router.get('/puntos/:usuario_id', verificarToken, usuariosController.getPuntosUsuario);
router.get('/info-user/:id', verificarToken , usuariosController.getUsuarioById);
router.get('/info-user/cookbook/:id', usuariosController.getUsuarioById);


module.exports = router