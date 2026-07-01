import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getBoard, createTask, moveTask, deleteTask, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ActivityPanel from '../components/ActivityPanel'

const columnColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4']

const Board = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeColumn, setActiveColumn] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [toast, setToast] = useState('')
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => { fetchBoard(); fetchTeamMembers() }, [id])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const fetchTeamMembers = async () => { try { const r = await getTeamMembers(); setTeamMembers(r.data) } catch {} }

  const fetchBoard = async () => {
    try { const r = await getBoard(id); setBoard(r.data) }
    catch { setError('Failed to load board') }
    finally { setLoading(false) }
  }

  const handleDragStart = (task) => setDraggedTask(task)
  const handleDragOver = (e, columnId) => { e.preventDefault(); setDragOverColumn(columnId) }

  const handleDrop = async (columnId) => {
    setDragOverColumn(null)
    if (!draggedTask || draggedTask.column_id === columnId) return
    try { await moveTask(draggedTask.task_id, { column_id: columnId }); await fetchBoard() }
    catch (err) { showToast(err.response?.data?.detail || 'Failed to move task') }
    finally { setDraggedTask(null) }
  }

  const handleCreateTask = async (columnId, title) => {
    if (!title.trim()) return
    try { await createTask({ title: title.trim(), column_id: columnId }); await fetchBoard() }
    catch { showToast('Failed to create task') }
  }

  const handleDeleteTask = async (taskId) => {
    try { await deleteTask(taskId); await fetchBoard() }
    catch { showToast('Failed to delete task') }
  }

  const openTask = (task) => { setSelectedTask(task); setShowModal(true) }
  const closeModal = () => { setSelectedTask(null); setShowModal(false); fetchBoard() }

  if (loading) return <div style={s.page}><Navbar /><div style={s.message}>Loading board...</div></div>
  if (error)   return <div style={s.page}><Navbar /><div style={s.message}>{error}</div></div>
  if (!board)  return <div style={s.page}><Navbar /><div style={s.message}>Board not found.</div></div>

  const isTeamBoard   = !!board.team_id
  const isAdmin       = user?.role === 'admin'
  const canManageTasks = !isTeamBoard || isAdmin
  const totalTasks    = board.columns?.reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0

  return (
    <div style={s.page}>
      <Navbar />
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.container}>
        {/* Board Header */}
        <div style={s.boardHeader}>
          <div style={s.boardHeaderLeft}>
            <h2 style={s.boardTitle}>{board.board_name}</h2>
            <div style={s.boardMeta}>
              <span style={s.metaChip}>{board.columns?.length || 0} columns</span>
              <span style={s.metaChip}>{totalTasks} tasks</span>
              {isTeamBoard && <span style={s.metaChip}>Team Board</span>}
            </div>
          </div>
          <button style={s.activityBtn} onClick={() => setShowActivity(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Activity Log
          </button>
        </div>

        {/* Columns */}
        <div style={s.columnsWrapper}>
          {board.columns
            .sort((a, b) => a.position_index - b.position_index)
            .map((column, index) => (
              <Column
                key={column.column_id}
                column={column}
                accent={columnColors[index % columnColors.length]}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onCreateTask={handleCreateTask}
                onDeleteTask={handleDeleteTask}
                onOpenTask={openTask}
                isDragOver={dragOverColumn === column.column_id}
                teamMembers={teamMembers}
                canManageTasks={canManageTasks}
              />
            ))}
        </div>
      </div>

      {showModal && selectedTask && (
        <TaskModal task={selectedTask} onClose={closeModal} onRefresh={fetchBoard} isTeamBoard={isTeamBoard} />
      )}
      {showActivity && (
        <ActivityPanel boardId={id} onClose={() => setShowActivity(false)} />
      )}
    </div>
  )
}

