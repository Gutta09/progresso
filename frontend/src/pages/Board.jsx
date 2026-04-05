import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getBoard, createTask, moveTask, deleteTask, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ActivityPanel from '../components/ActivityPanel'

const columnAccents = ['#7c6ef0', '#fbbf24', '#34d399', '#f87171', '#60a5fa', '#a78bfa']

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

  useEffect(() => {
    fetchBoard()
    fetchTeamMembers()
  }, [id])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchTeamMembers = async () => {
    try {
      const res = await getTeamMembers()
      setTeamMembers(res.data)
    } catch (err) {}
  }

  const fetchBoard = async () => {
    try {
      const res = await getBoard(id)
      setBoard(res.data)
    } catch (err) {
      setError('Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (task) => setDraggedTask(task)
  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDrop = async (columnId) => {
    setDragOverColumn(null)
    if (!draggedTask || draggedTask.column_id === columnId) return
    try {
      await moveTask(draggedTask.task_id, { column_id: columnId })
      await fetchBoard()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to move task')
    } finally {
      setDraggedTask(null)
    }
  }

  const handleCreateTask = async (columnId, title) => {
    if (!title.trim()) return
    try {
      await createTask({ title: title.trim(), column_id: columnId })
      await fetchBoard()
    } catch (err) {
      showToast('Failed to create task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId)
      await fetchBoard()
    } catch (err) {
      showToast('Failed to delete task')
    }
  }

  const openTask = (task) => {
    setSelectedTask(task)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedTask(null)
    setShowModal(false)
    fetchBoard()
  }

  if (loading) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.message}>Loading board...</div>
    </div>
  )
  if (error) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.message}>{error}</div>
    </div>
  )
  if (!board) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.message}>Board not found</div>
    </div>
  )

  const isTeamBoard = !!board.team_id
  const isAdmin = user?.role === 'admin'
  const canManageTasks = !isTeamBoard || isAdmin
  const totalTasks = board.columns?.reduce((a, c) => a + (c.tasks?.length || 0), 0) || 0

  return (
    <div style={styles.page}>
      <Navbar />

      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.container}>
        {/* ── Board header ── */}
        <div style={styles.boardHeader}>
          <div style={styles.boardHeaderLeft}>
            <h2 style={styles.boardTitle}>{board.board_name}</h2>
            <div style={styles.boardMeta}>
              <span style={styles.metaChip}>
                📋 {board.columns?.length || 0} columns
              </span>
              <span style={styles.metaChip}>
                ✅ {totalTasks} tasks
              </span>
              {isTeamBoard && (
                <span style={styles.metaChip}>
                  👥 Team board
                </span>
              )}
            </div>
          </div>
          <button
            style={styles.activityBtn}
            onClick={() => setShowActivity(true)}
          >
            📋 Activity
          </button>
        </div>

        {/* ── Columns ── */}
        <div style={styles.columnsWrapper}>
          {board.columns
            .sort((a, b) => a.position_index - b.position_index)
            .map((column, index) => (
              <Column
                key={column.column_id}
                column={column}
                accent={columnAccents[index % columnAccents.length]}
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
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onRefresh={fetchBoard}
          isTeamBoard={isTeamBoard}
        />
      )}

      {showActivity && (
        <ActivityPanel boardId={id} onClose={() => setShowActivity(false)} />
      )}
    </div>
  )
}

const Column = ({
  column,
  accent,
  onDragStart,
  onDragOver,
  onDrop,
  onCreateTask,
  onDeleteTask,
  onOpenTask,
  isDragOver,
  teamMembers,
  canManageTasks,
}) => {
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
        ...styles.column,
        borderColor: isDragOver ? accent : '#2a2a45',
        boxShadow: isDragOver ? `0 0 0 2px ${accent}40` : 'none',
      }}
      onDragOver={(e) => onDragOver(e, column.column_id)}
      onDrop={() => onDrop(column.column_id)}
      onDragLeave={() => {}}
    >
      {/* Column accent top bar */}
      <div style={{ ...styles.columnAccentBar, backgroundColor: accent }} />

      <div style={styles.columnHeader}>
        <div style={styles.columnHeaderLeft}>
          <span style={styles.columnName}>{column.col_name}</span>
        </div>
        <span style={{
          ...styles.taskCount,
          backgroundColor: `${accent}20`,
          color: accent,
        }}>
          {column.tasks?.length || 0}
        </span>
      </div>

      <div style={styles.taskList}>
        {column.tasks?.map((task) => (
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
          <div style={styles.addForm}>
            <input
              style={{
                ...styles.addInput,
                borderColor: accent,
              }}
              type="text"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div style={styles.addActions}>
              <button
                style={{
                  ...styles.addConfirmBtn,
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                }}
                onClick={handleAdd}
              >
                Add
              </button>
              <button
                style={styles.addCancelBtn}
                onClick={() => { setAdding(false); setNewTaskTitle('') }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            style={styles.addTaskBtn}
            onClick={() => setAdding(true)}
          >
            + Add task
          </button>
        )
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
    padding: '2rem',
    overflowX: 'auto',
  },
  boardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    gap: '1rem',
  },
  boardHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  boardTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#f0f0ff',
    margin: 0,
  },
  boardMeta: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: '0.75rem',
    color: '#8b8bab',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '999px',
    padding: '0.2rem 0.65rem',
  },
  activityBtn: {
    padding: '0.5rem 1.1rem',
    backgroundColor: 'rgba(124,110,240,0.12)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  columnsWrapper: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    minWidth: 'max-content',
    paddingBottom: '1rem',
  },
  column: {
    backgroundColor: '#1a1a2e',
    borderRadius: '14px',
    width: '290px',
    minHeight: '200px',
    border: '1px solid #2a2a45',
    overflow: 'hidden',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  columnAccentBar: {
    height: '3px',
    width: '100%',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.9rem 1rem 0.5rem',
  },
  columnHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  columnName: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#f0f0ff',
  },
  taskCount: {
    borderRadius: '999px',
    padding: '0.1rem 0.55rem',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    minHeight: '60px',
    padding: '0.5rem 0.75rem',
  },
  addTaskBtn: {
    width: 'calc(100% - 1.5rem)',
    margin: '0.5rem 0.75rem 0.75rem',
    padding: '0.6rem',
    backgroundColor: 'transparent',
    border: '1.5px dashed #2a2a45',
    borderRadius: '8px',
    color: '#4a4a6a',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  },
  addForm: {
    padding: '0.5rem 0.75rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addInput: {
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1.5px solid',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    width: '100%',
    boxSizing: 'border-box',
  },
  addActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  addConfirmBtn: {
    flex: 1,
    padding: '0.5rem',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addCancelBtn: {
    flex: 1,
    padding: '0.5rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1px solid #2a2a45',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  message: {
    padding: '2rem',
    textAlign: 'center',
    color: '#8b8bab',
  },
  toast: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1a1a2e',
    color: '#f0f0ff',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '500',
    zIndex: 999,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid #2a2a45',
  },
}

export default Board