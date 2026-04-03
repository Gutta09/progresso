import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBoards, createBoard, deleteBoard, getMyTeam, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TeamManageModal from '../components/TeamManageModal'

const Dashboard = () => {
  const { user, workspace } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [team, setTeam] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [showManageTeam, setShowManageTeam] = useState(false)

  useEffect(() => {
    fetchBoards()
    fetchTeam()
    fetchMembers()
  }, [workspace])

  const fetchTeam = async () => {
    try {
      const res = await getMyTeam()
      setTeam(res.data)
    } catch (err) {
      // user has no team, that's fine
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await getTeamMembers()
      setMembers(res.data)
    } catch (err) {
      // no team
    }
  }

  const fetchBoards = async () => {
    try {
      const res = await getBoards(workspace)
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
    setCreating(true)
    try {
      const res = await createBoard({
        board_name: newBoardName.trim(),
        team_id: workspace === 'team' ? (user.team_id || null) : null,
      })
      setBoards([...boards, res.data])
      setNewBoardName('')
      setError('')
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
          <h2 style={styles.heading}>
            {workspace === 'team' ? '👥 Team Boards' : '🧑‍💻 My Boards'}
          </h2>
        </div>

        {team && (
          <div style={styles.teamBanner}>
            <div style={styles.teamBannerLeft}>
              <span style={styles.teamBannerName}>👥 {team.team_name}</span>
              {user?.role === 'admin' && (
                <span style={styles.adminBadge}>Admin</span>
              )}
            </div>
            <div style={styles.teamBannerRight}>
              <button
                style={styles.showCodeBtn}
                onClick={() => {
                  setShowMembers(!showMembers)
                  setShowCode(false)
                }}
              >
                👥 {members.length} members
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    style={styles.showCodeBtn}
                    onClick={() => {
                      setShowCode(!showCode)
                      setShowMembers(false)
                    }}
                  >
                    {showCode ? 'Hide code' : 'Show invite code'}
                  </button>
                  <button
                    style={styles.manageBtn}
                    onClick={() => setShowManageTeam(true)}
                  >
                    Manage team
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {showCode && team && (
          <div style={styles.inviteCodeBanner}>
            <p style={styles.inviteCodeLabel}>
              Share this code with teammates to join your team
            </p>
            <div style={styles.inviteCodeBox}>
              <span style={styles.inviteCodeText}>{team.invite_code}</span>
              <button
                style={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText(team.invite_code)
                  alert('Copied to clipboard!')
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {showMembers && members.length > 0 && (
          <div style={styles.membersPanel}>
            <p style={styles.membersPanelTitle}>Team members</p>
            <div style={styles.membersList}>
              {members.map((member) => (
                <div key={member.user_id} style={styles.memberItem}>
                  <div style={styles.memberAvatar}>
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.memberName}>{member.username}</p>
                    <p style={styles.memberRole}>{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {(workspace === 'individual' || user?.role === 'admin') && (
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
        )}

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
                  {(workspace === 'individual' || user?.role === 'admin') && (
                    <button
                      style={styles.deleteBtn}
                      onClick={(e) => handleDeleteBoard(e, board.board_id)}
                    >
                      ✕
                    </button>
                  )}
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

      {showManageTeam && team && (
        <TeamManageModal
          team={team}
          members={members}
          onClose={() => setShowManageTeam(false)}
          onRefresh={() => {
            fetchTeam()
            fetchMembers()
          }}
        />
      )}
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
    cursor: 'pointer',
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
  teamBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    padding: '0.85rem 1.25rem',
    marginBottom: '1rem',
  },
  teamBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  teamBannerName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
  },
  adminBadge: {
    backgroundColor: '#f5f3ff',
    color: '#5b4fcf',
    border: '1px solid #5b4fcf',
    borderRadius: '999px',
    padding: '0.15rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  teamBannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  showCodeBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: 'transparent',
    color: '#5b4fcf',
    border: '1.5px solid #5b4fcf',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  manageBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  inviteCodeBanner: {
    backgroundColor: '#f5f3ff',
    border: '2px dashed #5b4fcf',
    borderRadius: '10px',
    padding: '1.25rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  inviteCodeLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
  },
  inviteCodeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  inviteCodeText: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#5b4fcf',
    letterSpacing: '0.3em',
  },
  copyBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  membersPanel: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  membersPanelTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  memberAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  memberName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
  },
  memberRole: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
}

export default Dashboard