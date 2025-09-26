const express = require('express');
const {
    successResponse,
    notFoundResponse,
    errorResponse,
    validationErrorResponse,
    serverErrorResponse
} = require('../utils/responseHelpers');

const router = express.Router();

// Datos de ejemplo
let exercises = [
    {
        id: 1,
        name: "Bench Press",
        description: "Chest exercise using barbell",
        category: "strength",
        muscleGroup: "chest",
        equipment: "barbell",
        createdAt: new Date('2024-01-01')
    },
    {
        id: 2,
        name: "Squat",
        description: "Leg exercise with barbell on shoulders",
        category: "strength",
        muscleGroup: "legs",
        equipment: "barbell",
        createdAt: new Date('2024-01-02')
    },
    {
        id: 3,
        name: "Running",
        description: "Cardiovascular exercise",
        category: "cardio",
        muscleGroup: "legs",
        equipment: "treadmill",
        createdAt: new Date('2024-01-03')
    },
    {
        id: 4,
        name: "Push Up",
        description: "Bodyweight chest exercise",
        category: "strength",
        muscleGroup: "chest",
        equipment: "bodyweight",
        createdAt: new Date('2024-01-04')
    },
    {
        id: 5,
        name: "Deadlift",
        description: "Full body compound exercise",
        category: "strength",
        muscleGroup: "back",
        equipment: "barbell",
        createdAt: new Date('2024-01-05')
    },
    {
        id: 6,
        name: "Cycling",
        description: "Cardiovascular exercise on bicycle",
        category: "cardio",
        muscleGroup: "legs",
        equipment: "bicycle",
        createdAt: new Date('2024-01-06')
    }
];

