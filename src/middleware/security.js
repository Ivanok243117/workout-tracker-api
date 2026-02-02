// Middleware de seguridad para headers
const securityHeaders = (req, res, next) => {
    // Headers de seguridad
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    });
    
    // Headers personalizados de la API
    res.set({
        'X-API-Key': 'workout-tracker-v1',
        'X-Response-Time': Date.now().toString()
    });
    
    next();
};

// Middleware para validar headers requeridos
const validateHeaders = (req, res, next) => {
    const requiredHeaders = ['content-type'];
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: "Content-Type debe ser application/json"
            });
        }
    }
    
    next();
};

// Middleware para leer y validar headers de autenticación
const authHeaders = (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    const clientVersion = req.get('X-Client-Version');
    
    // Log de headers para debugging
    console.log('Headers recibidos:');
    console.log('- X-API-Key:', apiKey);
    console.log('- X-Client-Version:', clientVersion);
    console.log('- User-Agent:', req.get('User-Agent'));
    console.log('- Accept:', req.get('Accept'));
    
    // Validar API Key para endpoints específicos
    if (req.path.startsWith('/admin') && apiKey !== 'workout-tracker-v1') {
        return res.status(401).json({
            success: false,
            message: "API Key inválida"
        });
    }
    
    next();
};

module.exports = {
    securityHeaders,
    validateHeaders,
    authHeaders
};