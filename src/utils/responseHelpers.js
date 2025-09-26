// Helper functions para respuestas HTTP estandarizadas

const successResponse = (res, data, message = "Operación exitosa", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const createdResponse = (res, data, message = "Recurso creado exitosamente") => {
    return res.status(201).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const errorResponse = (res, message = "Error en la operación", statusCode = 400, error = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };
    
    if (error && process.env.NODE_ENV === 'development') {
        response.error = error.message;
        response.stack = error.stack;
    }
    
    return res.status(statusCode).json(response);
};

const notFoundResponse = (res, resource = "Recurso") => {
    return res.status(404).json({
        success: false,
        message: `${resource} no encontrado`,
        timestamp: new Date().toISOString()
    });
};

const validationErrorResponse = (res, errors) => {
    return res.status(422).json({
        success: false,
        message: "Error de validación",
        errors,
        timestamp: new Date().toISOString()
    });
};

const unauthorizedResponse = (res, message = "No autorizado") => {
    return res.status(401).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

const forbiddenResponse = (res, message = "Acceso denegado") => {
    return res.status(403).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

const serverErrorResponse = (res, error) => {
    console.error('Error del servidor:', error);
    
    return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
};

module.exports = {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    unauthorizedResponse,
    forbiddenResponse,
    serverErrorResponse
};