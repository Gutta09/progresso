import { useEffect, useState } from 'react'
import { getRecentActivity } from '../api'
import { useNavigate } from 'react-router-dom'

const eventLabels = {
  task_created:   'Task Created',
  task_moved:     'Task Moved',
  task_deleted:   'Task Deleted',
  column_created: 'Column Added',
  column_deleted: 'Column Removed',
  board_created:  'Board Created',
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
    getRecentActivity().then(setLogs).finally(() => setLoading(false))
  }, [])

  const handleLogClick = (log) => { onClose(); navigate(`/board/${log.board_id}`) }

  return (
    <>
      <div onClick={onClose} style={s.backdrop} />
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <h3 style={s.title}>Notifications</h3>
          </div>
          {logs.length > 0 && <span style={s.countBadge}>{logs.length}</span>}
          <button onClick={onClose} style={s.closeBtn}>&times;</button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={s.emptyState}><p style={s.emptyText}>Loading...</p></div>
        ) : logs.length === 0 ? (
          <div style={s.emptyState}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.65rem' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={s.emptyText}>All caught up.</p>
            <p style={s.emptySubtext}>No recent activity from teammates.</p>
          </div>
        ) : (
          <div style={s.list}>
            {logs.map((log, index) => (
              <div
                key={log.log_id}
                style={{ ...s.item, borderBottom: index < logs.length - 1 ? '1px solid #334155' : 'none' }}
                onClick={() => handleLogClick(log)}
              >
                <div style={s.avatar}>{log.username?.[0]?.toUpperCase()}</div>
                <div style={s.itemBody}>
                  <div style={s.itemHeader}>
                    <span style={s.username}>{log.username}</span>
                    <span style={s.eventLabel}>{eventLabels[log.event_type] || 'Action'}</span>
                    <span style={s.time}>{timeAgo(log.timestamp)}</span>
                  </div>
                  <p style={s.desc}>{log.description}</p>
                </div>
                <span style={s.arrowIcon}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const s = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 149 },
  panel: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: '310px', maxHeight: '460px',
    backgroundColor: '#1E293B', borderRadius: '12px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)', border: '1px solid #334155',
    zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.9rem 1rem', borderBottom: '1px solid #334155',
    backgroundColor: '#263348',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1 },
  title: { margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#F1F5F9' },
  countBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)', color: '#93C5FD',
    border: '1px solid rgba(59,130,246,0.25)', borderRadius: '999px',
    padding: '0.08rem 0.4rem', fontSize: '0.68rem', fontWeight: '700',
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#475569', flexShrink: 0, lineHeight: 1 },
  list: { overflowY: 'auto', flex: 1 },
  item: {
    display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
    padding: '0.8rem 1rem', cursor: 'pointer', transition: 'background 0.15s',
  },
  avatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: '700', flexShrink: 0,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemHeader: { display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem', flexWrap: 'wrap' },
  username: { fontSize: '0.75rem', fontWeight: '700', color: '#CBD5E1' },
  eventLabel: {
    fontSize: '0.65rem', color: '#93C5FD',
    backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: '4px', padding: '0.06rem 0.3rem', fontWeight: '600',
  },
  time: { fontSize: '0.67rem', color: '#475569', marginLeft: 'auto', flexShrink: 0 },
  desc: { margin: 0, fontSize: '0.77rem', color: '#94A3B8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  arrowIcon: { color: '#475569', fontSize: '1.1rem', flexShrink: 0, alignSelf: 'center' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' },
  emptyText:    { color: '#F1F5F9', fontSize: '0.85rem', fontWeight: '600', margin: '0 0 0.2rem' },
  emptySubtext: { color: '#475569', fontSize: '0.75rem', margin: 0 },
}