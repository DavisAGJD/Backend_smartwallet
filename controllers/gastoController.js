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
        return res
          .status(500)
          .json({ error: "Error al actualizar los puntos" });
      }

      // Devuelves los puntos obtenidos junto con el gasto creado
      res.status(201).json({
        message: "Gasto añadido exitosamente y puntos actualizados",
        data: data,
        puntos: puntos, // Devuelves los puntos obtenidos
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

const getGastosPaginados = (req, res) => {
  const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
  const limit = parseInt(req.query.limit) || 10; // Límite de elementos por página (por defecto 10)
  const offset = (page - 1) * limit; // Cálculo del offset

  // Llamar al modelo para obtener los gastos paginados
  Gasto.getGastosPaginados(offset, limit, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener gastos paginados" });
    }

    // Obtener el total de gastos para calcular el número total de páginas
    Gasto.getTotalGastos((err, total) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener el total de gastos" });
      }

      const totalPages = Math.ceil(total / limit); // Calcular el número total de páginas

      // Respuesta con los datos paginados y metadatos
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

const getGastosPaginadosByUserId = (req, res) => {
  // Se espera que el id del usuario venga en los parámetros de la ruta
  const { usuario_id } = req.params;

  // Parámetros de paginación obtenidos de la query (por defecto: page 1, 10 elementos por página)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Se obtiene la "página" de gastos para el usuario
  Gasto.getGastosPaginadosByUserId(usuario_id, offset, limit, (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Error al obtener gastos paginados del usuario" });
    }

    // Se obtiene el total de gastos del usuario para calcular la cantidad total de páginas
    Gasto.getTotalGastosByUserId(usuario_id, (err, total) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al obtener el total de gastos del usuario" });
      }

      const totalPages = Math.ceil(total / limit);
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

const postGastoFromScan = async (req, res) => {
  try {
    // 1. Verificar autenticación (se asume que req.userId ya fue asignado por un middleware)
    const usuario_id = req.userId;

    // 2. Obtener datos del cuerpo de la petición
    const { total, tienda } = req.body;
    if (!total || !tienda) {
      return res.status(400).json({ error: "Faltan datos: total o tienda" });
    }

    // 3. Crear objeto gasto
    const nuevoGasto = {
      monto: total,
      categoria_gasto_id: 11, // Ajusta según tu lógica de categorías
      descripcion: `Compra en ${tienda}`,
    };

    // 4. Crear gasto en la base de datos (se asume que Gasto.create usa callbacks)
    const gastoData = await new Promise((resolve, reject) => {
      Gasto.create(usuario_id, nuevoGasto, (err, data) => {
        if (err) return reject(new Error("Error al crear gasto"));
        resolve(data);
      });
    });

    // 5. Actualizar puntos del usuario (por ejemplo, sumar 10 puntos)
    await new Promise((resolve, reject) => {
      Gasto.agregarPuntos(usuario_id, 10, (err, result) => {
        if (err) return reject(new Error("Error al actualizar puntos"));
        resolve();
      });
    });

    // 6. Responder indicando que el gasto se registró correctamente
    res.status(201).json({
      message: "Gasto registrado exitosamente",
      data: {
        ...gastoData,
        detalles: {
          tienda,
          total,
        },
      },
      puntos: 10,
    });
  } catch (error) {
    console.error("Error en postGastoFromScan:", error.message);
    logError(`Error en postGastoFromScan: ${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGastos,
  getGastoByUserId,
  getGastoByCategoria,
  postGasto,
  putGasto,
  deleteGasto,
  getGastosPaginados,
  postGastoFromScan,
  getGastosPaginadosByUserId,
};
