const express = require("express");
const { port } = require('./config/env');

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Hola mi server en Express",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Middleware 404 al final, sin patrón específico
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
        path: req.originalUrl,
        method: req.method
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;