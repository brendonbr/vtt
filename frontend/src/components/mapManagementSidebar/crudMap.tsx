import { useState, useEffect } from 'react'
import { Map, Upload, X } from 'lucide-react'
import { API_BASE } from '../vtt/vttConfig'
function CrudMap({ campaignId, maps = [], setMaps, selectedMap, setSelectedMap, messages, setMessages }) {
  const [mapMenu, setMapMenu] = useState(false)

  const mapsUrl = campaignId ? `${API_BASE}/api/campaigns/${campaignId}/maps` : null

  const loadMaps = async () => {
    if (!mapsUrl) {
      setMaps([])
      return
    }

    try {
      const response = await fetch(`${mapsUrl}/`, {
        credentials: 'include',
      })
      const data = await response.json()
      setMaps(data)
    } catch (error) {
      console.error('Error loading maps:', error)
    }
  }

  const handleSelectMap = (filename) => {
    setSelectedMap(filename)
    setMapMenu(false)
  }

  const uploadMap = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (!mapsUrl) {
      setMessages(prev => [...prev, 'Start a campaign before uploading maps.'])
      event.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${mapsUrl}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, `Map uploaded: ${data.filename}`])
        loadMaps()
      } else {
        setMessages(prev => [...prev, `Error uploading map: ${data.detail}`])
      }
    } catch (error) {
      setMessages(prev => [...prev, `Error uploading map: ${error.message}`])
    } finally {
      event.target.value = ''
    }
  }

  const deleteMap = async (filename) => {
    if (!mapsUrl) {
      setMessages(prev => [...prev, 'Start a campaign before deleting maps.'])
      return
    }

    try {
      const response = await fetch(`${mapsUrl}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, `Map deleted: ${filename}`])
        loadMaps()
        if (selectedMap === filename) {
          setSelectedMap(null)
        }
      } else {
        setMessages(prev => [...prev, `Error deleting map: ${data.detail}`])
      }
    } catch (error) {
      setMessages(prev => [...prev, `Error deleting map: ${error.message}`])
    }
  }

  useEffect(() => {
    loadMaps()
  }, [mapsUrl])

  return (
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => setMapMenu(!mapMenu)}
          className="rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:border-accent hover:bg-[#222] flex items-center"
        >
          <Map className="w-5 h-5 mr-2" />
         
        </button>

        {mapMenu && (
          <div className="absolute right-0 left-auto z-10 top-full mt-2 w-80 rounded-3xl border border-[#444] bg-secondary p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {maps.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#444] bg-background p-4 text-sm text-text/70">
                  No maps uploaded yet.
                </p>
              ) : (
                maps.map(map => (
                  <div key={map.filename} className="flex items-center gap-3 rounded-lg bg-background p-2">
                    <img
                      src={`${mapsUrl}/${encodeURIComponent(map.filename)}`}
                      alt={map.filename}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selectedMap === map.filename ? 'text-accent' : 'text-text'}`}>
                        {map.filename}
                      </p>
                      <button
                        onClick={() => handleSelectMap(map.filename)}
                        type="button"
                        className="mt-1 rounded-2xl bg-primary px-3 py-1 text-xs font-semibold text-background transition hover:bg-accent"
                      >
                        Select
                      </button>
                    </div>
                    <button
                      onClick={() => deleteMap(map.filename)}
                      className="rounded p-1 text-red-500 hover:bg-red-500/20"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}

              <div className="mt-2 rounded-2xl border border-[#444] bg-background p-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-background transition hover:bg-accent">
                  <span className="inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Add Map
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadMap}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    
  )
}

export default CrudMap
