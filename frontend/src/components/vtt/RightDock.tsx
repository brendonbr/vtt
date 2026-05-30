import CharacterSheet from '../CharacterSheet'
import ChatSection from '../ChatSection'
import MediaPanel from '../MediaPanel'
import PartyPanel from '../PartyPanel'
function RightDock({
  activeCampaign,
  currentUser,
  loadUsers,
  mediaItems,
  messages,
  onAuthRequired,
  onDisplayMedia,
  onLogin,
  onLogout,
  onRemoveMedia,
  onUploadMedia,
  panelOptions,
  rightPanel,
  setMessages,
  setRightPanel,
  setTokenTemplates,
  setUsers,
  tokenTemplates,
  users,
}) {
  return (
    <aside className="right-dock">
      <div className="dock-tabs">
        {panelOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={rightPanel === id ? 'active' : ''}
            type="button"
            title={label}
            onClick={() => setRightPanel(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="dock-panel">
        <RightPanel
          currentUser={currentUser}
          activeCampaign={activeCampaign}
          loadUsers={loadUsers}
          mediaItems={mediaItems}
          messages={messages}
          onAuthRequired={onAuthRequired}
          onDisplayMedia={onDisplayMedia}
          onLogin={onLogin}
          onLogout={onLogout}
          onRemoveMedia={onRemoveMedia}
          onUploadMedia={onUploadMedia}
          rightPanel={rightPanel}
          setMessages={setMessages}
          setTokenTemplates={setTokenTemplates}
          setUsers={setUsers}
          tokenTemplates={tokenTemplates}
          users={users}
        />
      </div>
    </aside>
  )
}

function RightPanel({
  activeCampaign,
  currentUser,
  loadUsers,
  mediaItems,
  messages,
  onAuthRequired,
  onDisplayMedia,
  onLogin,
  onLogout,
  onRemoveMedia,
  onUploadMedia,
  rightPanel,
  setMessages,
  setTokenTemplates,
  setUsers,
  tokenTemplates,
  users,
}) {
  if (rightPanel === 'chat') {
    return <ChatSection messages={messages} setMessages={setMessages} />
  }
  if (rightPanel === 'characters') {
    return (
      <CharacterSheet
        activeCampaign={activeCampaign}
        onAuthRequired={onAuthRequired}
        setMessages={setMessages}
      />
    )
  }
  if (rightPanel === 'media') {
    return (
      <MediaPanel
        activeCampaign={activeCampaign}
        currentUser={currentUser}
        mediaItems={mediaItems}
        onDisplayMedia={onDisplayMedia}
        onRemoveMedia={onRemoveMedia}
        onUploadMedia={onUploadMedia}
        setMessages={setMessages}
      />
    )
  }
  return <PartyPanel activeCampaign={activeCampaign} currentUser={currentUser} loadUsers={loadUsers} setMessages={setMessages} users={users} />
}

export default RightDock
