import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <span style={styles.logo} onClick={() => navigate('/dashboard')}>
          Progresso
        </span>
      </div>

      <div style={styles.right}>
        <span style={styles.username}>👋 {user?.username}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    height: '60px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#5b4fcf',
    cursor: 'pointer',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  username: {
    fontSize: '0.95rem',
    color: '#374151',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: 'transparent',
    color: '#5b4fcf',
    border: '1.5px solid #5b4fcf',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
}

export default Navbar