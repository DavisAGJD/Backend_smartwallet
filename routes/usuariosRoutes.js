const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosControllers");
const { verificarToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", usuariosController.getUsuarios);
router.get("/info", usuariosController.getInfoUsuarios);
router.get(
  "/cookbook/info-user/:id",
  usuariosController.getUsuarioByIdCookBook
);
router.post("/register", usuariosController.createUsuarios);
router.get("/paginados", usuariosController.getUsuariosPaginados);
router.post("/login", usuariosController.loginUsuario);
router.post("/logout", verificarToken, usuariosController.logoutUsuario);
router.put("/update/:usuario_id", usuariosController.putUsuario);
router.delete("/delete/:usuario_id", usuariosController.deleteUsuario);
router.post(
  "/suscripcion/:usuario_id",
  verificarToken,
  usuariosController.canjearRecompensaPremium
);
router.get(
  "/puntos/:usuario_id",
  verificarToken,
  usuariosController.getPuntosUsuario
);
router.get("/info-user/:id", verificarToken, usuariosController.getUsuarioById);

// Nueva ruta para actualizar la imagen del usuario
router.put(
  "/update-image/:usuario_id",
  verificarToken,
  upload.single("image"),
  usuariosController.updateUsuarioImage
);


// Nueva ruta para obtener datos para la gráfica de usuarios
router.get("/grafica-usuarios", usuariosController.getGraficaUsuarios);
router.get(
  "/gastoYSalario",
  verificarToken,
  usuariosController.getGastosYSalario
);

module.exports = router;
