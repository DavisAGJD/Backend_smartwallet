const CategoriaGasto = require("../models/categoriasGastos");

const getCategoriasGastos = (req, res) => {
  CategoriaGasto.getAll((err, data) => {
    if (err) {
      console.error(`El error es ${err}`);
      return res.status(500).json({ error: "Error al obtener categorias" });
    }
    res.status(200).json(data);
  });
};

const postCategoriasGastos = (req, res) => {
  const { nombre_categoria } = req.body;

  if (!nombre_categoria) {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es requerido" });
  }

  const nuevaCategoriaGasto = {
    nombre_categoria,
  };

  CategoriaGasto.create(nuevaCategoriaGasto, (err, data) => {
    if (err) {
      res.status(500).json({ error: "Error al crear la categoria meta" });
      console.error(`El error es ${err}`);
    }

    res.status(201).json({
      message: "Categoria meta creada exitosamente",
    });
  });
};

const putCategoriasGastos = (req, res) => {
  const { categoria_gasto_id } = req.params;
  const { nombre_categoria } = req.body;

  if (!categoria_gasto_id || !nombre_categoria) {
    return res
      .status(400)
      .json({ error: "ID de categoría o nombre no proporcionado" });
  }

  let updateData = { nombre_categoria };

  CategoriaGasto.update(categoria_gasto_id, updateData, (err, result) => {
    if (err) {
      res
        .status(500)
        .json({ error: "Error al actualizar la categoria", detalles: err });
      console.error(`El error es ${err}`);
    }

    res.status(200).json({
      message: "Categoria actualizada correctamente",
      result: result,
    });
  });
};

const deleteCategoriasGastos = (req, res) => {
  const { categoria_gasto_id } = req.params;

  if (!categoria_gasto_id) {
    return res.status(400).json({ error: "ID de categoría no proporcionado" });
  }

  CategoriaGasto.delete(categoria_gasto_id, (err, data) => {
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
  getCategoriasGastos,
  postCategoriasGastos,
  putCategoriasGastos,
  deleteCategoriasGastos
};
