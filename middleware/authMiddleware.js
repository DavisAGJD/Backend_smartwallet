const jwt = require("jsonwebtoken");
const { blacklistedTokens } = require("../controllers/usuariosControllers");

// Middleware de verificación de token
const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token no proporcionado" });

  // Verificar si el token se encuentra en la lista negra
  if (blacklistedTokens.includes(token)) {
    return res.status(403).json({ error: "Token revocado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.userId = decoded.id;
    req.rol = decoded.rol; // Almacena el rol del usuario
    next();
  });
};

const verificarAdmin = (req, res, next) => {
  if (req.rol !== "admin") {
    return res
      .status(403)
      .json({ error: "No tienes permiso para acceder a esta ruta" });
  }
  next();
};

module.exports = { verificarToken, verificarAdmin };
