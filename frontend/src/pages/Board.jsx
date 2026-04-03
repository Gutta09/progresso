import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getBoard, createTask, moveTask, deleteTask, getTeamMembers } from '../api'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

const Board = () => {
  const { id } = useParams()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeColumn, setActiveColumn] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [toast, setToast] = useState('')

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
    } catch (err) {
      // not in a team
    }
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

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (columnId) => {
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

  if (loading) return <div style={styles.message}>Loading board...</div>
  if (error) return <div style={styles.message}>{error}</div>
  if (!board) return <div style={styles.message}>Board not found</div>

  return (
    <div>
      <Navbar />

      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}

      <div style={styles.container}>
        <h2 style={styles.boardTitle}>{board.board_name}</h2>

        <div style={styles.columnsWrapper}>
          {board.columns
            .sort((a, b) => a.position_index - b.position_index)
            .map((column) => (
              <Column
                key={column.column_id}
                column={column}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onCreateTask={handleCreateTask}
                onDeleteTask={handleDeleteTask}
                onOpenTask={openTask}
                activeColumn={activeColumn}
                setActiveColumn={setActiveColumn}
                teamMembers={teamMembers}
              />
            ))}
        </div>
      </div>

      {showModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onRefresh={fetchBoard}
        />
      )}
    </div>
  )
}

const Column = ({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onCreateTask,
  onDeleteTask,
  onOpenTask,
  activeColumn,
  setActiveColumn,
  teamMembers,
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
      style={styles.column}
      onDragOver={onDragOver}
      onDrop={() => onDrop(column.column_id)}
    >
      <div style={styles.columnHeader}>
        <span style={styles.columnName}>{column.col_name}</span>
        <span style={styles.taskCount}>{column.tasks?.length || 0}</span>
      </div>

      <div style={styles.taskList}>
        {column.tasks?.map((task) => (
          <TaskCard
            key={task.task_id}
            task={task}
            onDragStart={onDragStart}
            onDelete={onDeleteTask}
            onClick={() => onOpenTask(task)}
            teamMembers={teamMembers}
          />
        ))}
      </div>

      {adding ? (
        <div style={styles.addForm}>
          <input
            style={styles.addInput}
            type="text"
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div style={styles.addActions}>
            <button style={styles.addConfirmBtn} onClick={handleAdd}>
              Add
            </button>
            <button
              style={styles.addCancelBtn}
              onClick={() => {
                setAdding(false)
                setNewTaskTitle('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button style={styles.addTaskBtn} onClick={() => setAdding(true)}>
          + Add task
        </button>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    overflowX: 'auto',
  },
  boardTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '1.5rem',
  },
  columnsWrapper: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    minWidth: 'max-content',
  },
  column: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '1rem',
    width: '280px',
    minHeight: '200px',
    border: '1.5px solid #e5e7eb',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  columnName: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#374151',
  },
  taskCount: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    borderRadius: '999px',
    padding: '0.1rem 0.55rem',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: '60px',
  },
  addTaskBtn: {
    width: '100%',
    padding: '0.6rem',
    marginTop: '0.75rem',
    backgroundColor: 'transparent',
    border: '1.5px dashed #d1d5db',
    borderRadius: '8px',
    color: '#9ca3af',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  addForm: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addInput: {
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1.5px solid #5b4fcf',
    fontSize: '0.9rem',
    outline: 'none',
  },
  addActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  addConfirmBtn: {
    flex: 1,
    padding: '0.5rem',
    backgroundColor: '#5b4fcf',
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
    color: '#6b7280',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  message: {
    padding: '2rem',
    textAlign: 'center',
    color: '#6b7280',
  },
  toast: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    zIndex: 999,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
}

export default Board