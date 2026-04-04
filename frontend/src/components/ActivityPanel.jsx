import { useEffect, useState } from 'react'
import { getBoardActivity } from '../api'

const eventIcon = {
  task_created: '✅',
  task_moved: '↗️',
  task_deleted: '🗑️',
  column_created: '➕',
  column_deleted: '➖',
  board_created: '🗂️',
}

function timeAgo(isoString) {
    // Append 'Z' so JS treats it as UTC instead of local time
    const utcString = isoString.endsWith('Z') ? isoString : isoString + 'Z'
    const diff = Math.floor((Date.now() - new Date(utcString)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

export default function ActivityPanel({ boardId, onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBoardActivity(boardId)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [boardId])

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={styles.backdrop} />

      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Activity</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : logs.length === 0 ? (
          <p style={styles.empty}>No activity yet.</p>
        ) : (
          <div style={styles.list}>
            {logs.map(log => (
              <div key={log.log_id} style={styles.item}>
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
    position: 'fixed', inset: 0, zIndex: 199,
  },
  panel: {
    position: 'fixed', top: 0, right: 0, height: '100vh',
    width: '320px', backgroundColor: '#fff',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    zIndex: 200, display: 'flex', flexDirection: 'column',
    borderLeft: '1.5px solid #e5e7eb',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.1rem 1.25rem', borderBottom: '1.5px solid #f3f4f6',
  },
  title: {
    margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1a1a2e',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1rem',
    cursor: 'pointer', color: '#6b7280',
  },
  list: {
    overflowY: 'auto', flex: 1, padding: '0.75rem 1rem',
  },
  item: {
    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: '#5b4fcf', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
  },
  itemBody: { flex: 1 },
  desc: { margin: '0 0 4px', fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 },
  icon: { marginRight: '4px' },
  time: { margin: 0, fontSize: '0.75rem', color: '#9ca3af' },
  empty: { padding: '2rem 1.25rem', color: '#9ca3af', fontSize: '0.9rem' },
}