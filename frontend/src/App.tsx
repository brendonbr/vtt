import { useEffect, useMemo, useState } from 'react'
import './App.css'
import AuthPage from './components/vtt/AuthPage'
import CampaignsPage from './components/vtt/CampaignsPage'
import LeftRail from './components/vtt/LeftRail'
import RightDock from './components/vtt/RightDock'
import SceneStage from './components/vtt/SceneStage'
import TopBar from './components/vtt/TopBar'
import {
  API_BASE,
  defaultScenes,
  drawToolOptions,
  panelOptions,
  toolOptions,
} from './components/vtt/vttConfig'
function App() {
  const [messages, setMessages] = useState([
    'Session opened: Ashen Keep',
    'GM: Drag tools from the left rail and keep the table moving.',
  ])
  const [maps, setMaps] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [campaignMessage, setCampaignMessage] = useState('')
  const [selectedMap, setSelectedMap] = useState(null)
  const [mediaItems, setMediaItems] = useState([])
  const [displayedMedia, setDisplayedMedia] = useState(null)
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [tool, setTool] = useState('select')
  const [tokenTemplates, setTokenTemplates] = useState([])
  const [shapes, setShapes] = useState([])
  const [rightPanel, setRightPanel] = useState('chat')
  const [authReady, setAuthReady] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [leftFlyout, setLeftFlyout] = useState(null)

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (activeCampaign?.id) {
      setSelectedMap(null)
      loadMaps(activeCampaign.id)
      loadMedia(activeCampaign.id)
    } else {
      setMaps([])
      setMediaItems([])
      setSelectedMap(null)
    }
  }, [activeCampaign?.id])

  const activeTool = useMemo(
    () => toolOptions.find((option) => option.id === tool) || toolOptions[0],
    [tool],
  )
  const activeDrawTool = drawToolOptions.some((option) => option.id === tool)

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        credentials: 'include',
      })
      if (!response.ok) {
        setCurrentUser(null)
        setUsers([])
        return
      }
      const data = await response.json()
      setCurrentUser(data)
      loadUsers()
      loadCampaigns()
    } catch (error) {
      setCurrentUser(null)
      setUsers([])
      console.error('Error loading current user:', error)
    } finally {
      setAuthReady(true)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/`, {
        credentials: 'include',
      })
      if (response.ok) {
        setUsers(await response.json())
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadMaps = async (campaignId = activeCampaign?.id) => {
    if (!campaignId) {
      setMaps([])
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/maps/`, {
        credentials: 'include',
      })
      if (response.ok) {
        setMaps(await response.json())
      }
    } catch (error) {
      console.error('Error loading maps:', error)
    }
  }

  const loadMedia = async (campaignId = activeCampaign?.id) => {
    if (!campaignId) {
      setMediaItems([])
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/media/`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data.map((item) => ({ ...item, url: `${API_BASE}${item.url}` })))
      }
    } catch (error) {
      setMessages((prev) => [...prev, `Media load error: ${error.message}`])
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/`, {
        credentials: 'include',
      })
      if (response.ok) {
        setCampaigns(await response.json())
      }
    } catch (error) {
      setCampaignMessage(`Campaign load error: ${error.message}`)
    }
  }

  const loginUser = async () => {
    const endpoint = authMode === 'login' ? 'login' : 'register'
    if (!nickname || !password) {
      setAuthMessage('Enter a nickname and password.')
      return
    }
    if (authMode === 'register' && password.length < 4) {
      setAuthMessage('Password must be at least 4 characters.')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: authMode === 'login' ? 'include' : 'omit',
        body: JSON.stringify({ nickname, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setAuthMessage(`${authMode === 'login' ? 'Login' : 'Register'} error: ${data.detail || data.error}`)
        return
      }

      if (authMode === 'register') {
        setAuthMode('login')
        setAuthMessage(`Player created: ${data.nickname}. Login to join the table.`)
      } else {
        setCurrentUser(data)
        setMessages((prev) => [...prev, `${data.nickname} joined the table.`])
        loadUsers()
        loadCampaigns()
        setAuthMessage('')
      }
      setNickname('')
      setPassword('')
    } catch (error) {
      setAuthMessage(`Auth error: ${error.message}`)
    }
  }

  const logoutUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      setCurrentUser(null)
      setActiveCampaign(null)
      setCampaigns([])
      setUsers([])
      setAuthMode('login')
      setNickname('')
      setPassword('')
      setAuthMessage('')
      setMessages((prev) => [...prev, data.message || 'Logged out.'])
    } catch (error) {
      setMessages((prev) => [...prev, `Logout error: ${error.message}`])
    }
  }

  const handleAuthRequired = (message = 'Your session expired. Login again to continue.') => {
    setCurrentUser(null)
    setActiveCampaign(null)
    setCampaigns([])
    setMaps([])
    setSelectedMap(null)
    setUsers([])
    setAuthMode('login')
    setAuthMessage(message)
  }

  const uploadMap = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!activeCampaign?.id) {
      setMessages((prev) => [...prev, 'Start a campaign before uploading maps.'])
      event.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}/maps/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        setMessages((prev) => [...prev, `Map uploaded: ${data.filename}`])
        setSelectedMap(data.filename)
        loadMaps(activeCampaign.id)
      } else {
        setMessages((prev) => [...prev, `Map upload error: ${data.detail}`])
      }
    } catch (error) {
      setMessages((prev) => [...prev, `Map upload error: ${error.message}`])
    } finally {
      event.target.value = ''
    }
  }

  const deleteMap = async (filename) => {
    if (!activeCampaign?.id) {
      setMessages((prev) => [...prev, 'Start a campaign before deleting maps.'])
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}/maps/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setMessages((prev) => [...prev, `Map deleted: ${filename}`])
        if (selectedMap === filename) setSelectedMap(null)
        loadMaps(activeCampaign.id)
      } else {
        setMessages((prev) => [...prev, `Map delete error: ${data.detail}`])
      }
    } catch (error) {
      setMessages((prev) => [...prev, `Map delete error: ${error.message}`])
    }
  }

  const createCampaign = async (campaignData) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campaignData),
      })
      const data = await response.json()
      if (response.ok) {
        setCampaignMessage(`Campaign created: ${data.name}`)
        loadCampaigns()
      } else {
        setCampaignMessage(`Create error: ${data.detail || data.error}`)
      }
    } catch (error) {
      setCampaignMessage(`Create error: ${error.message}`)
    }
  }

  const updateCampaign = async (campaignId, campaignData) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campaignData),
      })
      const data = await response.json()
      if (response.ok) {
        setCampaignMessage(`Campaign updated: ${data.name}`)
        loadCampaigns()
      } else {
        setCampaignMessage(`Update error: ${data.detail || data.error}`)
      }
    } catch (error) {
      setCampaignMessage(`Update error: ${error.message}`)
    }
  }

  const uploadCampaignThumbnail = async (campaignId, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/thumbnail`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        setCampaignMessage(`Thumbnail updated: ${data.name}`)
        loadCampaigns()
      } else {
        setCampaignMessage(`Thumbnail error: ${data.detail || data.error}`)
      }
    } catch (error) {
      setCampaignMessage(`Thumbnail error: ${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  const deleteCampaign = async (campaignId) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setCampaignMessage(data.message)
        if (activeCampaign?.id === campaignId) setActiveCampaign(null)
        loadCampaigns()
      } else {
        setCampaignMessage(`Delete error: ${data.detail || data.error}`)
      }
    } catch (error) {
      setCampaignMessage(`Delete error: ${error.message}`)
    }
  }

  const joinCampaign = async (campaignId) => {
    if (!campaignId) {
      setCampaignMessage('Enter a campaign ID.')
      return
    }
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setCampaignMessage(`Joined campaign #${data.campaign_id}`)
        loadCampaigns()
      } else {
        setCampaignMessage(`Join error: ${data.detail || data.error}`)
      }
    } catch (error) {
      setCampaignMessage(`Join error: ${error.message}`)
    }
  }

  const leaveCampaign = () => {
    const campaignName = activeCampaign?.name
    setActiveCampaign(null)
    setLeftFlyout(null)
    setRightPanel('chat')
    setTool('select')
    setCampaignMessage(campaignName ? `Left campaign: ${campaignName}` : '')
    loadCampaigns()
  }

  const uploadMediaItems = async (files) => {
    if (!activeCampaign?.id) return
    let uploadedCount = 0
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}/media/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        const data = await response.json()
        if (response.ok) {
          uploadedCount += 1
        } else {
          setMessages((prev) => [...prev, `Media upload error: ${data.detail || data.error}`])
        }
      } catch (error) {
        setMessages((prev) => [...prev, `Media upload error: ${error.message}`])
      }
    }
    if (uploadedCount > 0) {
      setMessages((prev) => [...prev, `${uploadedCount} media file(s) uploaded.`])
      loadMedia(activeCampaign.id)
    }
  }

  const removeMediaItem = async (mediaId) => {
    if (!activeCampaign?.id) return
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${activeCampaign.id}/media/${encodeURIComponent(mediaId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) {
        setMessages((prev) => [...prev, `Media delete error: ${data.detail || data.error}`])
        return
      }
      setMediaItems((prev) => prev.filter((item) => item.id !== mediaId))
      setDisplayedMedia((current) => (current?.id === mediaId ? null : current))
      setMessages((prev) => [...prev, data.message || 'Media deleted.'])
    } catch (error) {
      setMessages((prev) => [...prev, `Media delete error: ${error.message}`])
    }
  }

  const renderDisplayedMedia = () => {
    if (!displayedMedia) return null

    return (
      <div className="media-display-backdrop" role="presentation">
        <section className="media-display-modal" aria-label="Displayed table media">
          <div className="media-display-header">
            <strong>{displayedMedia.name}</strong>
            <button type="button" title="Close media" onClick={() => setDisplayedMedia(null)}>Close</button>
          </div>
          <div className="media-display-body">
            {displayedMedia.kind === 'image' && <img src={displayedMedia.url} alt={displayedMedia.name} />}
            {displayedMedia.kind === 'video' && <video src={displayedMedia.url} controls autoPlay />}
            {displayedMedia.kind === 'audio' && <audio src={displayedMedia.url} controls autoPlay />}
            {displayedMedia.kind === 'pdf' && <iframe src={displayedMedia.url} title={displayedMedia.name} />}
            {displayedMedia.kind === 'file' && <a href={displayedMedia.url} target="_blank" rel="noreferrer">{displayedMedia.name}</a>}
          </div>
        </section>
      </div>
    )
  }

  if (!authReady) {
    return (
      <div className="vtt-shell auth-loading">
        <div className="auth-loading-card">Loading table access...</div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="vtt-shell">
        <AuthPage
          authMode={authMode}
          authMessage={authMessage}
          nickname={nickname}
          onSubmit={loginUser}
          password={password}
          setAuthMode={setAuthMode}
          setNickname={setNickname}
          setPassword={setPassword}
        />
      </div>
    )
  }

  if (!activeCampaign) {
    return (
      <div className="vtt-shell">
        <CampaignsPage
          campaigns={campaigns}
          currentUser={currentUser}
          message={campaignMessage}
          onCreate={createCampaign}
          onDelete={deleteCampaign}
          onJoin={joinCampaign}
          onLogout={logoutUser}
          onStart={(campaign) => {
            setActiveCampaign(campaign)
            setMessages((prev) => [...prev, `Started campaign: ${campaign.name}`])
          }}
          onThumbnailUpload={uploadCampaignThumbnail}
          onUpdate={updateCampaign}
        />
      </div>
    )
  }

  return (
    <div className="vtt-shell">
      <TopBar
        activeCampaign={activeCampaign}
        currentUser={currentUser}
        deleteMap={deleteMap}
        maps={maps}
        onLeaveCampaign={leaveCampaign}
        onLogout={logoutUser}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        uploadMap={uploadMap}
      />

      <main className="tabletop-layout">
        <LeftRail
          activeDrawTool={activeDrawTool}
          drawToolOptions={drawToolOptions}
          leftFlyout={leftFlyout}
          messages={messages}
          setLeftFlyout={setLeftFlyout}
          setMessages={setMessages}
          setShapes={setShapes}
          setTool={setTool}
          tool={tool}
        />

        <SceneStage
          campaignId={activeCampaign.id}
          activeTool={activeTool}
          defaultScenes={defaultScenes}
          selectedMap={selectedMap}
          setShapes={setShapes}
          setTokenTemplates={setTokenTemplates}
          shapes={shapes}
          tokenTemplates={tokenTemplates}
          tool={tool}
        />

        <RightDock
          activeCampaign={activeCampaign}
          currentUser={currentUser}
          loadUsers={loadUsers}
          mediaItems={mediaItems}
          messages={messages}
          onAuthRequired={handleAuthRequired}
          onDisplayMedia={setDisplayedMedia}
          onLogin={loginUser}
          onLogout={logoutUser}
          onRemoveMedia={removeMediaItem}
          onUploadMedia={uploadMediaItems}
          panelOptions={panelOptions}
          rightPanel={rightPanel}
          setMessages={setMessages}
          setRightPanel={setRightPanel}
          setTokenTemplates={setTokenTemplates}
          setUsers={setUsers}
          tokenTemplates={tokenTemplates}
          users={users}
        />
      </main>

      {renderDisplayedMedia()}

    </div>
  )
}

export default App
