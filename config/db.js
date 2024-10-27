const mysql = require("mysql2");
require('dotenv').config();  // Cargar las variables del archivo .env


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error(`Error al conectar la base de datos ${err}`);
    return;
  }
  console.log("Conectando a la base de datos");
});

module.exports = db
