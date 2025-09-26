const express = require('express');
const router = express.Router();

// Datos de ejemplo (simulando base de datos)
let exercises = [
    {
        id: 1,
        name: "Bench Press",
        description: "Chest exercise using barbell",
        category: "strength",
        muscleGroup: "chest",
        equipment: "barbell"
    },
    {
        id: 2,
        name: "Squat",
        description: "Leg exercise with barbell on shoulders",
        category: "strength",
        muscleGroup: "legs",
        equipment: "barbell"
    },
    {
        id: 3,
        name: "Running",
        description: "Cardiovascular exercise",
        category: "cardio",
        muscleGroup: "legs",
        equipment: "treadmill"
    },
    {
        id: 4,
        name: "Push Up",
        description: "Bodyweight chest exercise",
        category: "strength",
        muscleGroup: "chest",
        equipment: "bodyweight"
    }
];

// GET /exercises - Listar todos los ejercicios con filtros
router.get('/', (req, res) => {
    try {
        const { category, muscleGroup, equipment, limit, page } = req.query;
        
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
        
        // Paginación
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = startIndex + limitNumber;
        
        const paginatedExercises = filteredExercises.slice(startIndex, endIndex);
        
        res.status(200).json({
            success: true,
            data: paginatedExercises,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: filteredExercises.length,
                totalPages: Math.ceil(filteredExercises.length / limitNumber)
            },
            filters: {
                category,
                muscleGroup,
                equipment
            },
            message: "Ejercicios obtenidos correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener ejercicios",
            error: error.message
        });
    }
});

// GET /exercises/:id - Obtener un ejercicio por ID
router.get('/:id', (req, res) => {
    try {
        const exerciseId = parseInt(req.params.id);
        
        // Validar parámetro
        if (isNaN(exerciseId) || exerciseId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de ejercicio inválido"
            });
        }
        
        const exercise = exercises.find(ex => ex.id === exerciseId);

        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: "Ejercicio no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            data: exercise,
            message: "Ejercicio obtenido correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener el ejercicio",
            error: error.message
        });
    }
});

module.exports = router;