import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auth ───────────────────────────────────────────
export const registerUser = (data) => api.post('/users/register', data)
export const loginUser = (data) => api.post('/users/login', data)
export const getMe = () => api.get('/users/me')

// ─── Boards ─────────────────────────────────────────
export const getBoards = (workspace = 'team') => api.get(`/boards/?workspace=${workspace}`)
export const createBoard = (data) => api.post('/boards/', data)
export const getBoard = (id) => api.get(`/boards/${id}`)
export const deleteBoard = (id) => api.delete(`/boards/${id}`)

// ─── Columns ────────────────────────────────────────
export const createColumn = (data) => api.post('/boards/columns/new', data)
export const deleteColumn = (id) => api.delete(`/boards/columns/${id}`)

// ─── Tasks ──────────────────────────────────────────
export const createTask = (data) => api.post('/tasks/', data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)
export const moveTask = (id, data) => api.put(`/tasks/${id}/move`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

// ─── Comments ───────────────────────────────────────
export const addComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data)
export const deleteComment = (commentId) => api.delete(`/tasks/comments/${commentId}`)

// ─── Teams ──────────────────────────────────────────
export const createTeam = (data) => api.post('/teams/create', data)
export const joinTeam = (data) => api.post('/teams/join', data)
export const getMyTeam = () => api.get('/teams/me')
export const getTeamMembers = () => api.get('/teams/members')