const Gasto = require("../models/gastos");

const getGastos = (req, res) => {
  Gasto.getAll((err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los Gastos" });
    }
    res.status(200).json(data);
  });
};

const getGastoByUserId = (req, res) => {
  const { usuario_id } = req.params;

  Gasto.getByUserId(usuario_id, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener los gastos del usuario" });
    }
    res.status(200).json(data);
  });
};

const getGastoByCategoria = (req, res) => {
  const { categoria_gasto_id } = req.params;

  Gasto.getByCategoriaId(categoria_gasto_id, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener los gastos" });
    }
    res.status(200).json(data);
  });
};

const postGasto = (req, res) => {
  const { monto, categoria_gasto_id, descripcion } = req.body;
  const usuario_id = req.userId; // Obtenemos usuario_id del token

  // Datos para crear el nuevo gasto
  const nuevoGasto = {
    monto,
    categoria_gasto_id,
    descripcion,
  };

  // Llamamos al modelo para crear el gasto
  Gasto.create(usuario_id, nuevoGasto, (err, data) => {
    if (err) {
      console.error(`Error al crear gasto: ${err}`);
      return res.status(500).json({ error: "Error al crear gasto" });
    }

    // Lógica para agregar puntos cuando se añade un gasto
    const puntos = 10; // Número de puntos por gasto (ajustar según sea necesario)

    // Actualizar puntos después de crear el gasto
    Gasto.agregarPuntos(usuario_id, puntos, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar los puntos" });
      }

      // Devuelves los puntos obtenidos junto con el gasto creado
      res.status(201).json({
        message: "Gasto añadido exitosamente y puntos actualizados",
        data: data,
        puntos: puntos,  // Devuelves los puntos obtenidos
      });
    });
  });
};


const putGasto = (req, res) => {
  const { id_gasto } = req.params;
  const { monto, categoria_gasto_id, descripcion } = req.body;

  // Extrae el usuario_id del token en la solicitud
  const usuario_id = req.userId;

  if (!usuario_id || !monto || !categoria_gasto_id || !descripcion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const updateData = { monto, categoria_gasto_id, descripcion };

  Gasto.updateData(id_gasto, usuario_id, updateData, (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al actualizar gasto", detalles: err });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: "No tienes permiso para editar este gasto o no existe",
      });
    }

    res.status(200).json({
      message: "Gasto actualizado correctamente",
      result: result,
    });
  });
};

const deleteGasto = (req, res) => {
  const { id_gasto } = req.params;

  Gasto.delete(id_gasto, (err, data) => {
    if (err) {
      console.error(`Error al eliminar el Gasto: ${err}`);
      return res.status(500).json({ error: "Error al eliminar el Gasto" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    res.status(200).json({ message: "Gasto eliminado exitosamente" });
  });
};

module.exports = {
  getGastos,
  getGastoByUserId,
  getGastoByCategoria,
  postGasto,
  putGasto,
  deleteGasto,
};
