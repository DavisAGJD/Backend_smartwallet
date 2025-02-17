const Gasto = require("../models/gastos");
const { analyzeTicket } = require("../scripts/ticketProcessor");
const { v4: uuidv4 } = require("uuid");
const pendingTransactions = new Map();

function logError(message, error = null) {
  const timeStamp = new Date().toISOString();
  console.error(`[${timeStamp}] ERROR: ${message}`);
  if (error) {
    console.error("Detalles del error:", error);
  }
}

const postGastoFromScan = async (req, res) => {
  try {
    // 1. Verificar autenticación
    const usuario_id = req.userId;
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    // 2. Procesar imagen (usando req.file.buffer)
    const scanResult = await analyzeTicket(req.file.buffer);

    // 3. Validar resultados del escaneo
    if (!scanResult.total || !scanResult.tienda) {
      const errorMsg = "No se pudo detectar el total o la tienda en el ticket";
      logError(`${errorMsg}. OCR: ${scanResult.texto_ocr}`);
      return res.status(400).json({
        error: errorMsg,
        texto_ocr: scanResult.texto_ocr,
      });
    }

    // 4. Crear objeto gasto temporal
    const nuevoGasto = {
      monto: scanResult.total,
      categoria_gasto_id: 11,
      descripcion: `Compra en ${scanResult.tienda}`,
    };

    // 5. Generar ID de transacción y almacenar temporalmente
    const transactionId = uuidv4();
    pendingTransactions.set(transactionId, {
      usuario_id,
      nuevoGasto,
      scanResult,
    });

    // 6. Responder con datos para confirmación
    res.status(200).json({
      message: "Confirma el gasto",
      data: {
        detalles_scan: {
          tienda: scanResult.tienda,
          total_escaneado: scanResult.total,
        },
        transactionId,
      },
    });
  } catch (error) {
    console.error("Error en el controlador:", error.message);
    logError(`Error en postGastoFromScan: ${error.stack}`);
    res.status(500).json({ error: error.message });
  }
};

const confirmGasto = async (req, res) => {
  const { transactionId, confirm } = req.body;
  let transaction;
  try {
    transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transacción no válida o expirada" });
    }
    const { usuario_id, nuevoGasto, scanResult } = transaction;
    if (confirm) {
      // 1. Crear gasto en BD
      const gastoData = await new Promise((resolve, reject) => {
        Gasto.create(usuario_id, nuevoGasto, (err, data) => {
          if (err) reject(new Error("Error al crear gasto"));
          resolve(data);
        });
      });
      // 2. Actualizar puntos
      await new Promise((resolve, reject) => {
        Gasto.agregarPuntos(usuario_id, 10, (err, result) => {
          if (err) reject(new Error("Error al actualizar puntos"));
          resolve();
        });
      });
      res.status(201).json({
        message: "Gasto confirmado exitosamente",
        data: {
          ...gastoData,
          detalles_scan: {
            tienda: scanResult.tienda,
            total_escaneado: scanResult.total,
          },
        },
        puntos: 10,
      });
    } else {
      res.status(200).json({ message: "Gasto cancelado" });
    }
  } catch (error) {
    console.error("Error en confirmación:", error.message);
    logError(`Error en confirmGasto: ${error.stack}`);
    res.status(500).json({ error: error.message });
  } finally {
    pendingTransactions.delete(transactionId);
  }
};

module.exports = { postGastoFromScan, confirmGasto };
