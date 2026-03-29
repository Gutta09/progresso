import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBoards, createBoard, deleteBoard } from '../api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const res = await getBoards()
      setBoards(res.data)
    } catch (err) {
      setError('Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!newBoardName.trim()) return
    if (!user?.team_id) {
      setError('You need to be part of a team to create a board')
      return
    }
    setCreating(true)
    try {
      const res = await createBoard({
        board_name: newBoardName.trim(),
        team_id: user.team_id,
      })
      setBoards([...boards, res.data])
      setNewBoardName('')
    } catch (err) {
      setError('Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBoard = async (e, boardId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this board?')) return
    try {
      await deleteBoard(boardId)
      setBoards(boards.filter((b) => b.board_id !== boardId))
    } catch (err) {
      setError('Failed to delete board')
    }
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.heading}>My Boards</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleCreateBoard} style={styles.createForm}>
          <input
            style={styles.input}
            type="text"
            placeholder="New board name..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
          />
          <button style={styles.createBtn} type="submit" disabled={creating}>
            {creating ? 'Creating...' : '+ Create Board'}
          </button>
        </form>

        {loading ? (
          <p style={styles.message}>Loading boards...</p>
        ) : boards.length === 0 ? (
          <p style={styles.message}>No boards yet. Create your first one above!</p>
        ) : (
          <div style={styles.grid}>
            {boards.map((board) => (
              <div
                key={board.board_id}
                style={styles.card}
                onClick={() => navigate(`/board/${board.board_id}`)}
              >
                <div style={styles.cardTop}>
                  <h3 style={styles.boardName}>{board.board_name}</h3>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => handleDeleteBoard(e, board.board_id)}
                  >
                    ✕
                  </button>
                </div>
                <p style={styles.boardMeta}>
                  {board.columns?.length || 0} columns •{' '}
                  {board.columns?.reduce(
                    (acc, col) => acc + (col.tasks?.length || 0), 0
                  )}{' '}
                  tasks
                </p>
                <p style={styles.boardDate}>
                  Created {board.created_date || 'recently'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  createForm: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
  },
  createBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    border: '1.5px solid transparent',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },
  boardName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.9rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  boardMeta: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '0.4rem',
  },
  boardDate: {
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  message: {
    color: '#6b7280',
    fontSize: '0.95rem',
  },
}

export default Dashboard