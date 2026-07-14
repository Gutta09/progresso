import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  getGithubStatus, connectGithub, disconnectGithub,
  getGithubCommits, getGithubIssues, getGithubPulls, syncGithub,
} from '../api'

const IconGit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 01-9 9" />
  </svg>
)

const timeAgo = (iso) => {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

const Repo = () => {
  const { user, workspace } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('commits')
  const [commits, setCommits] = useState([])
  const [issues, setIssues] = useState([])
  const [pulls, setPulls] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  // connect form
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const s = await getGithubStatus()
      setStatus(s)
      if (s.connected) loadTab('commits')
    } catch (err) {
      if (err.response?.status === 404) setStatus({ connected: false, notInTeam: true })
      else setError('Failed to load GitHub status')
    } finally { setLoading(false) }
  }

  const loadTab = async (which) => {
    setTab(which); setDataLoading(true); setError('')
    try {
      if (which === 'commits') setCommits(await getGithubCommits())
      if (which === 'issues')  setIssues(await getGithubIssues('open'))
      if (which === 'pulls')   setPulls(await getGithubPulls('open'))
    } catch {
      setError('Could not fetch data from GitHub')
    } finally { setDataLoading(false) }
  }

  const handleConnect = async () => {
    if (!repo.trim() || !token.trim()) { setError('Repository and token are required'); return }
    setConnecting(true); setError('')
    try {
      const s = await connectGithub({ repo: repo.trim(), token: token.trim() })
      setStatus(s); setRepo(''); setToken(''); loadTab('commits')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect repository')
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect this repository from the team?')) return
    try { await disconnectGithub(); setStatus({ connected: false }) }
    catch { setError('Failed to disconnect') }
  }

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('')
    try {
      const r = await syncGithub()
      setSyncMsg(r.updated > 0 ? `${r.updated} task(s) updated from GitHub` : 'Everything is in sync')
      if (tab === 'issues') loadTab('issues')
    } catch { setSyncMsg('Sync failed') }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 4000) }
  }

  useEffect(() => { fetchStatus() }, [])

  if (loading) return <><Navbar /><div style={s.center}>Loading…</div></>

  if (workspace !== 'team' || status?.notInTeam) {
    return <><Navbar /><div style={s.center}>
      <div style={s.emptyCard}>
        <IconGit />
        <h3 style={s.emptyTitle}>Team workspace required</h3>
        <p style={s.emptyText}>Switch to a team workspace to connect a GitHub repository.</p>
      </div>
    </div></>
  }

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}><span style={s.headerIcon}><IconGit /></span>
            <div>
              <h2 style={s.title}>GitHub</h2>
              <p style={s.subtitle}>Connect a repository so your whole team can work around it.</p>
            </div>
          </div>
          {status?.connected && (
            <button style={s.syncBtn} onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          )}
        </div>

        {error && <div style={s.error}>{error}</div>}
        {syncMsg && <div style={s.info}>{syncMsg}</div>}

        {!status?.connected ? (
          <div style={s.connectCard}>
            {isAdmin ? (
              <>
                <h3 style={s.cardTitle}>Connect a repository</h3>
                <p style={s.help}>
                  Paste a repo (<code>owner/name</code> or its URL) and a GitHub personal access
                  token with repo access. The token is encrypted and never leaves the server.
                </p>
                <label style={s.label}>Repository</label>
                <input style={s.input} placeholder="Gutta09/progresso" value={repo} onChange={e => setRepo(e.target.value)} />
                <label style={s.label}>Access token</label>
                <input style={s.input} type="password" placeholder="ghp_…" value={token} onChange={e => setToken(e.target.value)} />
                <button style={s.primaryBtn} onClick={handleConnect} disabled={connecting}>
                  {connecting ? 'Connecting…' : 'Connect repository'}
                </button>
              </>
            ) : (
              <div style={s.emptyCard}>
                <IconGit />
                <h3 style={s.emptyTitle}>No repository connected</h3>
                <p style={s.emptyText}>Ask your team admin to connect a GitHub repository.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Repo summary */}
            <div style={s.repoBar}>
              <div>
                <a style={s.repoName} href={status.meta?.html_url} target="_blank" rel="noreferrer">
                  {status.repo}
                </a>
                {status.meta?.description && <p style={s.repoDesc}>{status.meta.description}</p>}
                <p style={s.repoMeta}>
                  {status.meta?.private ? 'Private' : 'Public'} · {status.meta?.open_issues_count ?? 0} open issues
                  {status.connected_by ? ` · connected by ${status.connected_by}` : ''}
                </p>
              </div>
              {isAdmin && <button style={s.dangerBtn} onClick={handleDisconnect}>Disconnect</button>}
            </div>

            {isAdmin && status.webhook_secret && (
              <details style={s.webhook}>
                <summary style={s.webhookSummary}>Real-time sync (webhook) — optional</summary>
                <p style={s.help}>
                  In your repo → Settings → Webhooks, add payload URL
                  <code> &lt;your-server&gt;/github/webhook</code>, content type <code>application/json</code>,
                  secret below, and subscribe to <b>Issues</b> events.
                </p>
                <code style={s.secret}>{status.webhook_secret}</code>
              </details>
            )}

            {/* Tabs */}
            <div style={s.tabs}>
              {['commits', 'issues', 'pulls'].map(t => (
                <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => loadTab(t)}>
                  {t === 'commits' ? 'Commits' : t === 'issues' ? 'Open Issues' : 'Pull Requests'}
                </button>
              ))}
            </div>

            <div style={s.list}>
              {dataLoading ? <div style={s.center}>Loading…</div> : (
                <>
                  {tab === 'commits' && (commits.length ? commits.map(c => (
                    <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer" style={s.row}>
                      <code style={s.sha}>{c.sha}</code>
                      <span style={s.rowMain}>{c.message}</span>
                      <span style={s.rowMeta}>{c.author} · {timeAgo(c.date)}</span>
                    </a>
                  )) : <div style={s.center}>No commits</div>)}

                  {tab === 'issues' && (issues.length ? issues.map(i => (
                    <a key={i.number} href={i.html_url} target="_blank" rel="noreferrer" style={s.row}>
                      <span style={s.num}>#{i.number}</span>
                      <span style={s.rowMain}>{i.title}</span>
                      <span style={s.rowMeta}>{i.user} · {timeAgo(i.created_at)}</span>
                    </a>
                  )) : <div style={s.center}>No open issues</div>)}

                  {tab === 'pulls' && (pulls.length ? pulls.map(p => (
                    <a key={p.number} href={p.html_url} target="_blank" rel="noreferrer" style={s.row}>
                      <span style={s.num}>#{p.number}</span>
                      <span style={s.rowMain}>{p.title}{p.draft ? ' (draft)' : ''}</span>
                      <span style={s.rowMeta}>{p.user} · {timeAgo(p.created_at)}</span>
                    </a>
                  )) : <div style={s.center}>No open pull requests</div>)}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

const s = {
  page: { maxWidth: 860, margin: '0 auto', padding: '1.75rem 1.5rem' },
  center: { textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  headerLeft: { display: 'flex', gap: '0.85rem', alignItems: 'center' },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
  },
  title: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  subtitle: { fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' },
  syncBtn: {
    padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid var(--accent-border)',
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
  },
  error: { backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', padding: '0.6rem 0.85rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem' },
  info: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', padding: '0.6rem 0.85rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem' },
  connectCard: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' },
  help: { fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 1rem' },
  label: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', margin: '0.6rem 0 0.35rem' },
  input: { width: '100%', padding: '0.7rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  primaryBtn: { marginTop: '1.1rem', padding: '0.7rem 1.2rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  emptyCard: { textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  emptyTitle: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0 0' },
  emptyText: { fontSize: '0.82rem', margin: 0 },
  repoBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.15rem', marginBottom: '1rem' },
  repoName: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' },
  repoDesc: { fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' },
  repoMeta: { fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.4rem 0 0' },
  dangerBtn: { padding: '0.4rem 0.8rem', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--danger)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
  webhook: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' },
  webhookSummary: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' },
  secret: { display: 'inline-block', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-raised)', padding: '0.3rem 0.5rem', borderRadius: 6, wordBreak: 'break-all' },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '0.9rem' },
  tab: { padding: '0.4rem 0.9rem', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' },
  tabActive: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  list: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)' },
  sha: { fontSize: '0.74rem', color: 'var(--accent)', fontFamily: 'monospace', flexShrink: 0, width: 56 },
  num: { fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0, width: 44 },
  rowMain: { flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 },
}

export default Repo
