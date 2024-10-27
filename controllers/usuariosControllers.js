const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const getUsuarios = (req, res) => {
  Usuario.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
    res.status(200).json(data);
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
      return res.status(500).json({ error: "Error en el servidor: contraseña no definida" });
    }

    // Comparar contraseñas
    const passwordIsValid = bcrypt.compareSync(
      password_usuario,
      user.password_usuario
    );
    if (!passwordIsValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user.usuario_id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 horas
    });

    res.status(200).json({
      message: "Login exitoso",
      token: token, // Enviar token al cliente
    });
  });
};

const putUsuario = (req, res) => {
  const { usuario_id } = req.params;
  const { nombre_usuario, email, password_usuario } = req.body;

  // Verificar si el usuario está proporcionando una nueva contraseña
  let updateData = { nombre_usuario, email };

  if (password_usuario) {
    // Encriptar la nueva contraseña
    const hashedPassword = bcrypt.hashSync(password_usuario, 8);
    updateData.password_usuario = hashedPassword; // Agregar contraseña encriptada a los datos a actualizar
  }

  // Llamar al modelo para actualizar los datos del usuario
  Usuario.updateData(usuario_id, updateData, (err, result) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error al actualizar usuario", detalles: err });
      console.error(`El error es ${err}`);
    }

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      result: result,
    });
  });
};

const deleteUsuario = (req, res) => {
  const { usuario_id } = req.params;

  Usuario.delete(usuario_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar el usuario: ${err}`);
      return res.status(500).json({ error: "Error al eliminar el usuario" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  });
};

module.exports = {
  getUsuarios,
  createUsuarios,
  loginUsuario,
  putUsuario,
  deleteUsuario,
};
