import { useEffect, useState } from 'react'
import { getBoardActivity } from '../api'
import { IconClose } from './icons'

const eventLabels = {
  task_created:   'Task created',
  task_moved:     'Task moved',
  task_deleted:   'Task deleted',
  column_created: 'Column added',
  column_deleted: 'Column removed',
  board_created:  'Board created',
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
      .catch((err) => console.error('Failed to fetch board activity:', err))
      .finally(() => setLoading(false))
  }, [boardId])

  return (
    <>
      <div onClick={onClose} style={s.backdrop} />
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <h3 style={s.title}>Activity Log</h3>
          </div>
          <button onClick={onClose} style={s.closeBtn}><IconClose size={16} /></button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={s.emptyState}><p style={s.emptyText}>Loading...</p></div>
        ) : logs.length === 0 ? (
          <div style={s.emptyState}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={s.emptyText}>No activity yet.</p>
            <p style={s.emptySubtext}>Actions on this board will appear here.</p>
          </div>
        ) : (
          <div style={s.list}>
            {logs.map((log, index) => (
              <div key={log.log_id} style={{ ...s.item, borderBottom: index < logs.length - 1 ? '1px solid var(--bg-surface)' : 'none' }}>
                <div style={s.avatarWrapper}>
                  <div style={s.avatar}>{log.username?.[0]?.toUpperCase()}</div>
                  {index < logs.length - 1 && <div style={s.timelineLine} />}
                </div>
                <div style={s.itemBody}>
                  <div style={s.itemHeader}>
                    <span style={s.eventLabel}>{eventLabels[log.event_type] || 'Action'}</span>
                    <span style={s.username}>{log.username}</span>
                    <span style={s.time}>{timeAgo(log.timestamp)}</span>
                  </div>
                  <p style={s.desc}>{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const s = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 199, backgroundColor: 'var(--overlay)', backdropFilter: 'blur(2px)' },
  panel: {
    position: 'fixed', top: 0, right: 0, height: '100vh', width: '310px',
    backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)',
    zIndex: 200, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-raised)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  title: { margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', lineHeight: 1 },
  list: { overflowY: 'auto', flex: 1, padding: '0.5rem 1rem' },
  item: { display: 'flex', gap: '0.7rem', alignItems: 'flex-start', padding: '0.8rem 0' },
  avatarWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
  avatar: {
    width: '30px', height: '30px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
  },
  timelineLine: { width: '1px', flex: 1, minHeight: '18px', backgroundColor: 'var(--border)', marginTop: '4px' },
  itemBody: { flex: 1, paddingBottom: '0.2rem' },
  itemHeader: { display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', flexWrap: 'wrap' },
  eventLabel: {
    fontSize: '0.68rem', fontWeight: '700', color: 'var(--accent)',
    backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
    borderRadius: '4px', padding: '0.08rem 0.35rem',
  },
  username: { fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' },
  time: { fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' },
  desc: { margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' },
  emptyText:    { color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600', margin: '0 0 0.2rem' },
  emptySubtext: { color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 },
}
