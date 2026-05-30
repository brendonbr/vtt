import { Users, X } from 'lucide-react'

function AuthModal({
  authMode,
  nickname,
  onSubmit,
  password,
  setAuthMode,
  setNickname,
  setPassword,
  setShowLogin,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" aria-label="Join table">
        <button className="modal-close" type="button" onClick={() => setShowLogin(false)}>
          <X size={18} />
        </button>
        <div className="panel-title">
          <Users size={19} />
          <span>{authMode === 'login' ? 'Join Table' : 'Create Player'}</span>
        </div>
        <div className="auth-tabs">
          <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => setAuthMode('login')}>
            Login
          </button>
          <button className={authMode === 'register' ? 'active' : ''} type="button" onClick={() => setAuthMode('register')}>
            Register
          </button>
        </div>
        <label>
          <span>Nickname</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
          />
        </label>
        <button className="primary-action" type="button" onClick={onSubmit}>
          {authMode === 'login' ? 'Enter Session' : 'Create Player'}
        </button>
      </section>
    </div>
  )
}

export default AuthModal
