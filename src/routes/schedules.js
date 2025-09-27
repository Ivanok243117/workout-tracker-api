const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
    successResponse,
    createdResponse,
    errorResponse,
    notFoundResponse,
    validationErrorResponse,
    serverErrorResponse
} = require('../utils/responseHelpers');

const router = express.Router();

// Datos de ejemplo (simulando base de datos)
let schedules = [
    {
        id: 1,
        userId: 1,
        workoutId: 1,
        scheduledDate: "2024-09-15T10:00:00Z",
        status: "scheduled", // scheduled, completed, cancelled
        notes: "Morning workout",
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
    }
];

// Middleware para verificar propiedad del schedule
const checkScheduleOwnership = (req, res, next) => {
    try {
        const scheduleId = parseInt(req.params.id);
        const schedule = schedules.find(s => s.id === scheduleId);

        if (!schedule) {
            return notFoundResponse(res, 'Schedule');
        }

        if (schedule.userId !== req.user.userId) {
            return errorResponse(res, 'No tienes permisos para acceder a este schedule', 403);
        }

        req.schedule = schedule;
        next();
    } catch (error) {
        return serverErrorResponse(res, error);
    }
};

// GET /schedules - Obtener schedules del usuario
router.get('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const { status, date, limit, page } = req.query;

        let userSchedules = schedules.filter(s => s.userId === userId);

        // Filtrar por status
        if (status) {
            userSchedules = userSchedules.filter(s => s.status === status);
        }

        // Filtrar por fecha
        if (date) {
            const filterDate = new Date(date);
            userSchedules = userSchedules.filter(s => {
                const scheduleDate = new Date(s.scheduledDate);
                return scheduleDate.toDateString() === filterDate.toDateString();
            });
        }

        // Paginación
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;

        const paginatedSchedules = userSchedules.slice(startIndex, endIndex);

        return successResponse(res, {
            schedules: paginatedSchedules,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: userSchedules.length,
                totalPages: Math.ceil(userSchedules.length / limitNumber)
            }
        }, 'Schedules obtenidos correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /schedules/:id - Obtener schedule por ID
router.get('/:id', authenticateToken, checkScheduleOwnership, (req, res) => {
    try {
        return successResponse(res, req.schedule, 'Schedule obtenido correctamente');
    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /schedules - Crear nuevo schedule
router.post('/', authenticateToken, (req, res) => {
    try {
        const { workoutId, scheduledDate, notes } = req.body;
        const userId = req.user.userId;

        // Validaciones
        if (!workoutId) {
            return validationErrorResponse(res, {
                workoutId: 'workoutId es requerido'
            });
        }

        if (!scheduledDate) {
            return validationErrorResponse(res, {
                scheduledDate: 'scheduledDate es requerido'
            });
        }

        // Validar fecha
        const scheduleDate = new Date(scheduledDate);
        if (isNaN(scheduleDate.getTime())) {
            return validationErrorResponse(res, {
                scheduledDate: 'Fecha inválida'
            });
        }

        // Verificar que la fecha no sea en el pasado
        if (scheduleDate < new Date()) {
            return validationErrorResponse(res, {
                scheduledDate: 'La fecha no puede ser en el pasado'
            });
        }

        // Crear nuevo schedule
        const newSchedule = {
            id: schedules.length + 1,
            userId,
            workoutId: parseInt(workoutId),
            scheduledDate: scheduleDate.toISOString(),
            status: "scheduled",
            notes: notes || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        schedules.push(newSchedule);

        return createdResponse(res, newSchedule, 'Schedule creado exitosamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /schedules/:id/complete - Completar schedule
router.post('/:id/complete', authenticateToken, checkScheduleOwnership, (req, res) => {
    try {
        const schedule = req.schedule;

        if (schedule.status === 'completed') {
            return errorResponse(res, 'El schedule ya está completado', 400);
        }

        schedule.status = 'completed';
        schedule.updatedAt = new Date();

        return successResponse(res, schedule, 'Schedule marcado como completado');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

module.exports = router;