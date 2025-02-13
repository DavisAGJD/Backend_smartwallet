const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const Gasto = require("../models/gastos");

const processImage = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "../scripts/scan_ticket.py");

    exec(
      `python "${pythonScript}" "${imagePath}"`,
      { maxBuffer: 5 * 1024 * 1024, encoding: "utf-8" },
      (error, stdout, stderr) => {
        if (error) {
          return reject(
            new Error(`Error en el script Python: ${error.message}`)
          );
        }
        try {
          const lines = stdout
            .split("\n")
            .filter((line) => !line.startsWith("Progress:"));
          const cleaned = lines.join("").trim();
          if (!cleaned) {
            return reject(
              new Error("No se recibió respuesta del script Python.")
            );
          }
          const result = JSON.parse(cleaned);
          resolve(result);
        } catch (e) {
          console.error("Error parseando JSON:", e.message);
          reject(new Error(`Respuesta inválida: ${stdout}`));
        }
      }
    );
  });
};

const postGastoFromScan = async (req, res) => {
  let imagePath; // Declaramos la variable fuera del bloque try para poder usarla en finally
  try {
    // 1. Verificar autenticación y obtener usuario_id
    const usuario_id = req.userId; // Asumiendo que usas un middleware de autenticación

    // 2. Procesar imagen
    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    imagePath = req.file.path;
    const scanResult = await processImage(imagePath);

    // 3. Validar resultados del escaneo
    if (!scanResult.total || !scanResult.tienda) {
      return res.status(400).json({
        error: "No se pudo detectar el total o la tienda en el ticket",
        texto_ocr: scanResult.texto_ocr,
      });
    }

    // 4. Crear objeto gasto con estructura requerida
    const nuevoGasto = {
      monto: scanResult.total,
      categoria_gasto_id: 11, // ID fijo para supermercados
      descripcion: `Compra en ${scanResult.tienda}`,
    };

    // 5. Llamar al modelo para crear el gasto y actualizar puntos
    await new Promise((resolve, reject) => {
      Gasto.create(usuario_id, nuevoGasto, (err, data) => {
        if (err) {
          return reject(new Error("Error al crear gasto"));
        }
        // 6. Actualizar puntos
        const puntos = 10;
        Gasto.agregarPuntos(usuario_id, puntos, (err, result) => {
          if (err) {
            return reject(new Error("Error al actualizar los puntos"));
          }
          // 7. Respuesta combinada
          res.status(201).json({
            message: "Gasto añadido exitosamente y puntos actualizados",
            data: {
              ...data,
              detalles_scan: {
                tienda: scanResult.tienda,
                total_escaneado: scanResult.total,
              },
            },
            puntos: puntos,
          });
          resolve();
        });
      });
    });
  } catch (error) {
    console.error("Error en el controlador:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (imagePath) {
      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error(`La imagen no existe: ${imagePath}`);
          return;
        }
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Error eliminando imagen: ${err}`);
          } else {
            console.log("Imagen eliminada correctamente");
          }
        });
      });
    }
  }
};

module.exports = { postGastoFromScan };
