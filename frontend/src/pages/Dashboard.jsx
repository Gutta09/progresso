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
    } catch (err) {}
  }

  const fetchMembers = async () => {
    try {
      const res = await getTeamMembers()
      setMembers(res.data)
    } catch (err) {}
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

  const totalTasks = boards.reduce(
    (acc, b) => acc + (b.columns?.reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0), 0
  )
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const canManage = workspace === 'individual' || user?.role === 'admin'

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* ── Hero header ── */}
        <div style={styles.hero}>
          <div>
            <h2 style={styles.greeting}>
              {getGreeting()}, {user?.username} 👋
            </h2>
            <p style={styles.heroSub}>
              {workspace === 'team'
                ? `${team?.team_name || 'Team'} workspace`
                : 'Your personal workspace'}
            </p>
          </div>

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <p style={styles.statNum}>{boards.length}</p>
              <p style={styles.statLabel}>Boards</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statNum}>{totalTasks}</p>
              <p style={styles.statLabel}>Tasks</p>
            </div>
            {workspace === 'team' && (
              <div style={styles.statCard}>
                <p style={styles.statNum}>{members.length}</p>
                <p style={styles.statLabel}>Members</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Team banner ── */}
        {team && workspace === 'team' && (
          <div style={styles.teamBanner}>
            <div style={styles.teamBannerLeft}>
              <div style={styles.teamIconBox}>👥</div>
              <div>
                <p style={styles.teamBannerName}>{team.team_name}</p>
                <p style={styles.teamBannerSub}>{members.length} members</p>
              </div>
              {user?.role === 'admin' && (
                <span style={styles.adminBadge}>Admin</span>
              )}
            </div>
            <div style={styles.teamBannerRight}>
              <button
                style={styles.ghostBtn}
                onClick={() => { setShowMembers(!showMembers); setShowCode(false) }}
              >
                👥 Members
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    style={styles.ghostBtn}
                    onClick={() => { setShowCode(!showCode); setShowMembers(false) }}
                  >
                    🔑 {showCode ? 'Hide code' : 'Invite code'}
                  </button>
                  <button
                    style={styles.purpleBtn}
                    onClick={() => setShowManageTeam(true)}
                  >
                    Manage team
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Invite code panel ── */}
        {showCode && team && (
          <div style={styles.invitePanel}>
            <p style={styles.invitePanelLabel}>
              🔑 Share this code with teammates
            </p>
            <div style={styles.inviteCodeRow}>
              <span style={styles.inviteCodeText}>{team.invite_code}</span>
              <button
                style={styles.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText(team.invite_code)
                  alert('Copied!')
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* ── Members panel ── */}
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

        {/* ── Section header + create form ── */}
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            {workspace === 'team' ? '🗂 Team Boards' : '🗂 My Boards'}
          </h3>

          {canManage && (
            <form onSubmit={handleCreateBoard} style={styles.createForm}>
              <input
                style={styles.input}
                type="text"
                placeholder="New board name..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
              <button style={styles.createBtn} type="submit" disabled={creating}>
                {creating ? 'Creating...' : '+ New Board'}
              </button>
            </form>
          )}
        </div>

        {/* ── Boards grid ── */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🗂</p>
            <p style={styles.emptyText}>No boards yet</p>
            <p style={styles.emptySubtext}>
              {canManage ? 'Create your first board above to get started.' : 'No boards have been created yet.'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {boards.map((board) => {
              const taskCount = board.columns?.reduce(
                (a, c) => a + (c.tasks?.length || 0), 0
              ) || 0
              const colCount = board.columns?.length || 0
              // Pick a subtle accent color per board based on id
              const accents = ['#7c6ef0', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa']
              const accent = accents[board.board_id % accents.length]

              return (
                <div
                  key={board.board_id}
                  style={styles.card}
                  onClick={() => navigate(`/board/${board.board_id}`)}
                >
                  {/* Color strip */}
                  <div style={{ ...styles.cardStrip, backgroundColor: accent }} />

                  <div style={styles.cardBody}>
                    <div style={styles.cardTop}>
                      <h3 style={styles.boardName}>{board.board_name}</h3>
                      {canManage && (
                        <button
                          style={styles.deleteBtn}
                          onClick={(e) => handleDeleteBoard(e, board.board_id)}
                          title="Delete board"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div style={styles.cardMeta}>
                      <span style={styles.metaChip}>
                        📋 {colCount} {colCount === 1 ? 'column' : 'columns'}
                      </span>
                      <span style={styles.metaChip}>
                        ✅ {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={styles.cardDate}>
                        {board.created_date
                          ? `Created ${board.created_date}`
                          : 'Created recently'}
                      </span>
                      <span style={{ ...styles.cardArrow, color: accent }}>→</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showManageTeam && team && (
        <TeamManageModal
          team={team}
          members={members}
          onClose={() => setShowManageTeam(false)}
          onRefresh={() => { fetchTeam(); fetchMembers() }}
        />
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f0f1a',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  greeting: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#f0f0ff',
    margin: '0 0 0.25rem',
  },
  heroSub: {
    fontSize: '0.9rem',
    color: '#8b8bab',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  statCard: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '12px',
    padding: '0.75rem 1.25rem',
    textAlign: 'center',
    minWidth: '70px',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#a78bfa',
    margin: '0 0 0.1rem',
  },
  statLabel: {
    fontSize: '0.72rem',
    color: '#8b8bab',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  teamBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  teamBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  teamIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(124,110,240,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    border: '1px solid rgba(124,110,240,0.3)',
  },
  teamBannerName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
  },
  teamBannerSub: {
    fontSize: '0.75rem',
    color: '#8b8bab',
    margin: 0,
  },
  adminBadge: {
    backgroundColor: 'rgba(124,110,240,0.15)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '999px',
    padding: '0.2rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
  },
  teamBannerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
  },
  ghostBtn: {
    padding: '0.4rem 0.9rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1px solid #2a2a45',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  purpleBtn: {
    padding: '0.4rem 0.9rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
  },
  invitePanel: {
    background: 'rgba(124,110,240,0.08)',
    border: '1.5px dashed rgba(124,110,240,0.4)',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  invitePanelLabel: {
    fontSize: '0.85rem',
    color: '#8b8bab',
    marginBottom: '0.75rem',
  },
  inviteCodeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  inviteCodeText: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#a78bfa',
    letterSpacing: '0.3em',
  },
  copyBtn: {
    padding: '0.45rem 1rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  membersPanel: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  membersPanelTitle: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#8b8bab',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.75rem',
  },
  membersList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: '#12122a',
    border: '1px solid #2a2a45',
    borderRadius: '10px',
    padding: '0.5rem 0.85rem 0.5rem 0.5rem',
  },
  memberAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  memberName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f0f0ff',
    margin: 0,
  },
  memberRole: {
    fontSize: '0.72rem',
    color: '#8b8bab',
    textTransform: 'capitalize',
    margin: 0,
  },
  error: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
  },
  createForm: {
    display: 'flex',
    gap: '0.6rem',
  },
  input: {
    flex: 1,
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    minWidth: '180px',
  },
  createBtn: {
    padding: '0.7rem 1.25rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: '14px',
    border: '1px solid #2a2a45',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
  },
  cardStrip: {
    height: '4px',
    width: '100%',
  },
  cardBody: {
    padding: '1.25rem',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  },
  boardName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
    flex: 1,
    lineHeight: 1.4,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#4a4a6a',
    fontSize: '0.85rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  cardMeta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '0.85rem',
  },
  metaChip: {
    fontSize: '0.75rem',
    color: '#8b8bab',
    backgroundColor: '#12122a',
    border: '1px solid #2a2a45',
    borderRadius: '999px',
    padding: '0.2rem 0.65rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: '#4a4a6a',
  },
  cardArrow: {
    fontSize: '1rem',
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#f0f0ff',
    marginBottom: '0.5rem',
  },
  emptySubtext: {
    fontSize: '0.875rem',
    color: '#8b8bab',
  },
}

export default Dashboard