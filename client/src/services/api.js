import api from "@/lib/axios";

export const authService = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get("/auth/me"),
  changePassword: (data) => api.patch("/auth/change-password", data),
};

export const faqService = {
  getAll: (params) => api.get("/faqs", { params }),
  getById: (id) => api.get(`/faqs/${id}`),
  search: (q, params) => api.get("/faqs/search", { params: { q, ...params } }),
  resolve: (question) => api.post("/faqs/resolve", { question }),
  vote: (id, type) => api.post(`/faqs/${id}/vote`, { type }),
  getStats: () => api.get("/faqs/stats"),
};

export const queryService = {
  submit: (question) => api.post("/queries", { question, force: true }),
  getById: (id) => api.get(`/queries/${id}`),
  getFeed: (params) => api.get("/queries/feed", { params }),
  getMyQueries: (params) => api.get("/queries/my", { params }),
  getResponses: (id) => api.get(`/queries/${id}/responses`),
  delete: (id) => api.delete(`/queries/${id}`),
  getStats: () => api.get("/queries/admin/stats"),
};

export const contributorService = {
  accept: (queryId) => api.post(`/contributors/queries/${queryId}/accept`),
  answer: (queryId, data) =>
    api.post(`/contributors/queries/${queryId}/answer`, data),
  skip: (queryId) => api.post(`/contributors/queries/${queryId}/skip`),
  myResponses: (params) => api.get("/contributors/my-responses", { params }),
};

export const adminService = {
  getStats: () => api.get("/admin/stats"),
  getTopContributors: () => api.get("/admin/top-contributors"),
  getPendingReviewQueries: (params) => api.get("/admin/queries/pending-review", { params }),
  publishQueryToFAQ: (id, data) => api.post(`/admin/queries/${id}/publish-faq`, data),
  getPendingFAQs: (params) => api.get("/admin/faqs/pending", { params }),
  approveFAQ: (id) => api.post(`/admin/faqs/${id}/approve`),
  editAndApproveFAQ: (id, data) =>
    api.put(`/admin/faqs/${id}/edit-approve`, data),
  rejectFAQ: (id, reason) =>
    api.delete(`/admin/faqs/${id}/reject`, { data: { reason } }),
  getAllUsers: (params) => api.get("/admin/users", { params }),
  updateUserRole: (userId, role) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.delete(`/admin/users/${userId}`),
};

export const notificationService = {
  getAll: (params) => api.get("/notifications", { params }),
  markAllRead: () => api.post("/notifications/read-all"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const userService = {
  getTopContributors: () => api.get("/admin/top-contributors"),
};
