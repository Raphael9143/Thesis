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
const examRoutes = require('./exam');
const useRoutes = require('./use');

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

// NOTE: Database sync should be performed from the server startup (server.js)
// or via a dedicated script so that all models are registered before sync runs.
// The previous automatic sync here caused premature syncs (and drops) before
// some models were required. Use `scripts/sync-db.js` or let server.js handle
// syncing to avoid race conditions.

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
// Exam routes
app.use('/api/exams', examRoutes);

// USE parsing routes
app.use('/api/use', useRoutes);


app.use('/uploads', express.static('uploads'));
// Multer error handler: give clearer message instead of stacktrace
const multer = require('multer');
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Common multer errors: Unexpected field, Field name missing, LIMIT_FILE_SIZE, etc.
        const message = err.message || 'File upload error';
        return res.status(400).json({ success: false, error: 'MulterError', message });
    }
    // pass to default error handler
    return next(err);
});
module.exports = app
