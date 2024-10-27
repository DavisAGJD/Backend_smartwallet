const jwt = require("jsonwebtoken");

// Middleware de verificación de token
const verificarToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extrae el token del header
  if (!token) return res.status(403).json({ error: "Token no proporcionado" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.userId = decoded.id; // Guarda el ID de usuario para la solicitud
    next();
  });
};

module.exports = { verificarToken };
