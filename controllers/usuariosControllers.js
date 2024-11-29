const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const getUsuarios = (req, res) => {
  Usuario.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
    res.status(200).json(data);
  });
};

const getInfoUsuarios = (req, res) => {
  // Ejecuta todas las consultas en paralelo
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

        // Devuelve todos los datos como un objeto
        res.status(200).json({
          totalUsuarios,
          usuariosMes,
          graficaUsuarios,
        });
      });
    });
  });
};

const createUsuarios = (req, res) => {
  const { nombre_usuario, email, password_usuario } = req.body;

  const hashedPassword = bcrypt.hashSync(password_usuario, 8);

  const nuevoUsuario = {
    nombre_usuario,
    email,
    password_usuario: hashedPassword,
  };

  Usuario.create(nuevoUsuario, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error al crear usuario" });
      console.error(`El error es ${err}`);
    }

    res.status(201).json({
      message: "Usuario creado exitosamente",
    });
  });
};

const loginUsuario = (req, res) => {
  const { email, password_usuario } = req.body;

  // Buscar usuario por email
  Usuario.getByEmail(email, (err, user) => {
    if (err || !user) {
      console.error(`El error es ${err}`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verifica que el campo de contraseña no sea undefined
    if (!user.password_usuario) {
      return res
        .status(500)
        .json({ error: "Error en el servidor: contraseña no definida" });
    }

    // Comparar contraseñas
    const passwordIsValid = bcrypt.compareSync(
      password_usuario,
      user.password_usuario
    );
    if (!passwordIsValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const today = new Date();
    let streak = user.racha || 0; // Inicializamos la racha desde el campo de racha

    if (user.first_login) {
      // Si tiene primer login registrado, comparamos las fechas
      const firstLoginDate = new Date(user.first_login);
      const lastLoginDate = new Date(user.last_login);

      const diffTime = today - lastLoginDate; // Diferencia en milisegundos
      const diffDays = diffTime / (1000 * 3600 * 24); // Diferencia en días

      if (diffDays === 1) {
        // Si el último login fue ayer, incrementamos la racha
        streak += 1;
      } else if (diffDays > 1) {
        // Si han pasado más de 1 día, reiniciamos la racha
        streak = 1;
      }
    } else {
      // Si es el primer login, inicializamos el primer login y la racha a 1
      streak = 1;
    }

    // Actualizamos la fecha de last_login y la racha
    Usuario.updateLoginInfo(user.usuario_id, today, today, streak, (updateErr, result) => {
      if (updateErr) {
        console.error("Error al actualizar la racha:", updateErr);
        return res.status(500).json({ error: "Error al actualizar la racha" });
      }

      // Generamos el token JWT
      const token = jwt.sign(
        { id: user.usuario_id, rol: user.rol }, // Incluye el rol en el token
        process.env.JWT_SECRET,
        {
          expiresIn: 86400, // 24 horas
        }
      );

      res.status(200).json({
        message: "Login exitoso",
        token: token, // Enviar token al cliente
        racha: streak, // Enviar la racha al cliente
        rol: user.rol, // Enviar rol al cliente
      });
    });
  });
};


const putUsuario = (req, res) => {
  const { usuario_id } = req.params;
  const { nombre_usuario, email, password_usuario, ingresos } = req.body;

  // Construir dinámicamente los datos a actualizar
  let updateData = {};

  if (nombre_usuario) {
    updateData.nombre_usuario = nombre_usuario;
  }

  if (email) {
    updateData.email = email;
  }

  if (password_usuario) {
    // Encriptar la nueva contraseña
    const hashedPassword = bcrypt.hashSync(password_usuario, 8);
    updateData.password_usuario = hashedPassword;
  }

  if (ingresos !== undefined) {
    // Asegurarse de incluir el campo ingresos si está en el cuerpo de la solicitud
    updateData.ingresos = ingresos;
  }

  // Verificar si hay campos para actualizar
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No hay campos para actualizar" });
  }

  // Llamar al modelo para actualizar los datos del usuario
  Usuario.updateData(usuario_id, updateData, (err, result) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error al actualizar usuario", detalles: err });
      console.error(`El error es ${err}`);
      return;
    }

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      result: result,
    });
  });
};