const Column = ({ column, accent, onDragStart, onDragOver, onDrop, onCreateTask, onDeleteTask, onOpenTask, isDragOver, teamMembers, canManageTasks }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newTaskTitle.trim()) return
    await onCreateTask(column.column_id, newTaskTitle)
    setNewTaskTitle('')
    setAdding(false)
  }

  return (
    <div
      style={{
        ...s.column,
        borderColor: isDragOver ? accent : '#334155',
        boxShadow: isDragOver ? `0 0 0 2px ${accent}40` : 'none',
      }}
      onDragOver={(e) => onDragOver(e, column.column_id)}
      onDrop={() => onDrop(column.column_id)}
    >
      <div style={{ ...s.columnAccentBar, backgroundColor: accent }} />
      <div style={s.columnHeader}>
        <span style={s.columnName}>{column.col_name}</span>
        <span style={{ ...s.taskCount, backgroundColor: `${accent}18`, color: accent }}>
          {column.tasks?.length || 0}
        </span>
      </div>
      <div style={s.taskList}>
        {column.tasks?.map(task => (
          <TaskCard
            key={task.task_id}
            task={task}
            onDragStart={onDragStart}
            onDelete={canManageTasks ? onDeleteTask : null}
            onClick={() => onOpenTask(task)}
            teamMembers={teamMembers}
          />
        ))}
      </div>
      {canManageTasks && (
        adding ? (
          <div style={s.addForm}>
            <input
              style={{ ...s.addInput, borderColor: accent }}
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div style={s.addActions}>
              <button style={{ ...s.addConfirmBtn, background: accent }} onClick={handleAdd}>Add</button>
              <button style={s.addCancelBtn} onClick={() => { setAdding(false); setNewTaskTitle('') }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={s.addTaskBtn} onClick={() => setAdding(true)}>+ Add Task</button>
        )
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#0F172A' },
  container: { padding: '1.75rem', overflowX: 'auto' },
  boardHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: '1.75rem', gap: '1rem',
  },
  boardHeaderLeft: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  boardTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#F1F5F9', margin: 0, letterSpacing: '-0.02em' },
  boardMeta: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  metaChip: {
    fontSize: '0.72rem', color: '#64748B', backgroundColor: '#1E293B',
    border: '1px solid #334155', borderRadius: '999px', padding: '0.18rem 0.6rem',
  },
  activityBtn: {
    display: 'flex', alignItems: 'center',
    padding: '0.45rem 1rem', backgroundColor: 'rgba(59,130,246,0.1)',
    color: '#93C5FD', border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: '8px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  columnsWrapper: {
    display: 'flex', gap: '1.1rem', alignItems: 'flex-start',
    minWidth: 'max-content', paddingBottom: '1rem',
  },
  column: {
    backgroundColor: '#1E293B', borderRadius: '12px',
    width: '285px', minHeight: '200px', border: '1px solid #334155',
    overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  columnAccentBar: { height: '3px', width: '100%' },
  columnHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.85rem 0.9rem 0.4rem',
  },
  columnName: { fontWeight: '700', fontSize: '0.85rem', color: '#CBD5E1' },
  taskCount: { borderRadius: '999px', padding: '0.08rem 0.5rem', fontSize: '0.72rem', fontWeight: '700' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '50px', padding: '0.4rem 0.7rem' },
  addTaskBtn: {
    width: 'calc(100% - 1.4rem)', margin: '0.4rem 0.7rem 0.65rem',
    padding: '0.55rem', backgroundColor: 'transparent',
    border: '1.5px dashed #334155', borderRadius: '7px',
    color: '#475569', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  addForm: { padding: '0.4rem 0.7rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  addInput: {
    padding: '0.55rem 0.7rem', borderRadius: '7px', border: '1.5px solid',
    fontSize: '0.85rem', outline: 'none', backgroundColor: '#263348',
    color: '#F1F5F9', width: '100%', boxSizing: 'border-box',
  },
  addActions: { display: 'flex', gap: '0.4rem' },
  addConfirmBtn: {
    flex: 1, padding: '0.45rem', color: '#fff', border: 'none',
    borderRadius: '7px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
  },
  addCancelBtn: {
    flex: 1, padding: '0.45rem', backgroundColor: 'transparent',
    color: '#94A3B8', border: '1px solid #334155', borderRadius: '7px',
    fontSize: '0.82rem', cursor: 'pointer',
  },
  message: { padding: '3rem', textAlign: 'center', color: '#64748B' },
  toast: {
    position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: '#1E293B', color: '#F1F5F9', padding: '0.7rem 1.4rem',
    borderRadius: '9px', fontSize: '0.875rem', fontWeight: '500', zIndex: 999,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid #334155',
  },
}

export default Board