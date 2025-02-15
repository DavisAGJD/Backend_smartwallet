// controllers/gastos.js
const fs = require("fs");
const Gasto = require("../models/gastos");
const { analyzeTicket } = require("../scripts/ticketProcessor"); // Ajusta la ruta según tu estructura
const { v4: uuidv4 } = require("uuid");
const pendingTransactions = new Map();

// Función para registrar errores en el log
const path = require("path");
function logError(message) {
  const logFilePath = path.join(__dirname, "../logs/error.log");
  const timeStamp = new Date().toISOString();
  const logMessage = `[${timeStamp}] ${message}\n`;
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error("Error escribiendo en el log:", err);
  });
}

const postGastoFromScan = async (req, res) => {
  let imagePath;
  let transactionStored = false;

  try {
    // 1. Verificar autenticación
    const usuario_id = req.userId;

    // 2. Procesar imagen
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }
    imagePath = req.file.path;
    const scanResult = await analyzeTicket(imagePath);

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
      imagePath,
      scanResult,
    });
    transactionStored = true;

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
  } finally {
    // Eliminar imagen solo si no se almacenó la transacción
    if (!transactionStored && imagePath) {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Error eliminando imagen: ${err}`);
          logError(`Error eliminando imagen ${imagePath}: ${err}`);
        }
      });
    }
  }
};

const confirmGasto = async (req, res) => {
  const { transactionId, confirm } = req.body;
  let transaction; // Declarar la variable fuera del try

  try {
    transaction = pendingTransactions.get(transactionId);
    if (!transaction) {
      return res
        .status(404)
        .json({ error: "Transacción no válida o expirada" });
    }

    const { usuario_id, nuevoGasto, imagePath, scanResult } = transaction;

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
    // Limpieza siempre
    if (transaction) {
      pendingTransactions.delete(transactionId);
      if (transaction.imagePath) {
        fs.unlink(transaction.imagePath, (err) => {
          if (err) {
            console.error("Error eliminando imagen:", err);
            logError(`Error eliminando imagen ${transaction.imagePath}: ${err}`);
          }
        });
      }
    }
  }
};

module.exports = { postGastoFromScan, confirmGasto };
