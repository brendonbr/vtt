import {
  ArrowLeft,
  Castle,
  Crown,
  Eye,
  LogOut,
  Search,
} from 'lucide-react'

import MapMenu from './MapMenu'
function TopBar({
  activeCampaign,
  currentUser,
  deleteMap,
  maps,
  onLeaveCampaign,
  onLogout,
  selectedMap,
  setSelectedMap,
  uploadMap,
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">
          <Castle size={22} />
        </div>
        <div>
          <p className="eyebrow">Virtual Tabletop</p>
          <h1>Mythforge Table</h1>
        </div>
      </div>

      <MapMenu
        deleteMap={deleteMap}
        maps={maps}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        uploadMap={uploadMap}
      />

      <div className="top-actions">

        {activeCampaign ? (
          <button className="icon-text-button campaign-exit-button" type="button" onClick={onLeaveCampaign}>
            <ArrowLeft size={16} />
            <span>Sign out campaign</span>
          </button>
        ) : null}
        {currentUser ? (
          <button className="session-pill" type="button" onClick={onLogout}>
            <Crown size={16} />
            <span>{currentUser.nickname}</span>
            <LogOut size={16} />
          </button>
        ) : null}
      </div>
    </header>
  )
}

export default TopBar
