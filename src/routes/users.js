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

// PUT /users/:id - Actualización completa de usuario
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, password } = req.body;
        const currentUserId = req.user.userId;

        // Verificar que el usuario solo puede actualizar su propio perfil
        if (userId !== currentUserId) {
            return errorResponse(res, 'Solo puedes actualizar tu propio perfil', 403);
        }

        // Validar datos requeridos para PUT (actualización completa)
        if (!name || !email) {
            return validationErrorResponse(res, {
                name: !name ? 'Nombre es requerido' : undefined,
                email: !email ? 'Email es requerido' : undefined
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse(res, 'Formato de email inválido', 400);
        }

        // Buscar usuario
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return notFoundResponse(res, 'Usuario');
        }

        // Verificar si el nuevo email ya existe (excluyendo el usuario actual)
        const emailExists = users.find(u => u.email === email && u.id !== userId);
        if (emailExists) {
            return errorResponse(res, 'El email ya está registrado', 409);
        }

        // Preparar actualización completa
        const updatedUser = {
            ...users[userIndex],
            name: name.trim(),
            email: email.toLowerCase(),
            updatedAt: new Date()
        };

        // Actualizar contraseña si se proporciona
        if (password) {
            const saltRounds = 10;
            updatedUser.passwordHash = await bcrypt.hash(password, saltRounds);
        }

        // Aplicar actualización
        users[userIndex] = updatedUser;

        // Respuesta sin passwordHash
        const userResponse = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        return successResponse(res, userResponse, 'Usuario actualizado completamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// PATCH /users/:id - Actualización parcial de usuario
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, password } = req.body;
        const currentUserId = req.user.userId;

        // Verificar permisos
        if (userId !== currentUserId) {
            return errorResponse(res, 'Solo puedes actualizar tu propio perfil', 403);
        }

        // Buscar usuario
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return notFoundResponse(res, 'Usuario');
        }

        // Validar que haya al menos un campo para actualizar
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (email !== undefined) updates.email = email.toLowerCase();
        if (password !== undefined) updates.password = password;

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 'Debe proporcionar al menos un campo para actualizar', 400);
        }

        // Validar email si se está actualizando
        if (updates.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.email)) {
                return errorResponse(res, 'Formato de email inválido', 400);
            }

            // Verificar si el nuevo email ya existe
            const emailExists = users.find(u => u.email === updates.email && u.id !== userId);
            if (emailExists) {
                return errorResponse(res, 'El email ya está registrado', 409);
            }
        }

        // Aplicar actualización parcial
        const updatedUser = { ...users[userIndex] };

        if (updates.name) updatedUser.name = updates.name;
        if (updates.email) updatedUser.email = updates.email;
        if (updates.password) {
            const saltRounds = 10;
            updatedUser.passwordHash = await bcrypt.hash(updates.password, saltRounds);
        }

        updatedUser.updatedAt = new Date();
        users[userIndex] = updatedUser;

        // Respuesta sin passwordHash
        const userResponse = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        return successResponse(res, userResponse, 'Usuario actualizado parcialmente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// DELETE /users/:id - Eliminar usuario
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = req.user.userId;

        // Verificar permisos
        if (userId !== currentUserId) {
            return errorResponse(res, 'Solo puedes eliminar tu propia cuenta', 403);
        }

        // Buscar usuario
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return notFoundResponse(res, 'Usuario');
        }

        // Eliminar usuario
        const deletedUser = users.splice(userIndex, 1)[0];

        // Respuesta sin passwordHash
        const userResponse = {
            id: deletedUser.id,
            name: deletedUser.name,
            email: deletedUser.email,
            message: 'Usuario eliminado exitosamente'
        };

        return successResponse(res, userResponse, 'Usuario eliminado correctamente', 200);

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// DELETE /users/:id/force - Eliminación forzada con confirmación
router.delete('/:id/force', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = req.user.userId;
        const { confirmation } = req.query;

        // Verificar permisos
        if (userId !== currentUserId) {
            return errorResponse(res, 'Solo puedes eliminar tu propia cuenta', 403);
        }

        // Confirmación requerida para eliminación
        if (confirmation !== 'true') {
            return errorResponse(res, 
                'Confirmación requerida para eliminación. Agrega ?confirmation=true', 
                400
            );
        }

        // Buscar usuario
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return notFoundResponse(res, 'Usuario');
        }

        // Eliminar usuario y datos relacionados (simulación)
        const deletedUser = users.splice(userIndex, 1)[0];
        
        // Simular eliminación de datos relacionados
        const deletedWorkouts = workouts.filter(w => w.userId === userId).length;
        const deletedSchedules = schedules.filter(s => s.userId === userId).length;

        return successResponse(res, {
            user: {
                id: deletedUser.id,
                name: deletedUser.name,
                email: deletedUser.email
            },
            deletedData: {
                workouts: deletedWorkouts,
                schedules: deletedSchedules
            },
            message: 'Usuario y todos sus datos han sido eliminados permanentemente'
        }, 'Eliminación completada', 200);

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

module.exports = router;