const deleteUsuario = (req, res) => {
  const { usuario_id } = req.params;

  // Eliminar las metas de ahorro relacionadas con el usuario
  const deleteMetasQuery = "DELETE FROM metas_de_ahorro WHERE usuario_id = ?";
  db.query(deleteMetasQuery, [usuario_id], (err) => {
    if (err) {
      console.error(`Error al eliminar metas de ahorro del usuario: ${err}`);
      return res
        .status(500)
        .json({ error: "Error al eliminar metas de ahorro del usuario" });
    }

    // Eliminar los gastos relacionados con el usuario
    const deleteGastosQuery = "DELETE FROM gastos WHERE usuario_id = ?";
    db.query(deleteGastosQuery, [usuario_id], (err) => {
      if (err) {
        console.error(`Error al eliminar gastos del usuario: ${err}`);
        return res
          .status(500)
          .json({ error: "Error al eliminar gastos del usuario" });
      }

      // Después de eliminar las dependencias, eliminar el usuario
      Usuario.delete(usuario_id, (err, data) => {
        if (err) {
          console.error(`Error al eliminar el usuario: ${err}`);
          return res
            .status(500)
            .json({ error: "Error al eliminar el usuario" });
        }

        if (data.affectedRows === 0) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({
          message: "Usuario, gastos y metas de ahorro eliminados exitosamente",
        });
      });
    });
  });
};

// Endpoint para canjear la recompensa
const canjearRecompensaPremium = (req, res) => {
  const usuario_id = req.userId; // El ID del usuario del middleware
  const puntosRequeridos = 100;

  // Comprobar si el usuario tiene suficientes puntos
  const query = `SELECT puntos FROM usuarios WHERE usuario_id = ?`;
  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error("Error al obtener los puntos del usuario:", err);
      return res.status(500).json({ error: "Error al obtener los puntos" });
    }

    const puntosUsuario = results[0].puntos;
    if (puntosUsuario < puntosRequeridos) {
      return res.status(400).json({
        error: "No tienes suficientes puntos para canjear esta recompensa.",
      });
    }

    // Restar los puntos y actualizar la suscripción
    const nuevaFechaVencimiento = new Date();
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 2); // Agregar 2 días

    const updateQuery = `UPDATE usuarios SET puntos = puntos - ?, tipo_suscripcion = 'premium', fecha_vencimiento_premium = ? WHERE usuario_id = ?`;
    db.query(
      updateQuery,
      [puntosRequeridos, nuevaFechaVencimiento, usuario_id],
      (err, result) => {
        if (err) {
          console.error("Error al actualizar la suscripción:", err);
          return res
            .status(500)
            .json({ error: "Error al actualizar la suscripción" });
        }

        return res
          .status(200)
          .json({ message: "Recompensa canjeada exitosamente" });
      }
    );
  });
};

const getPuntosUsuario = (req, res) => {
  const { usuario_id } = req.params;

  // Consultar los puntos del usuario en la base de datos
  const query = "SELECT puntos FROM usuarios WHERE usuario_id = ?";

  db.query(query, [usuario_id], (err, result) => {
    if (err) {
      console.error(`Error al obtener los puntos del usuario: ${err}`);
      return res
        .status(500)
        .json({ error: "Error al obtener los puntos del usuario" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Devolver los puntos al cliente
    res.status(200).json({ puntos: result[0].puntos, usuario_id: usuario_id });
  });
};

const getUsuarioById = (req, res) => {
  const usuarioId = req.params.id; // ID del usuario desde la ruta
  const tokenUsuarioId = req.usuarioId; // ID extraído del token

  if (usuarioId !== tokenUsuarioId) {
    return res
      .status(403)
      .json({ error: "No tienes permisos para acceder a estos datos" });
  }

  // Buscar el usuario en la base de datos usando el ID
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

module.exports = {
  getUsuarios,
  getInfoUsuarios,
  getUsuarioById,
  createUsuarios,
  loginUsuario,
  putUsuario,
  deleteUsuario,
  canjearRecompensaPremium,
  getPuntosUsuario,
};
