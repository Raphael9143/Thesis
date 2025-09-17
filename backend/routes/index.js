const express = require('express');
const cors = require('cors');

const classRoutes = require('./class');
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const userRoutes = require('./user');

const { sequelize, testConnection } = require('../config/database');
const { specs, swaggerUi } = require('../config/swagger')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// swagger ui
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'Thesis API Document'
}))

// Test database connection
testConnection();

// Sync database (tạo bảng nếu chưa có)
sequelize.sync({ force: false }) // force: true sẽ xóa và tạo lại bảng
    .then(() => {
        console.log('✅ Database synced successfully!');
    })
    .catch((error) => {
        console.error('❌ Database sync failed:', error.message);
    });

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Server is running!',
        database: 'MySQL with Sequelize',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile (requires token)'
            }
        }
    });
});

// Auth routes
app.use('/api/auth', authRoutes);
// User routes
app.use('/api/users', userRoutes);
// Class routes
app.use('/api/class', classRoutes);
// Course routes
app.use('/api/courses', courseRoutes);

const studentRoutes = require('./student');
const teacherRoutes = require('./teacher');
// Student routes
app.use('/api/student', studentRoutes);
// Teacher routes
app.use('/api/teacher', teacherRoutes);

module.exports = app