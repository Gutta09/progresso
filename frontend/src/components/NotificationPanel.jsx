import { useEffect, useState } from 'react'
import { getRecentActivity } from '../api'
import { useNavigate } from 'react-router-dom'

const eventIcon = {
  task_created: '✅',
  task_moved: '↗️',
  task_deleted: '🗑️',
  column_created: '➕',
  column_deleted: '➖',
  board_created: '🗂️',
}

function timeAgo(isoString) {
  const utcString = isoString.endsWith('Z') ? isoString : isoString + 'Z'
  const diff = Math.floor((Date.now() - new Date(utcString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationPanel({ onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getRecentActivity()
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [])

  const handleLogClick = (log) => {
    onClose()
    navigate(`/board/${log.board_id}`)
  }

  return (
    <>
      <div onClick={onClose} style={styles.backdrop} />
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>🔔 Notifications</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : logs.length === 0 ? (
          <p style={styles.empty}>No new activity from teammates.</p>
        ) : (
          <div style={styles.list}>
            {logs.map(log => (
              <div
                key={log.log_id}
                style={styles.item}
                onClick={() => handleLogClick(log)}
              >
                <div style={styles.avatar}>
                  {log.username?.[0]?.toUpperCase()}
                </div>
                <div style={styles.itemBody}>
                  <p style={styles.desc}>
                    <span style={styles.icon}>{eventIcon[log.event_type] || '•'}</span>
                    {log.description}
                  </p>
                  <p style={styles.time}>{timeAgo(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 149,
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '320px',
    maxHeight: '480px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
    border: '1.5px solid #e5e7eb',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1.5px solid #f3f4f6',
  },
  title: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  closeBtn: {
    background: 'none', border: 'none',
    fontSize: '1rem', cursor: 'pointer', color: '#6b7280',
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.85rem 1.25rem',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: '#5b4fcf', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
  },
  itemBody: { flex: 1 },
  desc: {
    margin: '0 0 4px',
    fontSize: '0.83rem',
    color: '#374151',
    lineHeight: 1.4,
  },
  icon: { marginRight: '4px' },
  time: { margin: 0, fontSize: '0.75rem', color: '#9ca3af' },
  empty: {
    padding: '2rem 1.25rem',
    color: '#9ca3af',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
}