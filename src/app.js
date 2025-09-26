const express = require("express");
const { port } = require('./config/env');

// Importar rutas
const exercisesRoutes = require('./routes/exercises');

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar headers de respuesta
app.use((req, res, next) => {
    res.set({
        'X-Powered-By': 'Express',
        'X-API-Version': '1.0.0',
        'Content-Type': 'application/json'
    });
    next();
});

// Ruta de prueba (DEBE IR ANTES del middleware 404)
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "¡Workout Tracker API está funcionando!",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
            exercises: "/exercises",
            exercises_by_id: "/exercises/:id"
        }
    });
});

// Rutas API
app.use('/exercises', exercisesRoutes);

// ✅ SOLUCIÓN DEFINITIVA: Middleware 404 SIN PATRÓN
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
        path: req.originalUrl,
        method: req.method
    });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;