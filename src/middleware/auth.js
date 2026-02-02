const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token de acceso requerido"
        });
    }

    jwt.verify(token, jwtConfig.secret, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Token inválido o expirado"
            });
        }
        
        req.user = user;
        next();
    });
};

// Middleware para log de requests
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    next();
};

module.exports = {
    authenticateToken,
    requestLogger
};