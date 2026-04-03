import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState(
    localStorage.getItem('workspace') || 'team'
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('workspace')
    setUser(null)
    setWorkspace('team')
  }

  const switchWorkspace = (type) => {
    setWorkspace(type)
    localStorage.setItem('workspace', type)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, workspace, switchWorkspace }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)