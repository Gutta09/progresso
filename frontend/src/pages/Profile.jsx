import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api";
import Navbar from "../components/Navbar";

export default function Profile() {
    const { user, login } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError(""); setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }
    if (newPassword && newPassword.length < 6) {
      return setError("New password must be at least 6 characters.");
    }

    const payload = {};
    if (username !== user.username) payload.username = username;
    if (email !== user.email) payload.email = email;
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (Object.keys(payload).length === 0)
      return setError("No changes to save.");

    try {
      setLoading(true);
      const updated = await updateProfile(payload);
      // Update user in context — keep existing token
      const token = localStorage.getItem("token");
      login(token, updated);
      setSuccess("Profile updated successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7" }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ marginBottom: 24 }}>My Profile</h2>

        <div style={card}>
          <h3 style={sectionTitle}>Account Info</h3>

          <label style={label}>Username</label>
          <input style={input} value={username} onChange={e => setUsername(e.target.value)} />

          <label style={label}>Email</label>
          <input style={input} value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={sectionTitle}>Change Password</h3>

          <label style={label}>Current Password</label>
          <input style={input} type="password" value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)} placeholder="Required to change password" />

          <label style={label}>New Password</label>
          <input style={input} type="password" value={newPassword}
            onChange={e => setNewPassword(e.target.value)} />

          <label style={label}>Confirm New Password</label>
          <input style={input} type="password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} />
        </div>

        {error && <p style={{ color: "#e53935", marginTop: 12 }}>{error}</p>}
        {success && <p style={{ color: "#43a047", marginTop: 12 }}>{success}</p>}

        <button onClick={handleSave} disabled={loading}
          style={{ marginTop: 20, padding: "10px 28px", background: "#5e35b1",
            color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 15, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

const card = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" };
const sectionTitle = { margin: "0 0 16px", fontSize: 15, color: "#444" };
const label = { display: "block", fontSize: 13, color: "#666", marginBottom: 4, marginTop: 12 };
const input = { width: "100%", padding: "8px 10px", border: "1px solid #ddd",
  borderRadius: 6, fontSize: 14, boxSizing: "border-box" };