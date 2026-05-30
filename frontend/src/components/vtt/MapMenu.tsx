import { ChevronDown, Map, Trash2, Upload } from 'lucide-react'

function MapMenu({
  deleteMap,
  maps,
  selectedMap,
  setSelectedMap,
  uploadMap,
}) {
  const handleMapChange = (event) => {
    setSelectedMap(event.target.value || null)
  }

  const handleDeleteSelected = () => {
    if (selectedMap) {
      deleteMap(selectedMap)
    }
  }

  return (
    <div className="map-menu">
      <div className="map-select-shell">
        <Map className="map-select-icon" size={17} />
        <select className="map-select" value={selectedMap || ''} onChange={handleMapChange} aria-label="Select map">
          <option value="">Procedural Grid</option>
          {maps.map((map) => (
            <option key={map.filename} value={map.filename}>
              {map.filename}
            </option>
          ))}
        </select>
        <ChevronDown className="map-select-chevron" size={16} />
      </div>

      <label className="map-action-button" title="Upload map">
        <Upload size={16} />
        <input type="file" accept="image/*" onChange={uploadMap} />
      </label>

      <button
        className="map-action-button danger"
        type="button"
        title="Delete selected map"
        disabled={!selectedMap}
        onClick={handleDeleteSelected}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export default MapMenu
