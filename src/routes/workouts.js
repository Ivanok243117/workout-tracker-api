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
let workouts = [
    {
        id: 1,
        userId: 1,
        name: "Chest Day",
        exercises: [
            {
                exerciseId: 1,
                name: "Bench Press",
                sets: 3,
                reps: 10,
                weight: 70,
                restTime: 60
            }
        ],
        notes: "Focus on form",
        completed: false,
        scheduledDate: "2024-09-15T10:00:00Z",
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
    }
];

// Middleware para verificar propiedad del workout
const checkWorkoutOwnership = (req, res, next) => {
    try {
        const workoutId = parseInt(req.params.id);
        const workout = workouts.find(w => w.id === workoutId);

        if (!workout) {
            return notFoundResponse(res, 'Workout');
        }

        // Verificar que el workout pertenece al usuario autenticado
        if (workout.userId !== req.user.userId) {
            return errorResponse(res, 'No tienes permisos para acceder a este workout', 403);
        }

        req.workout = workout;
        next();
    } catch (error) {
        return serverErrorResponse(res, error);
    }
};

// GET /workouts - Obtener todos los workouts del usuario
router.get('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit, page, completed } = req.query;

        let userWorkouts = workouts.filter(w => w.userId === userId);

        // Filtrar por estado completed
        if (completed !== undefined) {
            const isCompleted = completed === 'true';
            userWorkouts = userWorkouts.filter(w => w.completed === isCompleted);
        }

        // Paginación
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;

        const paginatedWorkouts = userWorkouts.slice(startIndex, endIndex);

        return successResponse(res, {
            workouts: paginatedWorkouts,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: userWorkouts.length,
                totalPages: Math.ceil(userWorkouts.length / limitNumber)
            }
        }, 'Workouts obtenidos correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /workouts/:id - Obtener workout por ID
router.get('/:id', authenticateToken, checkWorkoutOwnership, (req, res) => {
    try {
        return successResponse(res, req.workout, 'Workout obtenido correctamente');
    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /workouts - Crear nuevo workout
router.post('/', authenticateToken, (req, res) => {
    try {
        const { name, exercises, notes, scheduledDate } = req.body;
        const userId = req.user.userId;

        // Validaciones básicas
        if (!name || !name.trim()) {
            return validationErrorResponse(res, {
                name: 'Nombre del workout es requerido'
            });
        }

        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return validationErrorResponse(res, {
                exercises: 'Debe incluir al menos un ejercicio'
            });
        }

        // Validar cada ejercicio
        for (let i = 0; i < exercises.length; i++) {
            const exercise = exercises[i];
            if (!exercise.exerciseId || !exercise.sets || !exercise.reps) {
                return validationErrorResponse(res, {
                    exercises: `Ejercicio ${i + 1} debe tener exerciseId, sets y reps`
                });
            }
        }

        // Crear nuevo workout
        const newWorkout = {
            id: workouts.length + 1,
            userId,
            name: name.trim(),
            exercises: exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                name: ex.name || `Exercise ${ex.exerciseId}`,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight || 0,
                restTime: ex.restTime || 60
            })),
            notes: notes || '',
            completed: false,
            scheduledDate: scheduledDate || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        workouts.push(newWorkout);

        return createdResponse(res, newWorkout, 'Workout creado exitosamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// PUT /workouts/:id - Actualización completa del workout
router.put('/:id', authenticateToken, checkWorkoutOwnership, (req, res) => {
    try {
        const workout = req.workout;
        const { name, exercises, notes, scheduledDate } = req.body;

        // Validaciones para actualización completa
        if (!name || !name.trim()) {
            return validationErrorResponse(res, {
                name: 'Nombre del workout es requerido'
            });
        }

        if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
            return validationErrorResponse(res, {
                exercises: 'Debe incluir al menos un ejercicio'
            });
        }

        // Validar cada ejercicio
        for (let i = 0; i < exercises.length; i++) {
            const exercise = exercises[i];
            if (!exercise.exerciseId || !exercise.sets || !exercise.reps) {
                return validationErrorResponse(res, {
                    exercises: `Ejercicio ${i + 1} debe tener exerciseId, sets y reps`
                });
            }
        }

        // Actualización completa
        workout.name = name.trim();
        workout.exercises = exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            name: ex.name || `Exercise ${ex.exerciseId}`,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || 0,
            restTime: ex.restTime || 60
        }));
        workout.notes = notes || '';
        workout.scheduledDate = scheduledDate || null;
        workout.updatedAt = new Date();

        return successResponse(res, workout, 'Workout actualizado completamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// PATCH /workouts/:id - Actualización parcial del workout
router.patch('/:id', authenticateToken, checkWorkoutOwnership, (req, res) => {
    try {
        const workout = req.workout;
        const { name, exercises, notes, scheduledDate, completed } = req.body;

        // Validar que haya al menos un campo para actualizar
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (exercises !== undefined) updates.exercises = exercises;
        if (notes !== undefined) updates.notes = notes;
        if (scheduledDate !== undefined) updates.scheduledDate = scheduledDate;
        if (completed !== undefined) updates.completed = completed;

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 'Debe proporcionar al menos un campo para actualizar', 400);
        }

        // Aplicar actualización parcial
        if (updates.name !== undefined) {
            if (!updates.name.trim()) {
                return validationErrorResponse(res, {
                    name: 'Nombre no puede estar vacío'
                });
            }
            workout.name = updates.name.trim();
        }

        if (updates.exercises !== undefined) {
            if (!Array.isArray(updates.exercises) || updates.exercises.length === 0) {
                return validationErrorResponse(res, {
                    exercises: 'Debe ser un array con al menos un ejercicio'
                });
            }
            workout.exercises = updates.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                name: ex.name || `Exercise ${ex.exerciseId}`,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight || 0,
                restTime: ex.restTime || 60
            }));
        }

        if (updates.notes !== undefined) {
            workout.notes = updates.notes;
        }

        if (updates.scheduledDate !== undefined) {
            workout.scheduledDate = updates.scheduledDate;
        }

        if (updates.completed !== undefined) {
            workout.completed = updates.completed;
            if (updates.completed && !workout.completedAt) {
                workout.completedAt = new Date();
            }
        }

        workout.updatedAt = new Date();

        return successResponse(res, workout, 'Workout actualizado parcialmente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /workouts/:id/complete - Marcar workout como completado
router.post('/:id/complete', authenticateToken, checkWorkoutOwnership, (req, res) => {
    try {
        const workout = req.workout;
        
        if (workout.completed) {
            return errorResponse(res, 'El workout ya está completado', 400);
        }

        // Actualizar workout
        workout.completed = true;
        workout.completedAt = new Date();
        workout.updatedAt = new Date();

        return successResponse(res, workout, 'Workout marcado como completado');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /workouts/:id/exercises - Agregar ejercicio a workout
router.post('/:id/exercises', authenticateToken, checkWorkoutOwnership, (req, res) => {
    try {
        const { exerciseId, sets, reps, weight, restTime } = req.body;
        const workout = req.workout;

        // Validaciones
        if (!exerciseId || !sets || !reps) {
            return validationErrorResponse(res, {
                exerciseId: !exerciseId ? 'exerciseId es requerido' : undefined,
                sets: !sets ? 'sets es requerido' : undefined,
                reps: !reps ? 'reps es requerido' : undefined
            });
        }

        // Verificar si el ejercicio ya existe en el workout
        const existingExercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
        if (existingExercise) {
            return errorResponse(res, 'El ejercicio ya existe en este workout', 400);
        }

        // Agregar nuevo ejercicio
        const newExercise = {
            exerciseId,
            name: `Exercise ${exerciseId}`,
            sets: parseInt(sets),
            reps: parseInt(reps),
            weight: weight ? parseFloat(weight) : 0,
            restTime: restTime ? parseInt(restTime) : 60
        };

        workout.exercises.push(newExercise);
        workout.updatedAt = new Date();

        return createdResponse(res, workout, 'Ejercicio agregado al workout exitosamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

module.exports = router;