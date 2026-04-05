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
      <div onClick={onClose} style={styles.backdrop} />

      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>📋</div>
            <h3 style={styles.title}>Activity</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>No activity yet.</p>
            <p style={styles.emptySubtext}>Actions on this board will appear here.</p>
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
              >
                {/* Avatar */}
                <div style={styles.avatarWrapper}>
                  <div style={styles.avatar}>
                    {log.username?.[0]?.toUpperCase()}
                  </div>
                  {index < logs.length - 1 && (
                    <div style={styles.timelineLine} />
                  )}
                </div>

                {/* Body */}
                <div style={styles.itemBody}>
                  <div style={styles.itemHeader}>
                    <span style={styles.eventIcon}>
                      {eventIcon[log.event_type] || '•'}
                    </span>
                    <span style={styles.username}>{log.username}</span>
                    <span style={styles.time}>{timeAgo(log.timestamp)}</span>
                  </div>
                  <p style={styles.desc}>{log.description}</p>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(2px)',
  },
  panel: {
    position: 'fixed', top: 0, right: 0,
    height: '100vh', width: '320px',
    backgroundColor: '#1a1a2e',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex', flexDirection: 'column',
    borderLeft: '1px solid #2a2a45',
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem',
    borderBottom: '1px solid #2a2a45',
    backgroundColor: '#12122a',
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
  },
  headerIcon: {
    width: '30px', height: '30px',
    borderRadius: '8px',
    backgroundColor: 'rgba(124,110,240,0.15)',
    border: '1px solid rgba(124,110,240,0.3)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.85rem',
  },
  title: {
    margin: 0, fontSize: '0.95rem',
    fontWeight: '700', color: '#f0f0ff',
  },
  closeBtn: {
    background: 'none', border: 'none',
    fontSize: '0.9rem', cursor: 'pointer',
    color: '#4a4a6a', padding: '0.25rem',
    borderRadius: '6px',
  },
  list: {
    overflowY: 'auto', flex: 1,
    padding: '0.5rem 1rem',
  },
  item: {
    display: 'flex', gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.85rem 0',
  },
  avatarWrapper: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 0, flexShrink: 0,
  },
  avatar: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem', fontWeight: '700',
    boxShadow: '0 2px 8px rgba(124,110,240,0.3)',
    flexShrink: 0,
  },
  timelineLine: {
    width: '1px',
    flex: 1,
    minHeight: '20px',
    backgroundColor: '#2a2a45',
    marginTop: '4px',
  },
  itemBody: { flex: 1, paddingBottom: '0.25rem' },
  itemHeader: {
    display: 'flex', alignItems: 'center',
    gap: '0.4rem', marginBottom: '0.3rem',
    flexWrap: 'wrap',
  },
  eventIcon: { fontSize: '0.8rem' },
  username: {
    fontSize: '0.8rem', fontWeight: '700',
    color: '#a78bfa',
  },
  time: {
    fontSize: '0.72rem', color: '#4a4a6a',
    marginLeft: 'auto',
  },
  desc: {
    margin: 0, fontSize: '0.82rem',
    color: '#8b8bab', lineHeight: 1.5,
  },
  emptyState: {
    flex: 1, display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2.5rem', marginBottom: '0.75rem',
  },
  emptyText: {
    color: '#f0f0ff', fontSize: '0.9rem',
    fontWeight: '600', margin: '0 0 0.25rem',
  },
  emptySubtext: {
    color: '#4a4a6a', fontSize: '0.8rem', margin: 0,
  },
}