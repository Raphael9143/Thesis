import axiosClient from './axiosClient';

const userAPI = {
  // Auth
  // Đăng nhập: chỉ nhận email, password
  login: ({ email, password }) => axiosClient.post('auth/login', { email, password }),

  // Đăng ký: nhận email, password, role (UPPER), full_name, dob, gender (UPPER)
  register: ({ email, password, role, full_name, dob, gender }) =>
    axiosClient.post('auth/register', { email, password, role, full_name, dob, gender }),
  getProfile: () => axiosClient.get('auth/profile'),
  updateProfile: (data) => axiosClient.patch('auth/profile', data),
  // Teacher
  getTeacherProfile: () => axiosClient.get('teacher/profile'),
  getTeacherCourses: () => axiosClient.get('teacher/courses'),
  // Get classes managed/taught by the teacher (requires teacher bearer token)
  getTeacherClasses: () => axiosClient.get('teacher/classes'),
  // Student
  getStudentProfile: () => axiosClient.get('student/profile'),
  updateStudentProfile: (data) => axiosClient.patch('student/profile', data),

  // User management (add more as needed)
  getAllUsers: () => axiosClient.get('users'),
  // Returns a list of student emails: { success: true, data: ["student1@example.com"] }
  getStudentEmails: () => axiosClient.get('users/students/emails'),
  getUserById: (id) => axiosClient.get(`users/${id}`),
  // Get user by email: GET /api/users/by-email?email=...
  getUserByEmail: (email) => axiosClient.get(`users/by-email?email=${encodeURIComponent(email)}`),
  updateUser: (id, data) => axiosClient.put(`users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`users/${id}`),

  // Class management
  getAllClasses: () => axiosClient.get('class'),
  getClassById: (id) => axiosClient.get(`class/${id}`),
  createClass: (data) => axiosClient.post('class', data),
  updateClass: (id, data) => axiosClient.put(`class/${id}`, data),
  deleteClass: (id) => axiosClient.delete(`class/${id}`),
  // Patch class status (e.g., set to 'active' or 'draft')
  patchClassStatus: (id, status) => axiosClient.patch(`class/${id}/status`, { status }),
  // Student: get enrolled classes (requires student bearer token)
  getStudentEnrolledClasses: () => axiosClient.get('student/enrolled-classes'),
  // Course related
  getLecturesByCourse: (courseId) => axiosClient.get(`lectures/course/${courseId}`),
  getExamsByCourse: (courseId) => axiosClient.get(`exams/course/${courseId}`),
  getAssignmentsByCourse: (courseId) => axiosClient.get(`assignments/course/${courseId}`),
  // Single resource fetchers
  getLectureById: (id) => axiosClient.get(`lectures/${id}`),
  getAssignmentById: (id) => axiosClient.get(`assignments/${id}`),
  getExamById: (id) => axiosClient.get(`exams/${id}`),
  // Get courses associated with a class (fallback - adjust endpoint if your backend differs)
  getCoursesByClass: (classId) => axiosClient.get(`courses/by-class/${classId}`),
  // Get students in a class
  // GET /api/class/{id}/students
  // Accepts optional params object, e.g. { page: 2 }
  getStudentsByClass: (classId, params) => axiosClient.get(`class/${classId}/students`, { params }),
  // Add students to a class
  // POST /api/class/{id}/students with body { studentEmails: ["a@x","b@x"] }
  addStudentsToClass: (classId, data) => axiosClient.post(`class/${classId}/students`, data),
  // Get assignments submitted or available for a given student in a course
  // GET /api/student/{studentId}/assignments?course={courseId}
  getStudentAssignments: (studentId, params) =>
    axiosClient.get(`student/${studentId}/assignments`, { params }),
  // Get exams for a given student in a course
  // GET /api/student/{studentId}/exams?course={courseId}
  getStudentExams: (studentId, params) => axiosClient.get(`student/${studentId}/exams`, { params }),
  // List submissions by assignment or exam
  // GET /api/submissions?assignment={assignmentId}
  getSubmissionsByAssignment: (assignmentId) =>
    axiosClient.get(`submissions`, { params: { assignment: assignmentId } }),
  // GET /api/submissions?exam={examId}
  getSubmissionsByExam: (examId) => axiosClient.get(`submissions`, { params: { exam: examId } }),
  // Some backends expose path-style endpoints for submissions by assignment/exam
  // e.g. GET /api/submissions/assignment/{id} and GET /api/submissions/exam/{id}
  getSubmissionsByAssignmentId: (assignmentId) =>
    axiosClient.get(`submissions/assignment/${assignmentId}`),
  getSubmissionsByExamId: (examId) => axiosClient.get(`submissions/exam/${examId}`),
  // History endpoints (student's submission attempts history)
  // GET /api/submissions/assignment/{id}/history
  getAssignmentSubmissionHistory: (assignmentId) =>
    axiosClient.get(`submissions/assignment/${assignmentId}/history`),
  // GET /api/submissions/exam/{id}/history
  getExamSubmissionHistory: (examId) => axiosClient.get(`submissions/exam/${examId}/history`),
  // Latest score endpoints for current student
  // GET /api/submissions/assignment/{id}/latest-score
  getAssignmentLatestScore: (assignmentId) =>
    axiosClient.get(`submissions/assignment/${assignmentId}/latest-score`),
  // GET /api/submissions/exam/{id}/latest-score
  getExamLatestScore: (examId) => axiosClient.get(`submissions/exam/${examId}/latest-score`),
  // Remaining attempts
  getExamRemainingAttempts: (examId) =>
    axiosClient.get(`submissions/exam/${examId}/remaining-attempts`),
  getAssignmentRemainingAttempts: (assignmentId) =>
    axiosClient.get(`submissions/assignment/${assignmentId}/remaining-attempts`),
  // Get single submission by id
  // GET /api/submissions/{id}
  getSubmissionById: (id) => axiosClient.get(`submissions/${id}`),
  // Grade a submission: PATCH /api/submissions/{id}/grade with payload { score, feedback }
  gradeSubmission: (submissionId, data) =>
    axiosClient.patch(`submissions/${submissionId}/grade`, data),
  // Create a submission (student): POST /api/submissions (multipart/form-data)
  // Requires exactly one of { assignment_id, exam_id } and an attachment (.use file)
  submitSubmission: (formData) =>
    axiosClient.post('submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Remove a student from a class
  // DELETE /api/class/{classId}/students/{classStudentId}
  removeStudentFromClass: (classId, classStudentId) =>
    axiosClient.delete(`class/${classId}/students/${classStudentId}`),
  // Remove multiple students from a class
  // DELETE /api/class/{classId}/students with body { studentIds: [1,2,3] }
  removeStudentsFromClass: (classId, data) =>
    axiosClient.delete(`class/${classId}/students`, { data }),
  // Get a single course by id
  getCourseById: (courseId) => axiosClient.get(`courses/${courseId}`),
  // Create a new course
  createCourse: (data, config) => axiosClient.post('courses', data, config),
  // Patch course status (e.g., set to 'active' or 'draft')
  patchCourseStatus: (id, status) => axiosClient.patch(`courses/${id}/status`, { status }),

  // Lectures
  // Create lecture: accepts FormData (for file uploads) or JSON payload
  createLecture: (data, config) => axiosClient.post('lectures', data, config),
  // Update lecture: id, data (FormData or JSON)
  updateLecture: (id, data, config) => axiosClient.patch(`lectures/${id}`, data, config),
  // Delete lecture
  deleteLecture: (id) => axiosClient.delete(`lectures/${id}`),
  // patch status of lecture
  patchLectureStatus: (id, status) => axiosClient.patch(`lectures/${id}/status`, { status }),

  // Assignments
  createAssignment: (data, config) => axiosClient.post('assignments', data, config),
  // Update assignment (id, data FormData or JSON)
  updateAssignment: (id, data, config) => axiosClient.put(`assignments/${id}`, data, config),
  // Delete assignment
  deleteAssignment: (id) => axiosClient.delete(`assignments/${id}`),
  // Patch assignment status
  patchAssignmentStatus: (id, status) => axiosClient.patch(`assignments/${id}/status`, { status }),

  // Exams
  createExam: (data, config) => axiosClient.post('exams', data, config),
  // Update exam (id, data FormData or JSON)
  updateExam: (id, data, config) => axiosClient.put(`exams/${id}`, data, config),
  // Delete exam
  deleteExam: (id) => axiosClient.delete(`exams/${id}`),
  // Patch exam status (e.g., publish)
  patchExamStatus: (id, status) => axiosClient.patch(`exams/${id}/status`, { status }),

  // Add more API endpoints as needed for your thesis project
  updateTeacherProfile: (data) => axiosClient.patch('teacher/profile', data),

  //notify
  notify: (userId, data) => axiosClient.post(`notify/${userId}`, data),

  // USE model helpers
  // POST /api/use/parse { path }
  parseUseModel: (path) => axiosClient.post('use/parse', { path }),
  // POST /api/use/save { path }
  saveUseModel: (path) => axiosClient.post('use/save', { path }),
  // Convert UML JSON (from designer) to .use and validate/parse on server
  // Expects payload { graphJson: { ... } }
  // Returns { success, useText, model, cli, validation_report }
  convertUmlJson: (data) => axiosClient.post('uml/export', data),
  // Serialize/deserialize single elements between JSON and USE text
  // JSON -> USE (serialize)
  serializeClass: (data) => axiosClient.post('uml/serialize/class', data),
  serializeAssociation: (data) => axiosClient.post('uml/serialize/association', data),
  serializeOperation: (data) => axiosClient.post('uml/serialize/operation', data),
  serializeConstraint: (data) => axiosClient.post('uml/serialize/constraint', data),
  serializeEnum: (data) => axiosClient.post('uml/serialize/enum', data),
  // USE -> JSON (deserialize)
  deserializeClass: (data) => axiosClient.post('uml/deserialize/class', data),
  deserializeAssociation: (data) => axiosClient.post('uml/deserialize/association', data),
  deserializeOperation: (data) => axiosClient.post('uml/deserialize/operation', data),
  deserializeConstraint: (data) => axiosClient.post('uml/deserialize/constraint', data),
  deserializeEnum: (data) => axiosClient.post('uml/deserialize/enum', data),
  // GET /api/use/models
  getUseModels: () => axiosClient.get('use/models'),
  // Researcher projects
  // GET /api/research/projects/mine
  getResearchProjectsMine: () => axiosClient.get('research/projects/mine'),
  searchProjects: (query, page = 1, limit = 10) =>
    axiosClient.get('research/projects/search', { params: { q: query, page, limit } }),
  // GET /api/research/projects/starred - Get all starred projects
  getStarredProjects: () => axiosClient.get('research/projects/starred'),
  // GET /api/research/statistics
  getResearchStatistics: () => axiosClient.get('research/statistics'),
  // GET /api/research/projects/recent?limit=10
  getRecentProjects: (limit = 10) => axiosClient.get(`research/projects/recent?limit=${limit}`),
  // GET /api/research/projects/{id}
  getResearchProject: (id) => axiosClient.get(`research/projects/${id}`),
  // GET use/models/{id} -> returns USE model details for the project
  getResearchProjectModel: (id) => axiosClient.get(`use/models/${id}`),
  // GET /api/research/projects/{id}/members -> returns owner, moderators, contributors
  getResearchProjectMembers: (id) => axiosClient.get(`research/projects/${id}/members`),
  // POST /api/research/projects { title, description }
  createResearchProject: (data) => axiosClient.post('research/projects', data),
  // PATCH /api/research/projects/{id}/status { status }
  patchResearchProjectStatus: (id, status) =>
    axiosClient.patch(`research/projects/${id}/status`, { status }),
  // PATCH /api/research/projects/{id}/visibility { visibility }
  updateResearchProjectVisibility: (id, visibility) =>
    axiosClient.patch(`research/projects/${id}/visibility`, { visibility }),
  // POST /api/research/projects/{id}/star -> toggles star, returns { star: boolean }
  toggleResearchProjectStar: (id) => axiosClient.post(`research/projects/${id}/star`),
  // GET /api/research/projects/{id}/starred -> returns { project_id, is_starred }
  getResearchProjectStarred: (id) => axiosClient.get(`research/projects/${id}/starred`),
  // POST /api/research/projects/{id}/moderator { email }
  addResearchProjectModerator: (id, email) =>
    axiosClient.post(`research/projects/${id}/moderator`, { email }),
  // POST /api/research/projects/{id}/contributors { emails: [] }
  addResearchProjectContributors: (id, data) =>
    axiosClient.post(`research/projects/${id}/contributors`, data),
  // POST /api/research/projects/{id}/contribute - FormData with file, title, description, name
  postProjectContribution: (id, formData) =>
    axiosClient.post(`research/projects/${id}/contribute`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // GET /api/research/projects/{id}/contributions/history?page=1
  getResearchProjectContributions: (id, page = 1) =>
    axiosClient.get(`research/projects/${id}/contributions/history?page=${page}`),
  // GET /api/research/projects/{id}/contributions/mine?page=1 - Get current user's contributions
  getMyProjectContributions: (id, page = 1) =>
    axiosClient.get(`research/projects/${id}/contributions/mine?page=${page}`),
  // GET /api/research/projects/{id}/contributions/by-status?status=PENDING&page=1
  getContributionsByStatus: (id, status, page = 1) =>
    axiosClient.get(
      `research/projects/${id}/contributions/by-status?status=${status}&page=${page}`
    ),
  // GET /api/research/contributions/{id} - Get contribution details
  getContributionById: (id) => axiosClient.get(`research/contributions/${id}`),
  reviewContribution: (id, reviewData) =>
    axiosClient.post(`research/contributions/${id}/review`, reviewData),
  // GET /api/use/models/{id} - Get specific model file content
  getUseModelById: (id) => axiosClient.get(`use/models/${id}`),
  // GET /api/research/contributions/{id}/comments - Get comments for a contribution
  getContributionComments: (id) => axiosClient.get(`research/contributions/${id}/comments`),
  // POST /api/research/contributions/{id}/comments - Add comment { comment_text }
  addContributionComment: (id, data) =>
    axiosClient.post(`research/contributions/${id}/comments`, data),
  // POST /api/research/contributions/{id}/resubmit - Resubmit contribution { path, rawText }
  resubmitContribution: (id, data) => axiosClient.patch(`research/contributions/${id}`, data),
};

export default userAPI;
