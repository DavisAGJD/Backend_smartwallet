const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();
const { uploadImageToCloudinary } = require("../models/cloudinaryService"); // Añade esto al inicio
const multer = require("multer");
let blacklistedTokens = [];

// Obtener todos los usuarios
const getUsuarios = (req, res) => {
  Usuario.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
    res.status(200).json(data);
  });
};

// Obtener información general de los usuarios (total, del mes actual, gráfica)
const getInfoUsuarios = (req, res) => {
  Usuario.getTotalUsuarios((err, totalUsuarios) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener el total de usuarios" });
    }

    Usuario.getUsuariosMesActual((err, usuariosMes) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener usuarios del mes actual" });
      }

      Usuario.getGraficaUsuarios((err, graficaUsuarios) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error al obtener datos para la gráfica" });
        }

        res.status(200).json({
          totalUsuarios,
          usuariosMes,
          graficaUsuarios,
        });
      });
    });
  });
};

// Crear un nuevo usuario
const createUsuarios = (req, res) => {
  const { nombre_usuario, email, password_usuario, image } = req.body; // Añade image

  const hashedPassword = bcrypt.hashSync(password_usuario, 8);

  const nuevoUsuario = {
    nombre_usuario,
    email,
    password_usuario: hashedPassword,
    image, // Añade image
  };

  Usuario.create(nuevoUsuario, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al crear usuario" });
    }

    res.status(201).json({ message: "Usuario creado exitosamente" });
  });
};

// Login de usuario
const loginUsuario = (req, res) => {
  const { email, password_usuario } = req.body;

  Usuario.getByEmail(email, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (!user.password_usuario) {
      return res
        .status(500)
        .json({ error: "Error en el servidor: contraseña no definida" });
    }

    const passwordIsValid = bcrypt.compareSync(
      password_usuario,
      user.password_usuario
    );
    if (!passwordIsValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.usuario_id, rol: user.rol },
      process.env.JWT_SECRET,
      {
        expiresIn: 86400,
      }
    );

    res.status(200).json({
      message: "Login exitoso",
      token,
      rol: user.rol,
    });
  });
};

const logoutUsuario = (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(400)
      .json({ error: "No se proporcionó token de autenticación" });
  }

  // Agregar el token a la lista negra para invalidarlo
  blacklistedTokens.push(token);

  res.status(200).json({ message: "Logout exitoso. Token invalidado." });
};

// Actualizar un usuario
const putUsuario = (req, res) => {
  const { usuario_id } = req.params;
  const { nombre_usuario, email, password_usuario, ingresos, image } = req.body; // Añade image

  let updateData = {};

  if (nombre_usuario) updateData.nombre_usuario = nombre_usuario;
  if (email) updateData.email = email;
  if (password_usuario)
    updateData.password_usuario = bcrypt.hashSync(password_usuario, 8);
  if (ingresos !== undefined) updateData.ingresos = ingresos;
  if (image) updateData.image = image; // Añade image

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  Usuario.updateData(usuario_id, updateData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error al actualizar usuario" });
    }

    res.status(200).json({ message: "Usuario actualizado correctamente" });
  });
};

// Eliminar un usuario
const deleteUsuario = (req, res) => {
  const { usuario_id } = req.params;

  db.query(
    "DELETE FROM metas_de_ahorro WHERE usuario_id = ?",
    [usuario_id],
    (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al eliminar metas de ahorro del usuario" });
      }

      db.query(
        "DELETE FROM gastos WHERE usuario_id = ?",
        [usuario_id],
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error al eliminar gastos del usuario" });
          }

          Usuario.delete(usuario_id, (err, data) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Error al eliminar el usuario" });
            }

            if (data.affectedRows === 0) {
              return res.status(404).json({ message: "Usuario no encontrado" });
            }

            res.status(200).json({ message: "Usuario eliminado exitosamente" });
          });
        }
      );
    }
  );
};

