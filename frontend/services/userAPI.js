import axiosClient from "./axiosClient";

const userAPI = {
  // Auth
  // Đăng nhập: chỉ nhận email, password
  login: ({ email, password }) =>
    axiosClient.post("auth/login", { email, password }),

  // Đăng ký: nhận email, password, role (UPPER), full_name, dob, gender (UPPER)
  register: ({ email, password, role, full_name, dob, gender }) =>
    axiosClient.post("auth/register", { email, password, role, full_name, dob, gender }),
  getProfile: () => axiosClient.get("auth/profile"),
  updateProfile: (data) => axiosClient.patch("auth/profile", data),
  // Teacher
  getTeacherProfile: () => axiosClient.get("teacher/profile"),
  getTeacherCourses: () => axiosClient.get("teacher/courses"),
  // Get classes managed/taught by the teacher (requires teacher bearer token)
  getTeacherClasses: () => axiosClient.get("teacher/classes"),
  // Student
  getStudentProfile: () => axiosClient.get("student/profile"),
  updateStudentProfile: (data) => axiosClient.patch("student/profile", data),

  // User management (add more as needed)
  getAllUsers: () => axiosClient.get("users"),
  // Returns a list of student emails: { success: true, data: ["student1@example.com"] }
  getStudentEmails: () => axiosClient.get("users/students/emails"),
  getUserById: (id) => axiosClient.get(`users/${id}`),
  // Get user by email: GET /api/users/by-email?email=...
  getUserByEmail: (email) => axiosClient.get(`users/by-email?email=${encodeURIComponent(email)}`),
  updateUser: (id, data) => axiosClient.put(`users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`users/${id}`),

  // Class management
  getAllClasses: () => axiosClient.get("class"),
  getClassById: (id) => axiosClient.get(`class/${id}`),
  createClass: (data) => axiosClient.post("class", data),
  updateClass: (id, data) => axiosClient.put(`class/${id}`, data),
  deleteClass: (id) => axiosClient.delete(`class/${id}`),
  // Student: get enrolled classes (requires student bearer token)
  getStudentEnrolledClasses: () => axiosClient.get("student/enrolled-classes"),
  // Course related
  getLecturesByCourse: (courseId) => axiosClient.get(`lectures/course/${courseId}`),
  getExamsByCourse: (courseId) => axiosClient.get(`exams/course/${courseId}`),
  getAssignmentsByCourse: (courseId) => axiosClient.get(`assignments/course/${courseId}`),
  // Get courses associated with a class (fallback - adjust endpoint if your backend differs)
  getCoursesByClass: (classId) => axiosClient.get(`courses/by-class/${classId}`),

  // Lectures
  // Create lecture: accepts FormData (for file uploads) or JSON payload
  createLecture: (data, config) => axiosClient.post('lectures', data, config),
  // Update lecture: id, data (FormData or JSON)
  updateLecture: (id, data, config) => axiosClient.patch(`lectures/${id}`, data, config),
  // Delete lecture
  deleteLecture: (id) => axiosClient.delete(`lectures/${id}`),
  // patch status of lecture
  patchLectureStatus: (id, status) => axiosClient.patch(`lectures/${id}/status`, { status }),

  // Add more API endpoints as needed for your thesis project
  updateTeacherProfile: (data) => axiosClient.patch("teacher/profile", data),

  //notify
  notify: (userId, data) => axiosClient.post(`notify/${userId}`, data),
};

export default userAPI;
