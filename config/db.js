const mysql = require("mysql2");
require("dotenv").config();  // Cargar las variables del archivo .env

console.log("Intentando conectar con:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10, // Puedes ajustar este número según tus necesidades
  queueLimit: 0,
});

// Probar la conexión obteniendo una conexión del pool
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar la base de datos:", err);
    return;
  }
  console.log("Conectado a la base de datos");
  connection.release();
});

module.exports = db;
