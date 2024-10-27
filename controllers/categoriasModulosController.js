const categoriaModulo = require("../models/categoriasModulos");

const getCategoriasModulos = (req, res) => {
  categoriaModulo.getAll((err, data) => {
    if (err) {
      console.error(`El error es ${err}`);
      return res.status(500).json({ error: "Error al obtener categorias" });
    }
    res.status(200).json(data);
  });
};

const postCategoriaModulo = (req, res) => {
  const { nombre_categoria } = req.body;

  if (!nombre_categoria) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es requerido" });
  }

  const nuevaCategoriaMeta = {
    nombre_categoria,
  };

  categoriaModulo.create(nuevaCategoriaMeta, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error al crear la categoria modulo" });
      console.error(`El error es ${err}`);
    }

    res.status(201).json({
      message: "Categoria modulo creada exitosamente",
    });
  });
};

const putCategoriasModulos = (req, res) => {
  const { categoria_modulo_id } = req.params;
  const { nombre_categoria } = req.body;

  if (!categoria_modulo_id || !nombre_categoria) {
    return res
      .status(400)
      .json({ error: "ID de categoría o nombre no proporcionado" });
  }

  let updateData = { nombre_categoria };

  categoriaModulo.update(categoria_modulo_id, updateData, (err, result) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error al actualizar la categoria", detalles: err });
      console.error(`El error es ${err}`);
    }

    res.status(200).json({
      message: "Categoria modulo actualizado correctamente",
      result: result,
    });
  });
};

const deleteCategoriasModulos = (req, res) => {
    const { categoria_modulo_id } = req.params;
  
    if (!categoria_modulo_id) {
      return res.status(400).json({ error: "ID de categoría no proporcionado" });
    }
  
    categoriaModulo.delete(categoria_modulo_id, (err, data) => {
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
  getCategoriasModulos,
  postCategoriaModulo,
  putCategoriasModulos,
  deleteCategoriasModulos,
};
