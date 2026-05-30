import { Castle, Users } from 'lucide-react'

function AuthPage({
  authMode,
  authMessage,
  nickname,
  onSubmit,
  password,
  setAuthMode,
  setNickname,
  setPassword,
}) {
  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Virtual tabletop access">
        <div className="brand-mark auth-brand-mark">
          <Castle size={28} />
        </div>
        <p className="eyebrow">Virtual Tabletop</p>
        <h1>Mythforge Table</h1>
        <p>Login or create a player account before entering the campaign table.</p>
      </section>

      <section className="auth-card" aria-label="Player account">
        <div className="panel-title">
          <Users size={19} />
          <span>{authMode === 'login' ? 'Player Login' : 'Create Player'}</span>
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
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} autoComplete="username" />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {authMessage && <p className="auth-message">{authMessage}</p>}

        <button className="primary-action" type="button" onClick={onSubmit}>
          {authMode === 'login' ? 'Enter Campaigns' : 'Create Account'}
        </button>
      </section>
    </main>
  )
}

export default AuthPage
