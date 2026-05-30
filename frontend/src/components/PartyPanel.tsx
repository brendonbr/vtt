import { Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from './vtt/vttConfig'
function PartyPanel({ activeCampaign, currentUser, loadUsers, setMessages, users }) {
  const [campaignDetail, setCampaignDetail] = useState(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [partyMessage, setPartyMessage] = useState('')

  const isDm = Boolean(currentUser?.id && activeCampaign?.owner_id === currentUser.id)
  const participants = campaignDetail?.participants || []
  const activePlayers = participants.filter((participant) => (
    participant.role !== 'dm' && participant.status === 'active'
  ))
  const dmUser = users.find((user) => user.id === activeCampaign?.owner_id)
    || users.find((user) => user.id === currentUser?.id)
    || currentUser

  const availablePlayers = useMemo(() => {
    const activePlayerIds = new Set(activePlayers.map((participant) => participant.user_id))
    return users.filter((user) => user.id !== activeCampaign?.owner_id && !activePlayerIds.has(user.id))
  }, [activeCampaign?.owner_id, activePlayers, users])

  useEffect(() => {
    if (currentUser) loadUsers()
  }, [currentUser, loadUsers])

  useEffect(() => {
    loadCampaignDetail()
  }, [activeCampaign?.id])

  useEffect(() => {
    if (!availablePlayers.some((user) => String(user.id) === selectedPlayerId)) {
      setSelectedPlayerId(availablePlayers[0] ? String(availablePlayers[0].id) : '')
    }
  }, [availablePlayers, selectedPlayerId])

  const loadCampaignDetail = async () => {
    if (!activeCampaign?.id) return
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        setPartyMessage(`Party load error: ${data.detail || data.error}`)
        return
      }
      setCampaignDetail(data)
    } catch (error) {
      setPartyMessage(`Party load error: ${error.message}`)
    }
  }

  const updatePlayer = async (userId, status = 'active') => {
    if (!activeCampaign?.id || !isDm) return
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: Number(userId), role: 'player', status }),
      })
      const data = await response.json()
      if (!response.ok) {
        setPartyMessage(`Party update error: ${data.detail || data.error}`)
        return
      }
      setPartyMessage(status === 'active' ? 'Player added.' : 'Player removed.')
      setMessages((prev) => [...prev, status === 'active' ? 'Player added to party.' : 'Player removed from party.'])
      loadCampaignDetail()
    } catch (error) {
      setPartyMessage(`Party update error: ${error.message}`)
    }
  }

  const deleteDmProfile = async () => {
    if (!currentUser?.id || currentUser.id !== activeCampaign?.owner_id) return
    if (!window.confirm('Delete your DM profile? This removes your user account.')) return

    try {
      const response = await fetch(`${API_BASE}/api/users/${currentUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        setPartyMessage(`Delete error: ${data.detail || data.error}`)
        return
      }
      setPartyMessage(data.message || 'DM profile deleted.')
      setMessages((prev) => [...prev, data.message || 'DM profile deleted.'])
    } catch (error) {
      setPartyMessage(`Delete error: ${error.message}`)
    }
  }

  const userName = (userId) => users.find((user) => user.id === userId)?.nickname || `User #${userId}`

  return (
    <section className="party-panel">
      <article className="party-profile dm">
        <div>
          <span>DM</span>
          <strong>{dmUser?.nickname || 'Unknown DM'}</strong>
        </div>
        {isDm && (
          <button type="button" title="Delete DM profile" onClick={deleteDmProfile}>
            <X size={15} />
          </button>
        )}
      </article>

      <div className="party-add-row">
        <select
          value={selectedPlayerId}
          disabled={!isDm || availablePlayers.length === 0}
          onChange={(event) => setSelectedPlayerId(event.target.value)}
        >
          {availablePlayers.length === 0 ? (
            <option value="">No players available</option>
          ) : availablePlayers.map((user) => (
            <option key={user.id} value={user.id}>{user.nickname}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!isDm || !selectedPlayerId}
          title="Add player"
          onClick={() => updatePlayer(selectedPlayerId, 'active')}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="party-list">
        {activePlayers.length === 0 ? (
          <p className="party-empty">No players in this party.</p>
        ) : activePlayers.map((participant) => (
          <article className="party-profile" key={participant.id}>
            <div>
              <span>Player</span>
              <strong>{userName(participant.user_id)}</strong>
            </div>
            {isDm && (
              <button type="button" title="Remove player" onClick={() => updatePlayer(participant.user_id, 'inactive')}>
                <X size={15} />
              </button>
            )}
          </article>
        ))}
      </div>

      {partyMessage && <p className="party-message">{partyMessage}</p>}
    </section>
  )
}

export default PartyPanel
