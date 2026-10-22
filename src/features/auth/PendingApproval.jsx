import { useAuth } from '../../contexts/AuthContext.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'

export default function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="auth-container">
      <ThemeToggle className="theme-fab" />
      <div className="aurora"><i /><i /><i /><div className="gridfx" /></div>
      <div className="auth-card">
        <div className="brand"><span className="logo" /><div><b>RiskIQ</b><small>quant risk platform</small></div></div>

        <div className="card-b info" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2>Awaiting Approval</h2>
          <p style={{ marginBottom: '24px' }}>
            Your account has been created but is currently pending approval from your organization's administrator.
          </p>

          <div style={{ textAlign: 'left', marginBottom: '24px', padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <strong>What happens next:</strong>
            <ul style={{ margin: '12px 0 0 20px', lineHeight: '1.6' }}>
              <li>An administrator will review your account</li>
              <li>They will assign you a role (analyst, viewer, risk_manager, etc.)</li>
              <li>Once assigned, you'll have full access to the platform</li>
              <li>You can refresh this page to check your status</li>
            </ul>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--mut)', marginBottom: '24px' }}>
            <strong>Your email:</strong> {user?.email || 'Not provided'}<br/>
            <strong>Organization:</strong> {user?.org || 'Pending'}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn" onClick={() => window.location.reload()}>
              Check Status
            </button>
            <button className="btn ghost" onClick={logout}>
              Sign Out
            </button>
          </div>

          <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--mut)' }}>
            If you believe this is an error, please contact your organization's administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
