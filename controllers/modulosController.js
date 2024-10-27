const ModuloEducativo = require("../models/modulosEducativos");
const { put } = require("../routes/gastosRoutes");

const getModulos = (req, res) => {
  ModuloEducativo.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los Modulos" });
    }
    res.status(200).json(data);
  });
};

const getModulosByCategoria = (req, res) => {
  const { categoria_modulo_id } = req.params;

  ModuloEducativo.getByCategoriaId(categoria_modulo_id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los Modulos" });
    }
    res.status(200).json(data);
  });
};

const postModulos = (req, res) => {
  const { titulo, contenido, categoria_modulo_id, imagen_modulo } = req.body;

  if (!titulo || !contenido || !categoria_modulo_id || !imagen_modulo) {
    return res.status(400).json({
      error:
        "Todos los campos (titulo, contenido, categoria_modulo_id, imagen_modulo) son obligatorios.",
    });
  }

  const nuevoModulo = {
    titulo,
    contenido,
    categoria_modulo_id,
    imagen_modulo,
  };

  ModuloEducativo.create(nuevoModulo, (err, data) => {
    if (err) {
      console.error(`Error al crear el módulo educativo: ${err}`);
      return res
        .status(500)
        .json({ error: "Error al crear el módulo educativo" });
    }

    res.status(201).json({
      message: "Módulo añadido exitosamente",
      moduloId: data.id,
    });
  });
};

const putModulos = (req, res) => {
  const { modulo_id } = req.params;
  const { titulo, contenido, categoria_modulo_id, imagen_modulo } = req.body;

  if (!modulo_id) {
    return res.status(400).json({
      error: "Se requiere el ID del módulo para actualizar.",
    });
  }

  if (!titulo || !contenido || !categoria_modulo_id || !imagen_modulo) {
    return res.status(400).json({
      error:
        "Todos los campos (titulo, contenido, categoria_modulo_id, imagen_modulo) son obligatorios.",
    });
  }

  const updateData = {
    titulo,
    contenido,
    categoria_modulo_id,
    imagen_modulo,
  };

  ModuloEducativo.updateData(modulo_id, updateData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al actualizar el módulo", detalles: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    res.status(200).json({
      message: "Módulo actualizado correctamente",
      result: result,
    });
  });
};

const deleteModulos = (req, res) => {
  const { modulo_id } = req.params;

  if (!modulo_id) {
    return res.status(400).json({
      error: "Se requiere el ID del módulo para eliminar.",
    });
  }

  ModuloEducativo.delete(modulo_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar el módulo: ${err}`);
      return res.status(500).json({ error: "Error al eliminar el módulo" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    res.status(200).json({ message: "Módulo eliminado exitosamente" });
  });
};

module.exports = {
  getModulos,
  getModulosByCategoria,
  postModulos,
  putModulos,
  deleteModulos,
};
