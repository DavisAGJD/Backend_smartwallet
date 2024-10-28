const Ingreso = require("../models/ingreso");


const getIngresoByUserId = (req, res) => {
    const { usuario_id } = req.params;
    console.log("Buscando ingreso para usuario_id:", usuario_id); // Debug
  
    Ingreso.getIngresoByUserId(usuario_id, (err, data) => {
      if (err) {
        console.error("Error en la consulta:", err); // Debug de errores
        return res.status(500).json({ error: "Error al obtener el ingreso" });
      }
      if (!data) {
        return res.status(404).json({ message: "Ingreso no encontrado para este usuario" });
      }
      res.status(200).json({ ingresos: data.ingresos });
    });
  };

  const updateIngreso = (req, res) => {
    const { usuario_id } = req.params;
    const { ingresos } = req.body;
  
    if (ingresos == null) {
      return res.status(400).json({ error: "El ingreso es obligatorio" });
    }
  
    Ingreso.updateIngreso(usuario_id, ingresos, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error al actualizar el ingreso" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json({ message: "Ingreso actualizado correctamente" });
    });
  };

module.exports = {
  getIngresoByUserId,
  updateIngreso,
};
