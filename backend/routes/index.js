const submissionRoutes = require('./submission');
const express = require('express');
const cors = require('cors');

const classRoutes = require('./class');
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const userRoutes = require('./user');
const studentRoutes = require('./student');
const teacherRoutes = require('./teacher');
const researcherRoutes = require('./researcher');
const notifyRoutes = require('./notify');
const assignmentRoutes = require('./assignment');
const lectureRoutes = require('./lecture');

const { sequelize, testConnection } = require('../config/database');
const { specs, swaggerUi } = require('../config/swagger')
const { emitToUser } = require('../realtime/socket')

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

// Sync database (drop & create lại), sau đó seed dữ liệu mẫu bằng file riêng
sequelize.sync({ force: true })
    .then(async () => {
        console.log('✅ Database dropped & synced successfully!');
        const initDatabase = require('../initDatabase');
        await initDatabase();
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

// Notification routes
app.use('/api/notify', notifyRoutes);

// Auth routes
app.use('/api/auth', authRoutes);
// User routes
app.use('/api/users', userRoutes);
// Class routes
app.use('/api/class', classRoutes);
// Course routes
app.use('/api/courses', courseRoutes);
// Student routes
app.use('/api/student', studentRoutes);
// Teacher routes
app.use('/api/teacher', teacherRoutes);
// Researcher routes
app.use('/api/researcher', researcherRoutes);
// Assignment routes
app.use('/api/assignments', assignmentRoutes);
// Submission routes
app.use('/api/submissions', submissionRoutes);
// Lecture routes
app.use('/api/lectures', lectureRoutes);

module.exports = app
