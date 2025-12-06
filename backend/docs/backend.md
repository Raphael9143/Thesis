# Backend Overview — Thesis Project

This document summarizes the backend structure, main components, and newly added admin APIs.

1) Environment & run
- Start server: `npm run start` (uses `dotenv`)
- Dev: `npm run dev`
- Tests: `npm test` (uses Vitest)

2) Architecture
- Express application entry: `server.js` imports routes from `routes/index.js`.
- Routes are grouped under `routes/` (per resource).
- Controller implementations live in `controllers/`.
- Sequelize models live in `models/` with associations wired in `models/index.js`.
- File uploads are served under `/uploads` (static).
- Auth: JWT-based using `middlewares/auth.js` and role guard `middlewares/role.js`.

3) Key models (in `models/`)
- `User` — users with `role` (STUDENT, TEACHER, ADMIN, RESEARCHER) and `status`.
- `Class`, `Course`, `Assignment`, `Exam`, `Submission`, `UseModel`, etc.

4) Important controllers
- `AuthController` — registration/login/profile
- `UserController` — user self-service
- `ClassController` — class CRUD and student management
- `AssignmentController` / `ExamController` — create/update/publish assignments/exams
- `SubmissionController` — create submissions, auto-grading logic (grader in `utils/grader.js`)

5) Admin APIs (new)
Base path: `/api/admin` (requires Authorization header `Bearer <token>` of an ADMIN user)

- GET `/api/admin/stats`
  - Returns counts: users (and breakdown by role), courses, classes, assignments, exams, submissions.

- GET `/api/admin/users`
  - Query params: `role` (optional), `page` (default 1), `limit` (default 50)
  - Lists users.

- POST `/api/admin/users`
  - Create user. Body: `full_name`, `email`, `password`, `role` (optional, default STUDENT).

- GET `/api/admin/users/:id`
  - Get user details.

- DELETE `/api/admin/users/:id`
  - Delete user from DB.

6) Notes
- Admin endpoints are protected by `middlewares/auth.js` and `middlewares/role.js`.
- The admin user creation endpoint hashes passwords with `bcryptjs`.
- Group support has been removed from the codebase: group-related models, controllers, and routes have been deprecated.

7) Next suggested steps
- Add integration tests for admin endpoints (Supertest + Vitest).
- Consider adding pagination metadata (total pages) on list endpoints.
- Add rate-limit or audit logging for admin operations in production.

---
Generated: December 6, 2025
