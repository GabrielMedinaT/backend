const mongoose = require("mongoose");
const Casa = require("../models/model-casa");
const Habitacion = require("../models/model-habit");
const Armario = require("../models/model-armario");
const Cajon = require("../models/model-cajon");
const cors = require("cors");
const Cosa = require("../models/model-cosas");
const Caja = require("../models/model-cajas");
const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");
const autorizacion = require("../middleware/checkAuth");
router.use(cors());
router.use(checkAuth);

//*VER COSAS
router.get("/", autorizacion, async (req, res) => {
  const usuarioId = req.datosUsuario.userId;
  try {
    const cosas = await Cosa.find({ usuario: usuarioId }).populate("cajon");
    res.send(cosas);
  } catch (err) {
    res.json({ message: err });
  }
});

router.get("/buscar/:nombre", autorizacion, async (req, res) => {
  const { nombre } = req.params;
  try {
    const cosas = await Cosa.find({ nombre: nombre });
    if (cosas.length === 0) {
      res.status(404).json({ message: "No se ha encontrado ningún resultado" });
    } else {
      res.send(cosas);
    }
  } catch (err) {
    res.status(500).json({ message: "Ha ocurrido un error en el servidor" });
  }
});

router.get("/clase/:clase", autorizacion, async (req, res) => {
  const { clase } = req.params;
  try {
    const cosas = await Cosa.find({ clasificacion: clase });
    res.send(cosas);
  } catch (err) {
    res.json({ message: err });
  }
});

//*CREAR COSAS

router.post("/nuevo", autorizacion, async (req, res, next) => {
  const usuarioId = req.datosUsuario.userId;
  const {
    nombre,
    descripcion,
    clasificacion,
    nombreCajon,
    nombreArmario,
    nombreHabitacion,
    nombreCasa,
    cajon,
    armario,
    habitacion,
    casa,
  } = req.body;

  let existeCajon = await Cajon.findOne({ nombre: cajon });
  let existeArmario = await Armario.findOne({ nombre: armario });
  let existeHabitacion = await Habitacion.findOne({ nombre: habitacion });
  let existeCasa = await Casa.findOne({ nombre: casa });

  if (existeCasa) {
    const cosa = new Cosa({
      nombre,
      descripcion,
      clasificacion,
      nombreCajon: existeCajon ? existeCajon.nombre : null,
      nombreArmario: existeArmario ? existeArmario.nombre : null,
      nombreHabitacion: existeHabitacion ? existeHabitacion.nombre : null,
      nombreCasa: existeCasa.nombre,
      cajon: existeCajon ? existeCajon._id : null,
      armario: existeArmario ? existeArmario._id : null,
      habitacion: existeHabitacion ? existeHabitacion._id : null,
      casa: existeCasa._id,
      usuario: usuarioId,
    });

    try {
      const cosaGuardada = await cosa.save();
      if (existeCajon) {
        const cosaCajon = await Cajon.findOneAndUpdate(
          { nombre: cajon },
          { $push: { cosas: cosa._id } },
          { new: true }
        );
      }
      if (existeArmario) {
        const cosaArmario = await Armario.findOneAndUpdate(
          { nombre: armario },
          { $push: { cosas: cosa._id } },
          { new: true }
        );
      }
      if (existeHabitacion) {
        const cosaHabitacion = await Habitacion.findOneAndUpdate(
          { nombre: habitacion },
          { $push: { cosas: cosa._id } },
          { new: true }
        );
      }
      if (existeCasa) {
        const cosaCasa = await Casa.findOneAndUpdate(
          { nombre: casa },
          { $push: { cosas: cosaGuardada._id } },
          { new: true }
        );
      } else {
        res.json({ message: "Debe de estar en alguna ubicación" });
        return next();
      }

      res.json(cosaGuardada);
    } catch (err) {
      res.json({ message: err });
    }
  } else {
    res.json({ message: "La casa no existe" });
    return next();
  }
});


//*MODIFICAR COSA

