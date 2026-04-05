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

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.bellIcon}>🔔</span>
            <h3 style={styles.title}>Notifications</h3>
          </div>
          {logs.length > 0 && (
            <span style={styles.countBadge}>{logs.length}</span>
          )}
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🎉</p>
            <p style={styles.emptyText}>All caught up!</p>
            <p style={styles.emptySubtext}>No new activity from teammates.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {logs.map((log, index) => (
              <div
                key={log.log_id}
                style={{
                  ...styles.item,
                  borderBottom: index < logs.length - 1
                    ? '1px solid #2a2a45'
                    : 'none',
                }}
                onClick={() => handleLogClick(log)}
              >
                <div style={styles.avatarWrapper}>
                  <div style={styles.avatar}>
                    {log.username?.[0]?.toUpperCase()}
                  </div>
                </div>

                <div style={styles.itemBody}>
                  <div style={styles.itemHeader}>
                    <span style={styles.username}>{log.username}</span>
                    <span style={styles.eventIcon}>
                      {eventIcon[log.event_type] || '•'}
                    </span>
                    <span style={styles.time}>{timeAgo(log.timestamp)}</span>
                  </div>
                  <p style={styles.desc}>{log.description}</p>
                </div>

                <span style={styles.arrowIcon}>→</span>
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
    top: 'calc(100% + 10px)',
    right: 0,
    width: '320px',
    maxHeight: '480px',
    backgroundColor: '#1a1a2e',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    border: '1px solid #2a2a45',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.1rem',
    borderBottom: '1px solid #2a2a45',
    backgroundColor: '#12122a',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
  },
  bellIcon: {
    fontSize: '0.9rem',
  },
  title: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f0f0ff',
  },
  countBadge: {
    backgroundColor: 'rgba(124,110,240,0.2)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '999px',
    padding: '0.1rem 0.45rem',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: '#4a4a6a',
    padding: '0.2rem',
    borderRadius: '4px',
    flexShrink: 0,
  },
  list: {
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    gap: '0.7rem',
    alignItems: 'flex-start',
    padding: '0.85rem 1rem',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  avatarWrapper: {
    flexShrink: 0,
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    boxShadow: '0 2px 8px rgba(124,110,240,0.3)',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    marginBottom: '0.25rem',
  },
  username: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#a78bfa',
  },
  eventIcon: {
    fontSize: '0.75rem',
  },
  time: {
    fontSize: '0.7rem',
    color: '#4a4a6a',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  desc: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#8b8bab',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  arrowIcon: {
    color: '#4a4a6a',
    fontSize: '0.85rem',
    flexShrink: 0,
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2rem',
    marginBottom: '0.75rem',
  },
  emptyText: {
    color: '#f0f0ff',
    fontSize: '0.875rem',
    fontWeight: '600',
    margin: '0 0 0.25rem',
  },
  emptySubtext: {
    color: '#4a4a6a',
    fontSize: '0.78rem',
    margin: 0,
  },
}