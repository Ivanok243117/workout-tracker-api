const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const { authenticateToken } = require('../middleware/auth');
const {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    unauthorizedResponse,
    serverErrorResponse
} = require('../utils/responseHelpers');

const router = express.Router();

// Datos de ejemplo (simulando base de datos)
let users = [
    {
        id: 1,
        name: "Juan Pérez",
        email: "juan@example.com",
        passwordHash: "$2a$10$examplehash", // contraseña: password123
        createdAt: new Date('2024-01-01')
    }
];

// POST /auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validar datos requeridos
        if (!name || !email || !password) {
            return validationErrorResponse(res, {
                name: !name ? 'Nombre es requerido' : undefined,
                email: !email ? 'Email es requerido' : undefined,
                password: !password ? 'Contraseña es requerida' : undefined
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse(res, 'Formato de email inválido', 400);
        }

        // Verificar si el usuario ya existe
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return errorResponse(res, 'El email ya está registrado', 409);
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario
        const newUser = {
            id: users.length + 1,
            name: name.trim(),
            email: email.toLowerCase(),
            passwordHash,
            createdAt: new Date()
        };

        users.push(newUser);

        // No devolver passwordHash en la respuesta
        const userResponse = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt
        };

        return createdResponse(res, userResponse, 'Usuario creado exitosamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos requeridos
        if (!email || !password) {
            return errorResponse(res, 'Email y contraseña son requeridos', 400);
        }

        // Buscar usuario
        const user = users.find(u => u.email === email);
        if (!user) {
            return unauthorizedResponse(res, 'Credenciales inválidas');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return unauthorizedResponse(res, 'Credenciales inválidas');
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email 
            }, 
            jwtConfig.secret, 
            { expiresIn: jwtConfig.expiresIn }
        );

        // Respuesta exitosa
        return successResponse(res, {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        }, 'Login exitoso');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /users - Listar usuarios (protegido)
router.get('/', authenticateToken, (req, res) => {
    try {
        const userList = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        }));

        return successResponse(res, {
            users: userList,
            total: userList.length
        }, 'Usuarios obtenidos correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Validar parámetro
        if (isNaN(userId) || userId <= 0) {
            return errorResponse(res, 'ID de usuario inválido', 400);
        }

        const user = users.find(u => u.id === userId);

        if (!user) {
            return notFoundResponse(res, 'Usuario');
        }

        // No devolver passwordHash
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };

        return successResponse(res, userResponse, 'Usuario obtenido correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

module.exports = router;