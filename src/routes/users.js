const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const { authenticateToken } = require('../middleware/auth');

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

// GET /users - Listar usuarios (protegido)
router.get('/', authenticateToken, (req, res) => {
    try {
        // Solo usuarios autenticados pueden ver la lista
        const userList = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        }));

        res.status(200).json({
            success: true,
            data: userList,
            total: userList.length,
            message: "Usuarios obtenidos correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
            error: error.message
        });
    }
});

// GET /users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Validar parámetro
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario inválido"
            });
        }

        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // No devolver passwordHash
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            data: userResponse,
            message: "Usuario obtenido correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener el usuario",
            error: error.message
        });
    }
});

// POST /users - Crear nuevo usuario (registro)
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validar datos requeridos
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nombre, email y contraseña son requeridos"
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Formato de email inválido"
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "El email ya está registrado"
            });
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

        res.status(201).json({
            success: true,
            data: userResponse,
            message: "Usuario creado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear el usuario",
            error: error.message
        });
    }
});

module.exports = router;