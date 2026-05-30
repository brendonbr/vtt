import { ImagePlus, LogOut, Play, Plus, Settings, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { API_BASE } from './vttConfig'
const GAME_SYSTEM_OPTIONS = ['Dnd5e 2014', 'Tormenta20']

function CampaignsPage({
  campaigns,
  currentUser,
  message,
  onCreate,
  onDelete,
  onJoin,
  onLogout,
  onStart,
  onThumbnailUpload,
  onUpdate,
}) {
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    game_system: GAME_SYSTEM_OPTIONS[0],
    setting: '',
  })
  const [joinId, setJoinId] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const submitCreate = () => {
    if (!createForm.name.trim()) return
    onCreate(createForm)
    setCreateForm({ name: '', description: '', game_system: GAME_SYSTEM_OPTIONS[0], setting: '' })
  }

  const startEditing = (campaign) => {
    setEditingId(campaign.id)
    setEditForm({
      name: campaign.name,
      description: campaign.description || '',
      game_system: campaign.game_system || GAME_SYSTEM_OPTIONS[0],
      status: campaign.status || 'draft',
      setting: campaign.setting || '',
      party_notes: campaign.party_notes || '',
      gm_notes: campaign.gm_notes || '',
    })
  }

  const submitEdit = () => {
    onUpdate(editingId, editForm)
    setEditingId(null)
    setEditForm({})
  }

  return (
    <main className="campaign-page">
      <header className="campaign-header">
        <div>
          <p className="eyebrow">Campaign Access</p>
          <h1>Choose an Adventure</h1>
          <p>Welcome, {currentUser.nickname}. Create a campaign as DM, or join one as a player.</p>
        </div>
        <button className="session-pill" type="button" onClick={onLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <section className="campaign-tools">
        <div className="campaign-form">
          <div className="panel-title">
            <Plus size={18} />
            <span>Create Campaign</span>
          </div>
          <input
            placeholder="Campaign name"
            value={createForm.name}
            onChange={(event) => setCreateForm((form) => ({ ...form, name: event.target.value }))}
          />
          <select
            value={createForm.game_system}
            onChange={(event) => setCreateForm((form) => ({ ...form, game_system: event.target.value }))}
          >
            {GAME_SYSTEM_OPTIONS.map((system) => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            value={createForm.description}
            onChange={(event) => setCreateForm((form) => ({ ...form, description: event.target.value }))}
          />
          <textarea
            placeholder="Setting notes"
            value={createForm.setting}
            onChange={(event) => setCreateForm((form) => ({ ...form, setting: event.target.value }))}
          />
          <button className="primary-action" type="button" onClick={submitCreate}>
            Create as DM
          </button>
        </div>

        <div className="campaign-form compact">
          <div className="panel-title">
            <Users size={18} />
            <span>Join Campaign</span>
          </div>
          <input
            placeholder="Campaign ID"
            value={joinId}
            onChange={(event) => setJoinId(event.target.value)}
          />
          <button
            className="primary-action"
            type="button"
            onClick={() => {
              onJoin(joinId)
              setJoinId('')
            }}
          >
            Join as Player
          </button>
          {message && <p className="campaign-message">{message}</p>}
        </div>
      </section>

      <section className="campaign-grid">
        {campaigns.length === 0 ? (
          <div className="empty-campaigns">No campaigns yet.</div>
        ) : (
          campaigns.map((campaign) => {
            const isDm = campaign.owner_id === currentUser.id
            const thumbnailSrc = campaign.thumbnail ? `${API_BASE}${campaign.thumbnail}` : null
            return (
              <article className="campaign-card" key={campaign.id}>
                {editingId === campaign.id ? (
                  <div className="campaign-edit">
                    <label className="campaign-thumbnail-upload">
                      <span>
                        <ImagePlus size={16} />
                        Thumbnail
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onThumbnailUpload(campaign.id, event)}
                      />
                    </label>
                    <input
                      value={editForm.name || ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, name: event.target.value }))}
                    />
                    <select
                      value={editForm.game_system || ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, game_system: event.target.value }))}
                    >
                      {GAME_SYSTEM_OPTIONS.map((system) => (
                        <option key={system} value={system}>{system}</option>
                      ))}
                    </select>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, description: event.target.value }))}
                    />
                    <textarea
                      value={editForm.setting || ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, setting: event.target.value }))}
                    />
                    <div className="campaign-card-actions">
                      <button type="button" onClick={submitEdit}>Save</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="campaign-thumbnail">
                      {thumbnailSrc ? (
                        <img src={thumbnailSrc} alt={`${campaign.name} thumbnail`} />
                      ) : (
                        <div>
                          <ImagePlus size={24} />
                          <span>No thumbnail</span>
                        </div>
                      )}
                    </div>
                    <div className="campaign-card-top">
                      <span>{isDm ? 'DM' : 'Player'}</span>
                      <span>#{campaign.id}</span>
                    </div>
                    <h2>{campaign.name}</h2>
                    <p>{campaign.description || 'No description yet.'}</p>
                    <dl>
                      <div>
                        <dt>System</dt>
                        <dd>{campaign.game_system}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{campaign.status}</dd>
                      </div>
                    </dl>
                    <div className="campaign-card-actions">
                      {isDm && (
                        <button type="button" title="Update campaign" onClick={() => startEditing(campaign)}>
                          <Settings size={16} />
                        </button>
                      )}
                      {isDm && (
                        <button className="danger" type="button" title="Delete campaign" onClick={() => onDelete(campaign.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button className="start-campaign" type="button" onClick={() => onStart(campaign)}>
                        <Play size={16} />
                        <span>Start Campaign</span>
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default CampaignsPage
