import { useState } from 'react'
import { API_BASE } from './vtt/vttConfig'

function Navbar({ currentUser, onLogin, onLogout, messages, setMessages }) {
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginNickname, setLoginNickname] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [regNickname, setRegNickname] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleLogin = async () => {
    if (!loginNickname || !loginPassword) {
      setMessages(prev => [...prev, 'Please enter nickname and password'])
      return
    }
    await onLogin(loginNickname, loginPassword)
    setLoginNickname('')
    setLoginPassword('')
    setShowLoginForm(false)
  }

  const handleRegister = async () => {
    if (!regNickname || !regPassword) {
      setMessages(prev => [...prev, 'Please enter nickname and password'])
      return
    }
    if (regPassword.length < 4) {
      setMessages(prev => [...prev, 'Password must be at least 4 characters'])
      return
    }
    try {
      const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: regNickname, password: regPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, `User created: ${data.nickname}. Please login.`])
        setRegNickname('')
        setRegPassword('')
        setShowRegisterForm(false)
        setShowLoginForm(false)
      } else {
        setMessages(prev => [...prev, `Register error: ${data.detail || data.error}`])
      }
    } catch (error) {
      setMessages(prev => [...prev, `Register error: ${error.message}`])
    }
  }

  return (
    <nav style={{
      backgroundColor: 'var(--primary-color)',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--accent-color)' }}>
        RPG Virtual Tabletop
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {currentUser ? (
          <>
            <span style={{ color: 'var(--text-color)', fontWeight: 'bold' }}>
              {currentUser.nickname}
            </span>
            <button
              onClick={onLogout}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm) && setShowLoginForm(showLoginForm)}
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '5px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
              }}
            >
              Register
            </button>
            <button
              onClick={() => setShowLoginForm(!showLoginForm) && setShowRegisterForm(showRegisterForm)}
              style={{
                backgroundColor: 'var(--secondary-color)',
                color: 'var(--text-color)',
                border: '2px solid var(--accent-color)',
                borderRadius: '5px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
              }}
            >
              Login
            </button>
          </>
        )}
      </div>

      {showLoginForm && !currentUser && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          backgroundColor: 'var(--secondary-color)',
          border: '2px solid var(--accent-color)',
          borderRadius: '8px',
          padding: '15px',
          minWidth: '250px',
          zIndex: 100,
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)' }}>Login</h3>
          <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-color)' }}>
            Nickname:
            <input
              type="text"
              value={loginNickname}
              onChange={e => setLoginNickname(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#1a1a1a',
                color: '#f0f0f0',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '15px', color: 'var(--text-color)' }}>
            Password:
            <input
              type="password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#1a1a1a',
                color: '#f0f0f0',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              backgroundColor: 'var(--accent-color)',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '4px',
              padding: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Login
          </button>
        </div>
      )}

      {showRegisterForm && !currentUser && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          backgroundColor: 'var(--secondary-color)',
          border: '2px solid var(--accent-color)',
          borderRadius: '8px',
          padding: '15px',
          minWidth: '250px',
          zIndex: 100,
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent-color)' }}>Register</h3>
          <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-color)' }}>
            Nickname:
            <input
              type="text"
              value={regNickname}
              onChange={e => setRegNickname(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleRegister()}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#1a1a1a',
                color: '#f0f0f0',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '15px', color: 'var(--text-color)' }}>
            Password:
            <input
              type="password"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleRegister()}
              style={{
                width: '100%',
                marginTop: '5px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#1a1a1a',
                color: '#f0f0f0',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <button
            onClick={handleRegister}
            style={{
              width: '100%',
              backgroundColor: 'var(--accent-color)',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '4px',
              padding: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Register
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
