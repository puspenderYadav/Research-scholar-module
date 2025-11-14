import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const scholarAPI = {
  getAll: () => api.get('/scholars'),
  getById: (id) => api.get(`/scholars/${id}`),
  getMyProfile: () => api.get('/scholars/my-profile'),
  update: (id, data) => api.put(`/scholars/${id}`, data),
  requestSupervisorChange: (data) => api.post('/scholars/request-supervisor-change', data),
};

export const supervisorAPI = {
  getAll: () => api.get('/supervisors'),
  getById: (id) => api.get(`/supervisors/${id}`),
  getMyProfile: () => api.get('/supervisors/my-profile'),
};

export const examAPI = {
  getByScholar: (scholarId) => api.get(`/exams/scholar/${scholarId}`),
  schedule: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
};

export const seminarAPI = {
  getByScholar: (scholarId) => api.get(`/seminars/scholar/${scholarId}`),
  create: (data) => api.post('/seminars', data),
  update: (id, data) => api.put(`/seminars/${id}`, data),
};

export const synopsisAPI = {
  getByScholar: (scholarId) => api.get(`/synopsis/scholar/${scholarId}`),
  submit: (formData) => api.post('/synopsis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  review: (id, data) => api.post(`/synopsis/${id}/review`, data),
};

export const progressReportAPI = {
  getByScholar: (scholarId) => api.get(`/progress-reports/scholar/${scholarId}`),
  submit: (formData) => api.post('/progress-reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  review: (id, data) => api.post(`/progress-reports/${id}/review`, data),
};

export const thesisAPI = {
  getByScholar: (scholarId) => api.get(`/thesis/scholar/${scholarId}`),
  submit: (formData) => api.post('/thesis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  scheduleDefense: (id, data) => api.post(`/thesis/${id}/schedule-defense`, data),
};

export const travelGrantAPI = {
  getAll: () => api.get('/travel-grants'),
  getById: (id) => api.get(`/travel-grants/${id}`),
  create: (data) => api.post('/travel-grants', data),
  approve: (id, data) => api.post(`/travel-grants/${id}/approve`, data),
  getPending: () => api.get('/travel-grants/pending'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

export const calendarAPI = {
  getEvents: (params) => api.get('/calendar/events', { params }),
};

export const dashboardAPI = {
  getScholarDashboard: () => api.get('/dashboard/scholar'),
  getSupervisorDashboard: () => api.get('/dashboard/supervisor'),
  getDeanDashboard: () => api.get('/dashboard/dean'),
};

export const supervisorChangeAPI = {
  createRequest: (data) => api.post('/supervisor-change/request', data),
  getMyRequests: () => api.get('/supervisor-change/my-requests'),
  getPendingApprovals: () => api.get('/supervisor-change/pending-approvals'),
  getRequestDetails: (id) => api.get(`/supervisor-change/${id}`),
  approveByCurrentSupervisor: (id, data) => api.post(`/supervisor-change/${id}/approve-current-supervisor`, data),
  approveByNewSupervisor: (id, data) => api.post(`/supervisor-change/${id}/approve-new-supervisor`, data),
  approveByDean: (id, data) => api.post(`/supervisor-change/${id}/approve-dean`, data),
  getAllRequests: (status) => api.get('/supervisor-change/all', { params: { status } }),
};

export const schoolAPI = {
  getAll: () => api.get('/schools'),
  getById: (id) => api.get(`/schools/${id}`),
  getMySchool: () => api.get('/schools/my-school'),
};

export const researchOfficeAPI = {
  getDashboard: () => api.get('/research-office/dashboard'),
  getPendingRequests: () => api.get('/research-office/pending-requests'),
  getAllScholars: () => api.get('/research-office/all-scholars'),
  getAllFaculty: () => api.get('/research-office/all-faculty'),
  exportScholars: () => api.get('/research-office/export-scholars', { responseType: 'blob' }),
  getAnnouncements: () => api.get('/research-office/announcements'),
  createAnnouncement: (formData) => {
    return api.post('/research-office/announcements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAnnouncement: (id) => api.get(`/research-office/announcements/${id}`),
  updateAnnouncement: (id, data) => api.put(`/research-office/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/research-office/announcements/${id}`),
  publishAnnouncement: (id) => api.post(`/research-office/announcements/${id}/publish`),
};

export const deanAPI = {
  getDashboard: () => api.get('/dean/dashboard'),
  getPendingApprovals: () => api.get('/dean/pending-approvals'),
  getAllScholars: () => api.get('/dean/all-scholars'),
  getAllFaculty: () => api.get('/dean/all-faculty'),
  bulkUploadScholars: (formData) => {
    return api.post('/dean/bulk-upload-scholars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadSampleCSV: () => {
    return api.get('/dean/download-sample-csv', {
      responseType: 'blob',
    });
  },
  recruitFaculty: (data) => api.post('/dean/recruit-faculty', data),
  createSchool: (data) => api.post('/dean/create-school', data),
  getAllSchools: () => api.get('/dean/schools'),
  createAnnouncement: (formData) => {
    return api.post('/dean/announcements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAnnouncements: () => api.get('/dean/announcements'),
  getAnnouncement: (id) => api.get(`/dean/announcements/${id}`),
  updateAnnouncement: (id, data) => api.put(`/dean/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/dean/announcements/${id}`),
  publishAnnouncement: (id) => api.post(`/dean/announcements/${id}/publish`),
  suspendScholar: (scholarId, data) => api.post(`/dean/suspend-scholar/${scholarId}`, data),
  rusticateScholar: (scholarId, data) => api.post(`/dean/rusticate-scholar/${scholarId}`, data),
  reactivateScholar: (scholarId) => api.post(`/dean/reactivate-scholar/${scholarId}`),
  exportScholars: () => api.get('/dean/export-scholars', { responseType: 'blob' }),
};

export const leaveAPI = {
  getAll: () => api.get('/leaves'),
  getById: (id) => api.get(`/leaves/${id}`),
  getBalance: () => api.get('/leaves/balance'),
  create: (formData) => api.post('/leaves', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approve: (id, data) => api.post(`/leaves/${id}/approve`, data),
  getPending: () => api.get('/leaves/pending'),
};

export const meetingAPI = {
  getAll: () => api.get('/meetings'),
  getById: (id) => api.get(`/meetings/${id}`),
  getSupervisedScholars: () => api.get('/meetings/supervised-scholars'),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  cancel: (id) => api.delete(`/meetings/${id}`),
  addScholarComment: (id, comment) => api.post(`/meetings/${id}/scholar-comment`, { comment }),
  cleanupOld: () => api.post('/meetings/cleanup-old'),
  cleanupNotifications: () => api.post('/meetings/cleanup-notifications'),
};

export const approvalsAPI = {
  getAll: () => api.get('/approvals/all'),
  getSummary: () => api.get('/approvals/summary'),
};
