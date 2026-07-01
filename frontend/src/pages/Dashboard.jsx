import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBoards, createBoard, deleteBoard, getMyTeam, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TeamManageModal from '../components/TeamManageModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { IconClose } from '../components/icons'

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
  const [codeCopied, setCodeCopied] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState(null)

  useEffect(() => {
    fetchBoards()
    fetchTeam()
    fetchMembers()
  }, [workspace])

  const fetchTeam = async () => {
    try {
      const r = await getMyTeam()
      setTeam(r.data)
    } catch (err) {
      if (err.response?.status !== 404) console.error('Failed to fetch team:', err)
    }
  }

  const fetchMembers = async () => {
    try {
      const r = await getTeamMembers()
      setMembers(r.data)
    } catch (err) {
      if (err.response?.status !== 404) console.error('Failed to fetch team members:', err)
    }
  }

  const fetchBoards = async () => {
    try {
      const res = await getBoards(workspace)
      setBoards(res.data)
    } catch { setError('Failed to load boards') }
    finally { setLoading(false) }
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
    } catch { setError('Failed to create board') }
    finally { setCreating(false) }
  }

  const handleDeleteBoard = async () => {
    const boardId = boardToDelete
    setBoardToDelete(null)
    try {
      await deleteBoard(boardId)
      setBoards(boards.filter(b => b.board_id !== boardId))
    } catch { setError('Failed to delete board') }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(team.invite_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const totalTasks = boards.reduce((acc, b) => acc + (b.columns?.reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0), 0)

  const canManage = workspace === 'individual' || user?.role === 'admin'
  const boardColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.hero}>
          <div>
            <h2 style={s.greeting}>
              {workspace === 'team' ? (team?.team_name || 'Team') : 'Individual'} Overview
            </h2>
            <p style={s.heroSub}>
              {workspace === 'team' ? `${team?.team_name || 'Team'} workspace` : 'Individual workspace'}
            </p>
          </div>
          <div style={s.statsRow}>
            {[
              { label: 'Boards', value: boards.length },
              { label: 'Tasks',  value: totalTasks },
              ...(workspace === 'team' ? [{ label: 'Members', value: members.length }] : []),
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <p style={s.statNum}>{stat.value}</p>
                <p style={s.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Banner */}
        {team && workspace === 'team' && (
          <div style={s.teamBanner}>
            <div style={s.teamBannerLeft}>
              <div style={s.teamIconBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div>
                <p style={s.teamName}>{team.team_name}</p>
                <p style={s.teamSub}>{members.length} {members.length === 1 ? 'member' : 'members'}</p>
              </div>
              {user?.role === 'admin' && <span style={s.adminBadge}>Admin</span>}
            </div>
            <div style={s.teamBannerRight}>
              <button style={s.ghostBtn} onClick={() => { setShowMembers(!showMembers); setShowCode(false) }}>
                {showMembers ? 'Hide Members' : 'View Members'}
              </button>
              {user?.role === 'admin' && (
                <>
                  <button style={s.ghostBtn} onClick={() => { setShowCode(!showCode); setShowMembers(false) }}>
                    {showCode ? 'Hide Invite Code' : 'Invite Code'}
                  </button>
                  <button style={s.primaryBtn} onClick={() => setShowManageTeam(true)}>
                    Manage Team
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Invite Code Panel */}
        {showCode && team && (
          <div style={s.invitePanel}>
            <p style={s.invitePanelLabel}>Share this code with team members</p>
            <div style={s.inviteCodeRow}>
              <span style={s.inviteCodeText}>{team.invite_code}</span>
              <button style={s.copyBtn} onClick={handleCopyCode}>
                {codeCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Members Panel */}
        {showMembers && members.length > 0 && (
          <div style={s.membersPanel}>
            <p style={s.membersPanelTitle}>Team Members</p>
            <div style={s.membersList}>
              {members.map(m => (
                <div key={m.user_id} style={s.memberItem}>
                  <div style={s.memberAvatar}>{m.username.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.memberName}>{m.username}</p>
                    <p style={s.memberRole}>{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Section Header */}
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>
            {workspace === 'team' ? 'Team Project Boards' : 'Personal Boards'}
          </h3>
          {canManage && (
            <form onSubmit={handleCreateBoard} style={s.createForm}>
              <input
                style={s.input}
                type="text"
                placeholder="New board name"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
              <button style={s.createBtn} type="submit" disabled={creating}>
                {creating ? 'Creating...' : '+ New Board'}
              </button>
            </form>
          )}
        </div>

        {/* Boards Grid */}
        {loading ? (
          <div style={s.emptyState}><p style={s.emptyText}>Loading boards...</p></div>
        ) : boards.length === 0 ? (
          <div style={s.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <p style={s.emptyText}>No boards found</p>
            <p style={s.emptySubtext}>
              {canManage ? 'Create your first board using the form above.' : 'No boards have been created yet.'}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {boards.map((board) => {
              const taskCount = board.columns?.reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0
              const colCount  = board.columns?.length || 0
              const color     = boardColors[board.board_id % boardColors.length]
              const doneCount = board.columns?.filter(c =>
                c.col_name?.toLowerCase().includes('done') || c.col_name?.toLowerCase().includes('complete')
              ).reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0
              const pct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0

              return (
                <div
                  key={board.board_id}
                  style={s.card}
                  onClick={() => navigate(`/board/${board.board_id}`)}
                >
                  <div style={{ ...s.cardStrip, backgroundColor: color }} />
                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <h3 style={s.boardName}>{board.board_name}</h3>
                      {canManage && (
                        <button
                          style={s.deleteBtn}
                          onClick={(e) => { e.stopPropagation(); setBoardToDelete(board.board_id) }}
                          title="Delete board"
                        >
                          <IconClose size={14} />
                        </button>
                      )}
                    </div>
                    <div style={s.cardMeta}>
                      <span style={s.metaChip}>{colCount} {colCount === 1 ? 'column' : 'columns'}</span>
                      <span style={s.metaChip}>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <div style={s.cardFooter}>
                      <span style={s.cardDate}>
                        {board.created_date ? `Created ${board.created_date}` : 'Created recently'}
                      </span>
                      <span style={{ ...s.cardPct, color }}>{pct}% complete</span>
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

      {boardToDelete && (
        <ConfirmDialog
          title="Delete Board"
          message="Delete this board? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteBoard}
          onCancel={() => setBoardToDelete(null)}
        />
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', backgroundColor: 'var(--bg-base)' },
  container: { maxWidth: '1120px', margin: '0 auto', padding: '2rem 1.5rem' },
  hero: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem',
  },
  greeting: { fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.2rem', letterSpacing: '-0.02em' },
  heroSub: { fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 },
  statsRow: { display: 'flex', gap: '0.75rem' },
  statCard: {
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '0.7rem 1.1rem', textAlign: 'center', minWidth: '72px',
  },
  statNum: { fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent)', margin: '0 0 0.1rem' },
  statLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
  teamBanner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px',
    padding: '0.9rem 1.1rem', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  teamBannerLeft: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  teamIconBox: {
    width: '34px', height: '34px', borderRadius: '8px',
    backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  teamName: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
  teamSub:  { fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 },
  adminBadge: {
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-border)', borderRadius: '999px',
    padding: '0.18rem 0.6rem', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em',
  },
  teamBannerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  ghostBtn: {
    padding: '0.38rem 0.85rem', backgroundColor: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
  },
  primaryBtn: {
    padding: '0.38rem 0.85rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
  },
  invitePanel: {
    backgroundColor: 'var(--accent-soft)', border: '1.5px dashed var(--accent-border)',
    borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.75rem', textAlign: 'center',
  },
  invitePanelLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' },
  inviteCodeRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  inviteCodeText: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '0.3em' },
  copyBtn: {
    padding: '0.4rem 1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
  },
  membersPanel: {
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '1.1rem', marginBottom: '0.75rem',
  },
  membersPanelTitle: {
    fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.7rem',
  },
  membersList: { display: 'flex', flexWrap: 'wrap', gap: '0.65rem' },
  memberItem: {
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '0.45rem 0.8rem 0.45rem 0.45rem',
  },
  memberAvatar: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.8rem', flexShrink: 0,
  },
  memberName: { fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 },
  memberRole: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: 0 },
  errorBox: {
    backgroundColor: 'var(--danger-soft)', border: '1px solid var(--priority-high-border)',
    color: 'var(--danger)', padding: '0.7rem 1rem', borderRadius: '8px',
    marginBottom: '1rem', fontSize: '0.85rem',
  },
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  sectionTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)', margin: 0 },
  createForm: { display: 'flex', gap: '0.5rem' },
  input: {
    flex: 1, padding: '0.6rem 0.9rem', borderRadius: '8px',
    border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none',
    backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', minWidth: '180px',
  },
  createBtn: {
    padding: '0.6rem 1.1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem',
    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' },
  card: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '12px',
    border: '1px solid var(--border)', cursor: 'pointer', overflow: 'hidden',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  cardStrip: { height: '3px', width: '100%' },
  cardBody: { padding: '1.1rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' },
  boardName: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, flex: 1, lineHeight: 1.4 },
  deleteBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    display: 'flex', padding: '0.1rem 0.3rem', borderRadius: '4px', cursor: 'pointer', flexShrink: 0,
  },
  cardMeta: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.8rem' },
  metaChip: {
    fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border)', borderRadius: '999px', padding: '0.18rem 0.6rem',
  },
  progressBar: { height: '3px', backgroundColor: 'var(--bg-raised)', borderRadius: '999px', marginBottom: '0.75rem' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: '0.72rem', color: 'var(--text-muted)' },
  cardPct:  { fontSize: '0.72rem', fontWeight: '600' },
  emptyState: {
    textAlign: 'center', padding: '4rem 2rem',
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px',
  },
  emptyText:    { fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' },
  emptySubtext: { fontSize: '0.85rem', color: 'var(--text-muted)' },
}

export default Dashboard
