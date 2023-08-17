const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors"); // Importa el paquete cors
require("dotenv").config();
const usuario = require("./router/ruta-usuarios");
const casa = require("./router/ruta-casa");
const habitacion = require("./router/ruta-habitacion");
const armario = require("./router/ruta-armario");
const cajones = require("./router/ruta-cajones");
const cosas = require("./router/ruta-cosas");
const caja = require("./router/ruta-caja");

app.use(express.json());

// Configura las opciones de CORS
const corsOptions = {
  origin: "http://localhost:3000", // Cambia esto al dominio de tu aplicación frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Aplica el middleware cors con las opciones definidas
app.use(cors(corsOptions));

// Configura las cabeceras CORS usando app.use
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Permitir solicitudes desde cualquier origen
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"); // Métodos HTTP permitidos
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  ); // Cabeceras permitidas
  next();
});

app.use("/api/usuarios", usuario);
app.use("/api/casas/", casa);
app.use("/api/habitaciones/", habitacion);
app.use("/api/armarios/", armario);
app.use("/api/cajones/", cajones);
app.use("/api/cosas/", cosas);
app.use("/api/cajas/", caja);

mongoose
  .connect(process.env.MONGO_DB_URI)
  .then(() =>
    app.listen(5000, () =>
      console.log(
        "Conectado a la base de datos y escuchando por el puerto 5000"
      )
    )
  )
  .catch((err) => console.log(err));
