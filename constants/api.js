export const API_URL = 'https://scilearnbackend.onrender.com/api';

export const endpoints = {
  login: `${API_URL}/users/login/`,
  register: `${API_URL}/users/register/`,
  profile: `${API_URL}/users/profile/`,
  update: `${API_URL}/users/update/`,
  changePassword: `${API_URL}/users/change-password/`,
  deleteAccount: `${API_URL}/users/delete/`,
  courses: `${API_URL}/courses/`,
  tokens: `${API_URL}/tokens/packages/`,
  buy: `${API_URL}/tokens/buy/`,
  balance: `${API_URL}/tokens/balance/`,
  qa: `${API_URL}/qa/`,
  certificate: (courseId) => `${API_URL}/courses/certificate/${courseId}/`,
  lessonNotes: (lessonId) => `${API_URL}/courses/notes/${lessonId}/`,
};