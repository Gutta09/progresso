const ConfirmDialog = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) => {
  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>{title}</h3>
        <p style={s.message}>{message}</p>
        <div style={s.actions}>
          <button style={s.cancelBtn} onClick={onCancel}>{cancelLabel}</button>
          <button style={danger ? s.dangerBtn : s.confirmBtn} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 300, padding: '1rem',
  },
  modal: {
    backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1.6rem',
    width: '100%', maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
  },
  title: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.6rem' },
  message: { fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 },
  actions: { display: 'flex', gap: '0.6rem' },
  cancelBtn: {
    flex: 1, padding: '0.7rem', backgroundColor: 'transparent',
    color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: '0.875rem', cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1, padding: '0.7rem',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  dangerBtn: {
    flex: 1, padding: '0.7rem', backgroundColor: 'var(--danger)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
}

export default ConfirmDialog
