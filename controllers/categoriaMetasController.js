const categoriaMeta = require("../models/categoriasMetas");

const getCategoriasMetas = (req, res) => {
  categoriaMeta.getAll((err, data) => {
    if (err) {
      console.error(`El error es ${err}`);
      return res.status(500).json({ error: "Error al obtener categorias" });
    }
    res.status(200).json(data);
  });
};

const postCategoriasMetas = (req, res) => {
  const { nombre_categoria } = req.body;

  if (!nombre_categoria) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es requerido" });
  }

  const nuevaCategoriaMeta = {
    nombre_categoria,
  };

  categoriaMeta.create(nuevaCategoriaMeta, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error al crear la categoria meta" });
      console.error(`El error es ${err}`);
    }

    res.status(201).json({
      message: "Categoria meta creada exitosamente",
    });
  });
};

const putCategoriasMetas = (req, res) => {
  const { categoria_meta_id } = req.params;
  const { nombre_categoria } = req.body;

  if (!categoria_meta_id || !nombre_categoria) {
    return res
      .status(400)
      .json({ error: "ID de categoría o nombre no proporcionado" });
  }

  let updateData = { nombre_categoria };

  categoriaMeta.update(categoria_meta_id, updateData, (err, result) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error al actualizar la categoria", detalles: err });
      console.error(`El error es ${err}`);
    }

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      result: result,
    });
  });
};

const deleteCategoriasMetas = (req, res) => {
  const { categoria_meta_id } = req.params;

  if (!categoria_meta_id) {
    return res.status(400).json({ error: "ID de categoría no proporcionado" });
  }

  categoriaMeta.delete(categoria_meta_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar la categoria: ${err}`);
      return res.status(500).json({ error: "Error al eliminar la categoria" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Categoria no encontrada" });
    }

    res.status(200).json({ message: "Categoria eliminada exitosamente" });
  });
};

module.exports = {
  getCategoriasMetas,
  postCategoriasMetas,
  putCategoriasMetas,
  deleteCategoriasMetas
};
