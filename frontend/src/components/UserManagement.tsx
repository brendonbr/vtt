import { useState, useEffect } from 'react'
import { API_BASE } from './vtt/vttConfig'

function UserManagement({ currentUser, users, setUsers, messages, setMessages, onLogin, onLogout, loadUsers }) {
  const [userNickname, setUserNickname] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [editingUser, setEditingUser] = useState(false)

  useEffect(() => {
    if (currentUser) {
      loadUsers()
    }
  }, [currentUser, loadUsers])

  const selectUser = (user) => {
    if (!currentUser || currentUser.id !== user.id) {
      setMessages(prev => [...prev, 'You can only edit your own account.'])
      return
    }
    setSelectedUserId(user.id)
    setUserNickname(user.nickname)
    setUserPassword('')
    setEditingUser(true)
  }

  const resetUserForm = () => {
    setSelectedUserId(null)
    setUserNickname('')
    setUserPassword('')
    setEditingUser(false)
  }

  const saveUser = async () => {
    try {
      const payload = { nickname: userNickname, password: userPassword }
      const endpoint = editingUser ? `${API_BASE}/api/users/${selectedUserId}` : `${API_BASE}/api/users/register`
      const method = editingUser ? 'PUT' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: editingUser ? 'include' : 'omit',
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, editingUser ? `User updated: ${data.nickname}` : `User created: ${data.nickname}`])
        resetUserForm()
        loadUsers()
      } else {
        setMessages(prev => [...prev, `User error: ${data.detail || data.error}`])
      }
    } catch (error) {
      setMessages(prev => [...prev, `User error: ${error.message}`])
    }
  }

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, data.message])
        if (selectedUserId === userId) resetUserForm()
        loadUsers()
      } else {
        setMessages(prev => [...prev, `Delete error: ${data.detail}`])
      }
    } catch (error) {
      setMessages(prev => [...prev, `Delete error: ${error.message}`])
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#333] bg-secondary p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <h2 className="mb-4 text-2xl font-semibold text-primary">User Management</h2>
      {currentUser ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#444] bg-background p-6 space-y-5">
            <h3 className="text-xl font-semibold text-accent">Edit Your Profile</h3>
            <label className="block space-y-2 text-sm font-semibold text-text">
              <span>Nickname</span>
              <input
                type="text"
                value={userNickname}
                onChange={e => setUserNickname(e.target.value)}
                className="w-full rounded-2xl border border-[#444] bg-background px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text">
              <span>Password</span>
              <input
                type="password"
                value={userPassword}
                onChange={e => setUserPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#444] bg-background px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={saveUser} className="w-full rounded-2xl bg-primary px-5 py-3 text-background font-semibold transition hover:bg-accent md:w-auto">
                Update Profile
              </button>
              <button onClick={resetUserForm} className="w-full rounded-2xl border border-[#444] bg-background px-5 py-3 text-text font-semibold transition hover:border-accent hover:bg-[#222] md:w-auto">
                Reset
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">All Users</h3>
            {users.length === 0 ? (
              <p className="text-text/70">No users yet.</p>
            ) : (
              <ul className="space-y-3">
                {users.map(user => {
                  const canModify = currentUser && currentUser.id === user.id
                  return (
                    <li key={user.id} className="flex flex-wrap items-center gap-3 rounded-3xl border border-[#444] bg-background p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-text">{user.nickname}</p>
                        <p className="text-sm text-text/70">ID: {user.id}</p>
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => selectUser(user)}
                          disabled={!canModify}
                          className={canModify ? 'rounded-2xl bg-accent px-4 py-2 text-background font-semibold transition hover:bg-accent/90' : 'rounded-2xl bg-[#444] px-4 py-2 text-text/70 font-semibold cursor-not-allowed'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={!canModify}
                          className={canModify ? 'rounded-2xl bg-red-600 px-4 py-2 text-background font-semibold transition hover:bg-red-500' : 'rounded-2xl bg-[#444] px-4 py-2 text-text/70 font-semibold cursor-not-allowed'}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-3xl border border-[#444] bg-background p-8 text-center text-text/70">
          Please login to view user management.
        </p>
      )}
    </section>
  )
}

export default UserManagement
