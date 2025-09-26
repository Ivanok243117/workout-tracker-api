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
    }
];

// GET /exercises - Listar todos los ejercicios
router.get('/', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: exercises,
            total: exercises.length,
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