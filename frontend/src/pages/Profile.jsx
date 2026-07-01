import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { updateProfile } from "../api"
import Navbar from "../components/Navbar"

export default function Profile() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setError(""); setSuccess("")
    if (newPassword && newPassword !== confirmPassword) return setError("New passwords do not match.")
    if (newPassword && newPassword.length < 6) return setError("New password must be at least 6 characters.")
    const payload = {}
    if (username !== user.username) payload.username = username
    if (email !== user.email) payload.email = email
    if (newPassword) { payload.current_password = currentPassword; payload.new_password = newPassword }
    if (Object.keys(payload).length === 0) return setError("No changes to save.")
    try {
      setLoading(true)
      const updated = await updateProfile(payload)
      const token = localStorage.getItem("token")
      login(token, updated)
      setSuccess("Profile updated successfully.")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed.")
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Profile Hero */}
        <div style={s.hero}>
          <div style={s.avatarCircle}>{user?.username?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={s.heroName}>{user?.username}</h2>
            <p style={s.heroEmail}>{user?.email}</p>
            <span style={s.roleBadge}>{user?.role}</span>
          </div>
        </div>

        <div style={s.grid}>
          {/* Account Info */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <h3 style={s.cardTitle}>Account Information</h3>
            </div>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
          </div>

          {/* Change Password */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <h3 style={s.cardTitle}>Change Password</h3>
            </div>
            <div style={s.field}>
              <label style={s.label}>Current Password</label>
              <input style={s.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Required to change password" />
            </div>
            <div style={s.field}>
              <label style={s.label}>New Password</label>
              <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm New Password</label>
              <input style={s.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </div>
          </div>
        </div>

        {error   && <div style={s.errorMsg}>{error}</div>}
        {success && <div style={s.successMsg}>{success}</div>}

        <button onClick={handleSave} disabled={loading} style={{ ...s.saveBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: "100vh", backgroundColor: "#0F172A" },
  container: { maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem" },
  hero: {
    display: "flex", alignItems: "center", gap: "1.4rem", marginBottom: "1.75rem",
    padding: "1.5rem", backgroundColor: "#1E293B", borderRadius: "14px", border: "1px solid #334155",
  },
  avatarCircle: {
    width: "68px", height: "68px", borderRadius: "50%",
    background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.6rem", fontWeight: "800", color: "#fff", flexShrink: 0,
  },
  heroName:  { fontSize: "1.25rem", fontWeight: "700", color: "#F1F5F9", margin: "0 0 0.2rem", letterSpacing: "-0.01em" },
  heroEmail: { fontSize: "0.85rem", color: "#64748B", margin: "0 0 0.45rem" },
  roleBadge: {
    backgroundColor: "rgba(59,130,246,0.1)", color: "#93C5FD",
    border: "1px solid rgba(59,130,246,0.25)", borderRadius: "999px",
    padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: "700",
    textTransform: "capitalize", letterSpacing: "0.04em",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.1rem" },
  card: { backgroundColor: "#1E293B", borderRadius: "12px", padding: "1.4rem", border: "1px solid #334155" },
  cardHeader: { display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "1.1rem" },
  cardTitle: { fontSize: "0.875rem", fontWeight: "700", color: "#CBD5E1", margin: 0 },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.85rem" },
  label: { fontSize: "0.72rem", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    width: "100%", padding: "0.7rem 0.85rem", border: "1.5px solid #334155",
    borderRadius: "8px", fontSize: "0.875rem", backgroundColor: "#263348",
    color: "#F1F5F9", outline: "none", boxSizing: "border-box",
  },
  errorMsg: {
    backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#FCA5A5", padding: "0.65rem 0.9rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.82rem",
  },
  successMsg: {
    backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
    color: "#6EE7B7", padding: "0.65rem 0.9rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.82rem",
  },
  saveBtn: {
    padding: "0.8rem 1.75rem", background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
    color: "#fff", border: "none", borderRadius: "9px", fontSize: "0.9rem",
    fontWeight: "600", cursor: "pointer",
  },
}