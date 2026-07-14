import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Profile from './pages/Profile'
import MyTasks from './pages/MyTasks'
import Report from './pages/Report'
import Repo from './pages/Repo'

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/signup"    element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/board/:id" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-tasks"  element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="/report"    element={<ProtectedRoute><Report /></ProtectedRoute>} />
          <Route path="/repo"      element={<ProtectedRoute><Repo /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App