router.patch("/editar/:nombre", autorizacion, async (req, res, next) => {
  const { nombre } = req.params;
  const { nombrecosa, cajon, armario, habitacion, casa } = req.body;
  let existeCosa = await Cosa.findOne({ nombre: nombre });
  if (!existeCosa) {
    res.json({ message: "La cosa no existe" });
    return;
  }

  let existeCajon, existeArmario, existeHabitacion, existeCasa;

  if (cajon) {
    existeCajon = await Cajon.findOne({ nombre: cajon });
    if (!existeCajon) {
      res.json({ message: "El cajón no existe" });
      return;
    }
    existeArmario = await Armario.findById(existeCajon.armario);
    existeHabitacion = await Habitacion.findById(existeArmario.habitacion);
    existeCasa = await Casa.findById(existeHabitacion.casa);
  } else if (armario) {
    existeArmario = await Armario.findOne({ nombre: armario });
    if (!existeArmario) {
      res.json({ message: "El armario no existe" });
      return;
    }
    existeHabitacion = await Habitacion.findById(existeArmario.habitacion);
    existeCasa = await Casa.findById(existeHabitacion.casa);
  } else if (habitacion) {
    existeHabitacion = await Habitacion.findOne({ nombre: habitacion });
    if (!existeHabitacion) {
      res.json({ message: "La habitación no existe" });
      return;
    }
    existeCasa = await Casa.findById(existeHabitacion.casa);
  } else if (casa) {
    existeCasa = await Casa.findOne({ nombre: casa });
    if (!existeCasa) {
      res.json({ message: "La casa no existe" });
      return;
    }
  }

  await Cajon.findByIdAndUpdate(existeCosa.cajon, {
    $pull: { cosas: existeCosa._id },
  });
  await Armario.findByIdAndUpdate(existeCosa.armario, {
    $pull: { cosas: existeCosa._id },
  });
  await Habitacion.findByIdAndUpdate(existeCosa.habitacion, {
    $pull: { cosas: existeCosa._id },
  });
  await Casa.findByIdAndUpdate(existeCosa.casa, {
    $pull: { cosas: existeCosa._id },
  });

  const existeHabitacionActual = await Habitacion.findById(
    existeCosa.habitacion
  );
  const nombreHabitacionActual = existeHabitacionActual
    ? existeHabitacionActual.nombre
    : null;
  const existeArmarioActual = await Armario.findById(existeCosa.armario);
  const nombreArmarioActual = existeArmarioActual
    ? existeArmarioActual.nombre
    : null;

  const existeCajonActual = await Cajon.findById(existeCosa.cajon);
  const nombreCajonActual = existeCajonActual ? existeCajonActual.nombre : null;

  if (existeCajon) {
    await Cajon.findByIdAndUpdate(existeCajon._id, {
      $push: { cosas: existeCosa._id },
    });
  } else {
    await Cosa.findByIdAndUpdate(existeCosa._id, {
      cajon: null,
      nombreCajon: null,
    });
    Cosa.findByIdAndUpdate(existeCosa.cajon, {
      $pull: { cosas: existeCosa._id },
    });
  }

  if (existeArmario) {
    await Armario.findByIdAndUpdate(existeArmario._id, {
      $push: { cosas: existeCosa._id },
    });
  } else {
    await Cosa.findByIdAndUpdate(existeCosa._id, {
      armario: null,
      nombreArmario: null,
    });
    await Armario.findByIdAndUpdate(existeCosa.armario, {
      $pull: { cosas: existeCosa._id },
    });
  }

  if (existeHabitacion) {
    await Habitacion.findByIdAndUpdate(existeHabitacion._id, {
      $push: { cosas: existeCosa._id },
    });
  } else {
    await Cosa.findByIdAndUpdate(existeCosa._id, {
      habitacion: null,
      nombreHabitacion: null,
    });
    await Habitacion.findByIdAndUpdate(existeCosa.habitacion, {
      $pull: { cosas: existeCosa._id },
    });
  }

  await Casa.findByIdAndUpdate(existeCasa._id, {
    $push: { cosas: existeCosa._id },
  });

  const nuevaHabitacion = await Habitacion.findOne({ nombre: habitacion });
  const nuevoArmario = await Armario.findOne({ nombre: armario });
  const nuevoCajon = await Cajon.findOne({ nombre: cajon });

  await Cosa.findByIdAndUpdate(existeCosa._id, {
    nombre: nombrecosa ? nombrecosa : existeCosa.nombre,
    habitacion: nuevaHabitacion ? nuevaHabitacion._id : null,
    armario: nuevoArmario ? nuevoArmario._id : null,
    cajon: nuevoCajon ? nuevoCajon._id : null,
    nombreHabitacion: nuevaHabitacion ? nuevaHabitacion.nombre : null,
    nombreArmario: nuevoArmario ? nuevoArmario.nombre : null,
    nombreCajon: nuevoCajon ? nuevoCajon.nombre : null,
  });

  try {
    await Cosa.findByIdAndUpdate(existeCosa._id, {
      casa: existeCasa ? existeCasa._id : undefined,
    });
    res.json({ message: "Cosa modificada" });
  } catch (err) {
    res.json({ message: "Error, no se pudo modificar" });
  }
});

//*BORRAR COSA

router.delete("/borrar/:nombre", autorizacion, async (req, res, next) => {
  const { nombre } = req.params;
  let existeCosa = await Cosa.findOne({ nombre: nombre });
  let existeCajon = await Cajon.findById(existeCosa.cajon);
  let existeArmario = await Armario.findById(existeCosa.armario);
  let existeHabitacion = await Habitacion.findById(existeCosa.habitacion);
  let existeCasa = await Casa.findById(existeCosa.casa);
  if (!existeCosa) {
    res.json({ message: "La cosa no existe" });
    return next();
  }
  if (existeCajon) {
    await Cajon.findByIdAndUpdate(existeCajon._id, {
      $pull: { cosas: existeCosa._id, new: true },
    });
  }
  if (existeArmario) {
    await Armario.findByIdAndUpdate(existeArmario._id, {
      $pull: { cosas: existeCosa._id },
    });
  }
  if (existeHabitacion) {
    await Habitacion.findByIdAndUpdate(existeHabitacion._id, {
      $pull: { cosas: existeCosa._id },
    });
  }
  if (existeCasa) {
    await Casa.findByIdAndUpdate(existeCasa._id, {
      $pull: { cosas: existeCosa._id },
    });
  }

  try {
    await Cosa.findByIdAndDelete(existeCosa._id);
    res.json({ message: "Cosa borrada" });
  } catch (err) {
    res.json({ message: err });
  }
});

router.delete("/borrar/todo/todo", async (req, res, next) => {
  await Cosa.deleteMany();
  await Cajon.deleteMany();
  await Armario.deleteMany();
  await Habitacion.deleteMany();
  await Casa.deleteMany();
  await Caja.deleteMany();

  res.json({ message: "Todo borrado" });
});

module.exports = router;
