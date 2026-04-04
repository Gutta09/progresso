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

    if (newPassword && newPassword !== confirmPassword)
      return setError("New passwords do not match.")
    if (newPassword && newPassword.length < 6)
      return setError("New password must be at least 6 characters.")

    const payload = {}
    if (username !== user.username) payload.username = username
    if (email !== user.email) payload.email = email
    if (newPassword) {
      payload.current_password = currentPassword
      payload.new_password = newPassword
    }

    if (Object.keys(payload).length === 0)
      return setError("No changes to save.")

    try {
      setLoading(true)
      const updated = await updateProfile(payload)
      const token = localStorage.getItem("token")
      login(token, updated)
      setSuccess("Profile updated successfully!")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* ── Profile hero ── */}
        <div style={styles.hero}>
          <div style={styles.avatarCircle}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={styles.heroName}>{user?.username}</h2>
            <p style={styles.heroEmail}>{user?.email}</p>
            <span style={styles.roleBadge}>{user?.role}</span>
          </div>
        </div>

        <div style={styles.grid}>
          {/* ── Account Info ── */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>👤</span>
              <h3 style={styles.cardTitle}>Account Info</h3>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* ── Change Password ── */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🔒</span>
              <h3 style={styles.cardTitle}>Change Password</h3>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input
                style={styles.input}
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Required to change password"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input
                style={styles.input}
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                style={styles.input}
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </div>

        {/* ── Feedback messages ── */}
        {error && (
          <div style={styles.errorMsg}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={styles.successMsg}>
            ✓ {success}
          </div>
        )}

        {/* ── Save button ── */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f0f1a",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "2rem",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    marginBottom: "2rem",
    padding: "1.75rem",
    backgroundColor: "#1a1a2e",
    borderRadius: "16px",
    border: "1px solid #2a2a45",
  },
  avatarCircle: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c6ef0, #5b4fcf)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "#fff",
    flexShrink: 0,
    boxShadow: "0 4px 20px rgba(124,110,240,0.4)",
  },
  heroName: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#f0f0ff",
    margin: "0 0 0.2rem",
  },
  heroEmail: {
    fontSize: "0.875rem",
    color: "#8b8bab",
    margin: "0 0 0.5rem",
  },
  roleBadge: {
    backgroundColor: "rgba(124,110,240,0.15)",
    color: "#a78bfa",
    border: "1px solid rgba(124,110,240,0.3)",
    borderRadius: "999px",
    padding: "0.15rem 0.65rem",
    fontSize: "0.72rem",
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: "0.04em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "1.25rem",
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: "14px",
    padding: "1.5rem",
    border: "1px solid #2a2a45",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1.25rem",
  },
  cardIcon: {
    fontSize: "1rem",
  },
  cardTitle: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "#f0f0ff",
    margin: 0,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    marginBottom: "1rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#8b8bab",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "0.75rem 0.9rem",
    border: "1.5px solid #2a2a45",
    borderRadius: "8px",
    fontSize: "0.9rem",
    backgroundColor: "#12122a",
    color: "#f0f0ff",
    outline: "none",
    boxSizing: "border-box",
  },
  errorMsg: {
    backgroundColor: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#f87171",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.875rem",
  },
  successMsg: {
    backgroundColor: "rgba(52,211,153,0.1)",
    border: "1px solid rgba(52,211,153,0.3)",
    color: "#34d399",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.875rem",
  },
  saveBtn: {
    padding: "0.85rem 2rem",
    background: "linear-gradient(135deg, #7c6ef0, #5b4fcf)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(124,110,240,0.3)",
  },
}