// GET /exercises - Listar todos los ejercicios con filtros
router.get('/', (req, res) => {
    try {
        const { category, muscleGroup, equipment, limit, page, search } = req.query;
        
        let filteredExercises = [...exercises];
        
        // Aplicar filtros
        if (category) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (muscleGroup) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.muscleGroup.toLowerCase() === muscleGroup.toLowerCase()
            );
        }
        
        if (equipment) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.equipment.toLowerCase().includes(equipment.toLowerCase())
            );
        }
        
        // Búsqueda por nombre
        if (search) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // Paginación
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;
        
        const paginatedExercises = filteredExercises.slice(startIndex, endIndex);
        
        return successResponse(res, {
            exercises: paginatedExercises,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: filteredExercises.length,
                totalPages: Math.ceil(filteredExercises.length / limitNumber)
            },
            filters: {
                category,
                muscleGroup,
                equipment,
                search
            }
        }, "Ejercicios obtenidos correctamente");

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /exercises/:id - Obtener un ejercicio por ID
router.get('/:id', (req, res) => {
    try {
        const exerciseId = parseInt(req.params.id);

        // Validar parámetro
        if (isNaN(exerciseId) || exerciseId <= 0) {
            return errorResponse(res, "ID de ejercicio inválido", 400);
        }

        const exercise = exercises.find(ex => ex.id === exerciseId);

        if (!exercise) {
            return notFoundResponse(res, "Ejercicio");
        }

        return successResponse(res, exercise, "Ejercicio obtenido correctamente");

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// POST /exercises - Crear nuevo ejercicio (para administración)
router.post('/', (req, res) => {
    try {
        const { name, description, category, muscleGroup, equipment } = req.body;

        // Validaciones
        if (!name || !name.trim()) {
            return validationErrorResponse(res, {
                name: 'Nombre del ejercicio es requerido'
            });
        }

        if (!category) {
            return validationErrorResponse(res, {
                category: 'Categoría es requerida'
            });
        }

        if (!muscleGroup) {
            return validationErrorResponse(res, {
                muscleGroup: 'Grupo muscular es requerido'
            });
        }

        // Verificar si el ejercicio ya existe
        const existingExercise = exercises.find(ex => 
            ex.name.toLowerCase() === name.toLowerCase().trim()
        );

        if (existingExercise) {
            return errorResponse(res, 'El ejercicio ya existe', 409);
        }

        // Crear nuevo ejercicio
        const newExercise = {
            id: exercises.length + 1,
            name: name.trim(),
            description: description || '',
            category: category.trim(),
            muscleGroup: muscleGroup.trim(),
            equipment: equipment || 'bodyweight',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        exercises.push(newExercise);

        return successResponse(res, newExercise, 'Ejercicio creado exitosamente', 201);

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// PUT /exercises/:id - Actualizar ejercicio completo
router.put('/:id', (req, res) => {
    try {
        const exerciseId = parseInt(req.params.id);
        const { name, description, category, muscleGroup, equipment } = req.body;

        // Validar ID
        if (isNaN(exerciseId) || exerciseId <= 0) {
            return errorResponse(res, "ID de ejercicio inválido", 400);
        }

        // Validaciones para actualización completa
        if (!name || !name.trim()) {
            return validationErrorResponse(res, {
                name: 'Nombre del ejercicio es requerido'
            });
        }

        if (!category) {
            return validationErrorResponse(res, {
                category: 'Categoría es requerida'
            });
        }

        if (!muscleGroup) {
            return validationErrorResponse(res, {
                muscleGroup: 'Grupo muscular es requerido'
            });
        }

        // Buscar ejercicio
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) {
            return notFoundResponse(res, "Ejercicio");
        }

        // Verificar si el nuevo nombre ya existe (excluyendo el ejercicio actual)
        const nameExists = exercises.find(ex => 
            ex.name.toLowerCase() === name.toLowerCase().trim() && 
            ex.id !== exerciseId
        );

        if (nameExists) {
            return errorResponse(res, 'Ya existe un ejercicio con ese nombre', 409);
        }

        // Actualizar ejercicio
        exercises[exerciseIndex] = {
            ...exercises[exerciseIndex],
            name: name.trim(),
            description: description || '',
            category: category.trim(),
            muscleGroup: muscleGroup.trim(),
            equipment: equipment || 'bodyweight',
            updatedAt: new Date()
        };

        return successResponse(res, exercises[exerciseIndex], 'Ejercicio actualizado completamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// PATCH /exercises/:id - Actualizar ejercicio parcialmente
router.patch('/:id', (req, res) => {
    try {
        const exerciseId = parseInt(req.params.id);
        const updates = req.body;

        // Validar ID
        if (isNaN(exerciseId) || exerciseId <= 0) {
            return errorResponse(res, "ID de ejercicio inválido", 400);
        }

        // Verificar que hay campos para actualizar
        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 'Debe proporcionar al menos un campo para actualizar', 400);
        }

        // Buscar ejercicio
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) {
            return notFoundResponse(res, "Ejercicio");
        }

        // Aplicar actualizaciones parciales
        const exercise = exercises[exerciseIndex];

        if (updates.name !== undefined) {
            if (!updates.name.trim()) {
                return validationErrorResponse(res, {
                    name: 'Nombre no puede estar vacío'
                });
            }
            
            // Verificar si el nuevo nombre ya existe
            const nameExists = exercises.find(ex => 
                ex.name.toLowerCase() === updates.name.toLowerCase().trim() && 
                ex.id !== exerciseId
            );

            if (nameExists) {
                return errorResponse(res, 'Ya existe un ejercicio con ese nombre', 409);
            }

            exercise.name = updates.name.trim();
        }

        if (updates.description !== undefined) {
            exercise.description = updates.description;
        }

        if (updates.category !== undefined) {
            if (!updates.category.trim()) {
                return validationErrorResponse(res, {
                    category: 'Categoría no puede estar vacía'
                });
            }
            exercise.category = updates.category.trim();
        }

        if (updates.muscleGroup !== undefined) {
            if (!updates.muscleGroup.trim()) {
                return validationErrorResponse(res, {
                    muscleGroup: 'Grupo muscular no puede estar vacío'
                });
            }
            exercise.muscleGroup = updates.muscleGroup.trim();
        }

        if (updates.equipment !== undefined) {
            exercise.equipment = updates.equipment;
        }

        exercise.updatedAt = new Date();

        return successResponse(res, exercise, 'Ejercicio actualizado parcialmente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// DELETE /exercises/:id - Eliminar ejercicio
router.delete('/:id', (req, res) => {
    try {
        const exerciseId = parseInt(req.params.id);

        // Validar ID
        if (isNaN(exerciseId) || exerciseId <= 0) {
            return errorResponse(res, "ID de ejercicio inválido", 400);
        }

        // Buscar ejercicio
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) {
            return notFoundResponse(res, "Ejercicio");
        }

        // Eliminar ejercicio
        const deletedExercise = exercises.splice(exerciseIndex, 1)[0];

        return successResponse(res, {
            id: deletedExercise.id,
            name: deletedExercise.name,
            message: 'Ejercicio eliminado exitosamente'
        }, 'Ejercicio eliminado correctamente', 200);

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /exercises/categories/list - Obtener lista de categorías únicas
router.get('/categories/list', (req, res) => {
    try {
        const categories = [...new Set(exercises.map(ex => ex.category))];
        
        return successResponse(res, {
            categories,
            total: categories.length
        }, 'Categorías obtenidas correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

// GET /exercises/muscle-groups/list - Obtener lista de grupos musculares únicos
router.get('/muscle-groups/list', (req, res) => {
    try {
        const muscleGroups = [...new Set(exercises.map(ex => ex.muscleGroup))];
        
        return successResponse(res, {
            muscleGroups,
            total: muscleGroups.length
        }, 'Grupos musculares obtenidos correctamente');

    } catch (error) {
        return serverErrorResponse(res, error);
    }
});

module.exports = router;