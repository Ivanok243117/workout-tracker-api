const express = require("express");
const { port } = require('./config/env');

// Importar rutas
const exercisesRoutes = require('./routes/exercises');
const usersRoutes = require('./routes/users');

// Importar middleware
const { requestLogger } = require('./middleware/auth');
const { securityHeaders, validateHeaders, authHeaders } = require('./middleware/security');

const app = express();

// Middleware de seguridad
app.use(securityHeaders);
app.use(validateHeaders);
app.use(authHeaders);

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log
app.use(requestLogger);

// Ruta de prueba con información de headers (DEBE IR PRIMERO)
app.get("/", (req, res) => {
    const requestHeaders = {
        'user-agent': req.get('User-Agent'),
        'accept': req.get('Accept'),
        'content-type': req.get('Content-Type'),
        'x-api-key': req.get('X-API-Key'),
        'x-client-version': req.get('X-Client-Version')
    };
    
    res.status(200).json({
        success: true,
        message: "¡Workout Tracker API está funcionando!",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        yourIP: req.ip,
        headers: requestHeaders,
        endpoints: {
            exercises: "/exercises",
            users: "/users"
        }
    });
});

// Endpoint para ver headers de la request
app.get("/headers", (req, res) => {
    const allHeaders = {};
    
    Object.keys(req.headers).forEach(key => {
        allHeaders[key] = req.headers[key];
    });
    
    res.status(200).json({
        success: true,
        yourIP: req.ip,
        method: req.method,
        path: req.path,
        headers: allHeaders
    });
});

// Rutas API
app.use('/exercises', exercisesRoutes);
app.use('/users', usersRoutes);

// ✅ CORREGIDO: Manejo de rutas no encontradas (SIN PATRÓN)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada",
        path: req.originalUrl,
        method: req.method,
        suggestedEndpoints: [
            "GET /",
            "GET /headers", 
            "GET /exercises",
            "POST /users"
        ]
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