// Canjear recompensa premium
const canjearRecompensaPremium = (req, res) => {
  const usuario_id = req.userId;
  const puntosRequeridos = 100;

  db.query(
    "SELECT puntos FROM usuarios WHERE usuario_id = ?",
    [usuario_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error al obtener los puntos" });
      }

      if (results[0].puntos < puntosRequeridos) {
        return res.status(400).json({ error: "No tienes suficientes puntos" });
      }

      const nuevaFechaVencimiento = new Date();
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 2);

      db.query(
        "UPDATE usuarios SET puntos = puntos - ?, tipo_suscripcion = 'premium', fecha_vencimiento_premium = ? WHERE usuario_id = ?",
        [puntosRequeridos, nuevaFechaVencimiento, usuario_id],
        (err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error al actualizar la suscripción" });
          }

          res.status(200).json({ message: "Recompensa canjeada exitosamente" });
        }
      );
    }
  );
};

// Obtener puntos de un usuario
const getPuntosUsuario = (req, res) => {
  const { usuario_id } = req.params;

  db.query(
    "SELECT puntos FROM usuarios WHERE usuario_id = ?",
    [usuario_id],
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener los puntos del usuario" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.status(200).json({ puntos: result[0].puntos });
    }
  );
};

const updateUsuarioImage = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    if (!usuario_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    const imageUrl = await uploadImageToCloudinary(req.file.buffer);

    db.query(
      "UPDATE usuarios SET image = ? WHERE usuario_id = ?",
      [imageUrl, usuario_id],
      (err, result) => {
        if (err) {
          console.error("Error en BD:", err.message);
          return res.status(500).json({ error: "Error al actualizar imagen" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({
          message: "Imagen actualizada exitosamente",
          imageUrl: imageUrl,
        });
      }
    );
  } catch (error) {
    console.error("Error crítico:", error.message);
    res.status(500).json({
      error: error.message.startsWith("La imagen")
        ? error.message
        : "Error interno al procesar imagen",
    });
  }
};

// Obtener datos de la gráfica de usuarios
const getGraficaUsuarios = (req, res) => {
  db.query(
    "SELECT DATE_FORMAT(fecha_registro, '%Y-%m') AS mes, COUNT(*) AS cantidad FROM usuarios GROUP BY mes ORDER BY mes DESC",
    (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener datos de la gráfica" });
      }

      res.status(200).json(result);
    }
  );
};

// Obtener un usuario por su ID
const getUsuarioById = (req, res) => {
  const usuarioId = req.params.id; // ID del usuario desde la ruta
  const tokenUsuarioId = req.userId; // ID extraído del token

  if (usuarioId == tokenUsuarioId) {
    Usuario.getById(usuarioId, (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener la información del usuario" });
      }

      if (!data) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.status(200).json(data); // Devolver los datos del usuario
    });
  } else {
    return res
      .status(403)
      .json({ error: "No tienes permisos para acceder a estos datos" });
  }
};

// Obtener usuarios paginados
const getUsuariosPaginados = (req, res) => {
  const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
  const limit = parseInt(req.query.limit) || 10; // Límite de elementos por página (por defecto 10)
  const offset = (page - 1) * limit; // Cálculo del offset

  Usuario.getUsuariosPaginados(offset, limit, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener usuarios paginados" });
    }

    Usuario.getTotalUsuarios((err, total) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener el total de usuarios" });
      }

      const totalPages = Math.ceil(total / limit); // Calcular el número total de páginas

      res.status(200).json({
        data: data,
        pagination: {
          total: total,
          page: page,
          pageSize: limit,
          totalPages: totalPages,
        },
      });
    });
  });
};

// Obtener un usuario por su ID (para CookBook)
const getUsuarioByIdCookBook = (req, res) => {
  const usuarioId = req.params.id; // ID del usuario desde la ruta

  Usuario.getById(usuarioId, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener la información del usuario" });
    }

    if (!data) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json(data); // Devolver los datos del usuario
  });
};

const getGastosYSalario = (req, res) => {
  const usuario_id = req.userId; // Se asume que el middleware de autenticación asigna req.userId
  Usuario.getGastosYSalario(usuario_id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      return res
        .status(500)
        .json({ error: "Error al obtener datos financieros" });
    }
    res.status(200).json(data);
  });
};

module.exports = {
  getUsuarios,
  getInfoUsuarios,
  createUsuarios,
  loginUsuario,
  putUsuario,
  deleteUsuario,
  canjearRecompensaPremium,
  getPuntosUsuario,
  updateUsuarioImage,
  getGraficaUsuarios,
  getUsuarioById,
  getUsuariosPaginados,
  getUsuarioByIdCookBook,
  logoutUsuario,
  blacklistedTokens,
  getGastosYSalario,
};
