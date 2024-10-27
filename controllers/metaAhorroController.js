const MetaAhorro = require("../models/metasAhorro");

const getMetasAhorro = (req, res) => {
  MetaAhorro.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener las metas" });
    }
    res.status(200).json(data);
  });
};

const getMetasByUserId = (req, res) => {
  const { usuario_id } = req.params;

  MetaAhorro.getByUserId(usuario_id, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener las metas del usuario" });
    }
    res.status(200).json(data);
  });
};

const getMetasByCategoria = (req, res) => {
  const { categoria_meta_id } = req.params;

  MetaAhorro.getByCategoriaId(categoria_meta_id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener las metas" });
    }
    res.status(200).json(data);
  });
};

const postMetaAhorro = (req, res) => {
  const {
    nombre_meta,
    monto_objetivo,
    fecha_limite,
    descripcion,
    categoria_meta_id,
  } = req.body;
  const usuario_id = req.userId; // Obtenemos usuario_id del token

  // Validación de campos obligatorios
  if (!nombre_meta || !monto_objetivo || !fecha_limite || !categoria_meta_id) {
    return res.status(400).json({
      error: "Todos los campos obligatorios deben ser proporcionados",
    });
  }

  const nuevaMeta = {
    usuario_id,
    nombre_meta,
    monto_objetivo,
    fecha_limite,
    descripcion,
    categoria_meta_id,
  };

  MetaAhorro.create(usuario_id, nuevaMeta, (err, data) => {
    if (err) {
      console.error(`Error al crear la meta: ${err}`);
      return res.status(500).json({ error: "Error al crear la meta" });
    }

    res.status(201).json({
      message: "Meta añadida exitosamente",
      data: data,
    });
  });
};

const putMetaAhorro = (req, res) => {
  const { meta_id } = req.params;

  const {
    nombre_meta,
    monto_objetivo,
    monto_actual,
    descripcion,
    estado_de_meta,
  } = req.body;

  // Verificar que meta_id sea un número válido
  if (!meta_id || isNaN(meta_id)) {
    return res.status(400).json({ error: "ID de la meta no es válido" });
  }

  // Filtrar solo los campos que están presentes en el cuerpo de la solicitud
  let updateData = {};

  if (nombre_meta) updateData.nombre_meta = nombre_meta;
  if (monto_objetivo) updateData.monto_objetivo = monto_objetivo;
  if (monto_actual) updateData.monto_actual = monto_actual;
  if (descripcion) updateData.descripcion = descripcion;
  if (estado_de_meta) updateData.estado_de_meta = estado_de_meta;

  // Verificar si hay datos para actualizar
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No hay datos para actualizar" });
  }

  // Llamar a la función de actualización en el modelo
  MetaAhorro.updateData(meta_id, updateData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al actualizar la meta", detalles: err });
    }

    // Verificar si la meta fue encontrada y actualizada
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Meta no encontrada" });
    }

    res.status(200).json({
      message: "Meta actualizada correctamente",
      result: result,
    });
  });
};

const putMontoActual = (req, res) => {
  const { meta_id } = req.params;
  const { montoAdicional } = req.body;

  if (!montoAdicional || montoAdicional <= 0) {
    return res
      .status(400)
      .json({ error: "El monto adicional debe ser positivo" });
  }

  MetaAhorro.updateMontoActual(meta_id, montoAdicional, (err, result) => {
    if (err) {
      console.error(`Error al actualizar el monto de la meta: ${err}`);
      return res.status(500).json({ error: "Error al actualizar el monto" });
    }
    res.status(200).json({ message: "Monto actualizado correctamente" });
  });
};

const deleteMetaAhorro = (req, res) => {
  const { meta_id } = req.params;

  MetaAhorro.delete(meta_id, (err, data) => {
    if (err) {
      console.error(`Error al eliminar la meta: ${err}`);
      return res.status(500).json({ error: "Error al eliminar la meta" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Meta no encontrada" });
    }

    res.status(200).json({ message: "Meta eliminada exitosamente" });
  });
};

module.exports = {
  getMetasAhorro,
  getMetasByUserId,
  getMetasByCategoria,
  postMetaAhorro,
  putMetaAhorro,
  putMontoActual,
  deleteMetaAhorro,
};
