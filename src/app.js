const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { port } = require('./config/env');

// Importar rutas
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const workoutRoutes = require('./routes/workouts');
const scheduleRoutes = require('./routes/schedules');
const reportRoutes = require('./routes/reports');

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Middlewares para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas base
app.get('/', (req, res) => {
  res.json({
    message: 'Workout Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/v1/auth',
      exercises: '/v1/exercises',
      workouts: '/v1/workouts',
      schedules: '/v1/schedules',
      reports: '/v1/reports'
    }
  });
});

// Registrar rutas
app.use('/v1/auth', authRoutes);
app.use('/v1/exercises', exerciseRoutes);
app.use('/v1/workouts', workoutRoutes);
app.use('/v1/schedules', scheduleRoutes);
app.use('/v1/reports', reportRoutes);

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Middleware de errores global
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

module.exports = app;