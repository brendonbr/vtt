import { Eye, EyeOff, Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import MapCanvas from '../MapCanvas'
import TokenSystem, { clampTokenPosition, snapToGrid, tokenPayloadToPlacedToken, tokenTemplateToPlacedToken } from './TokenSystem'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.15
const MIN_GRID_SIZE = 20
const MAX_GRID_SIZE = 160

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
const clampGridSize = (value) => Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, value))
const clampFitZoom = (value) => Math.min(MAX_ZOOM, Math.max(0.1, Number(value.toFixed(2))))

function SceneStage({
  activeTool,
  campaignId,
  defaultScenes,
  selectedMap,
  setShapes,
  setTokenTemplates,
  shapes,
  tokenTemplates,
  tool,
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [gridSize, setGridSize] = useState(50)
  const [gridColor, setGridColor] = useState('#ffffff')
  const [distanceUnit, setDistanceUnit] = useState('ft')
  const [showMapHud, setShowMapHud] = useState(true)
  const [placedTokens, setPlacedTokens] = useState([])
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  const [mapSettings, setMapSettings] = useState({
    gridEnabled: true,
    snapToGrid: true,
    mapWidth: 800,
    mapHeight: 600,
    backgroundImage: '',
  })

  const zoomIn = () => setZoom((current) => clampZoom(current + ZOOM_STEP))
  const zoomOut = () => setZoom((current) => clampZoom(current - ZOOM_STEP))
  const updateGridSize = (event) => {
    const nextSize = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(nextSize)) return
    setGridSize(clampGridSize(nextSize))
  }
  const resetViewport = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const maxTokenZIndex = useMemo(
    () => placedTokens.reduce((highest, token) => Math.max(highest, token.zIndex), 0),
    [placedTokens],
  )

  useEffect(() => {
    setPlacedTokens((prev) => prev.map((token) => ({
      ...token,
      ...clampTokenPosition(token, { ...mapSettings, gridSize }),
    })))
  }, [gridSize, mapSettings.mapHeight, mapSettings.mapWidth])

  const updateMapWorldSize = (world) => {
    setMapSettings((settings) => {
      const mapWidth = Math.max(1, Math.round(world.width))
      const mapHeight = Math.max(1, Math.round(world.height))
      if (settings.mapWidth === mapWidth && settings.mapHeight === mapHeight) return settings
      return { ...settings, mapWidth, mapHeight }
    })
  }

  const dropTokenOnMap = (event) => {
    const templateId = event.dataTransfer.getData('application/x-vtt-token-template')
    const characterTokenRaw = event.dataTransfer.getData('application/x-vtt-character-token')
    if (!templateId && !characterTokenRaw) return
    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const rawX = (event.clientX - rect.left - pan.x) / zoom
    const rawY = (event.clientY - rect.top - pan.y) / zoom
    const position = {
      x: snapToGrid(rawX, gridSize, mapSettings.gridEnabled && mapSettings.snapToGrid),
      y: snapToGrid(rawY, gridSize, mapSettings.gridEnabled && mapSettings.snapToGrid),
    }
    let placed = null
    if (characterTokenRaw) {
      try {
        placed = tokenPayloadToPlacedToken(JSON.parse(characterTokenRaw), position, gridSize, maxTokenZIndex + 1)
      } catch {
        return
      }
    } else {
      const template = tokenTemplates.find((token) => token.id === templateId)
      if (!template) return
      placed = tokenTemplateToPlacedToken(template, position, gridSize, maxTokenZIndex + 1)
    }
    const clamped = { ...placed, ...clampTokenPosition(placed, { ...mapSettings, gridSize }) }
    setPlacedTokens((prev) => [...prev, clamped])
    setSelectedTokenId(clamped.id)
  }

  return (
    <section className="map-stage">
 


      <div
        className="canvas-frame"
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropTokenOnMap}
      >
        <MapCanvas
          campaignId={campaignId}
          distanceUnit={distanceUnit}
          gridColor={gridColor}
          gridEnabled={mapSettings.gridEnabled}
          gridSize={gridSize}
          onWorldSizeChange={updateMapWorldSize}
          pan={pan}
          selectedMap={selectedMap}
          setPan={setPan}
          setZoom={(value) => setZoom(clampFitZoom(value))}
          shapes={shapes}
          setShapes={setShapes}
          tool={tool}
          zoom={zoom}
        />
        <TokenSystem
          gridSize={gridSize}
          mapSettings={{ ...mapSettings, gridSize }}
          pan={pan}
          placedTokens={placedTokens}
          selectedTokenId={selectedTokenId}
          setPlacedTokens={setPlacedTokens}
          setSelectedTokenId={setSelectedTokenId}
          setTokenTemplates={setTokenTemplates}
          tokenTemplates={tokenTemplates}
          zoom={zoom}
        />
        <button
          className="map-hud-toggle"
          type="button"
          title={showMapHud ? 'Hide map HUD' : 'Show map HUD'}
          onClick={() => setShowMapHud((visible) => !visible)}
        >
          {showMapHud ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {showMapHud && (
          <>
            <div className="map-hud map-hud-left">
              <div>
                <span>Tool</span>
                <strong>{activeTool.label}</strong>
              </div>
            </div>

            <div className="map-hud map-hud-right">
              <div>
                <span>Grid</span>
                <strong>{distanceUnit === 'ft' ? '5 ft' : '1.5 m'}</strong>
              </div>
              <label className="map-toggle-control">
                <input
                  type="checkbox"
                  checked={mapSettings.gridEnabled}
                  onChange={(event) => setMapSettings((settings) => ({ ...settings, gridEnabled: event.target.checked }))}
                />
                <span>Grid enabled</span>
              </label>
              <label className="map-toggle-control">
                <input
                  type="checkbox"
                  checked={mapSettings.snapToGrid}
                  onChange={(event) => setMapSettings((settings) => ({ ...settings, snapToGrid: event.target.checked }))}
                />
                <span>Snap tokens</span>
              </label>
              <label className="grid-size-control">
                <span>Grid Size</span>
                <input
                  type="number"
                  min={MIN_GRID_SIZE}
                  max={MAX_GRID_SIZE}
                  step="5"
                  value={gridSize}
                  onChange={updateGridSize}
                />
              </label>
              <label className="grid-color-control">
                <span>Grid Color</span>
                <input
                  type="color"
                  value={gridColor}
                  onChange={(event) => setGridColor(event.target.value)}
                />
              </label>
              <label className="unit-switcher">
                <span>Unit</span>
                <select value={distanceUnit} onChange={(event) => setDistanceUnit(event.target.value)}>
                  <option value="ft">ft</option>
                  <option value="m">m</option>
                </select>
              </label>
              <div>
                <span>Zoom</span>
                <strong>{Math.round(zoom * 100)}%</strong>
              </div>
              <div className="zoom-controls">
                <button type="button" title="Zoom out" onClick={zoomOut}>
                  <Minus size={15} />
                </button>
                <button type="button" title="Reset view" onClick={resetViewport}>
                  <RotateCcw size={15} />
                </button>
                <button type="button" title="Zoom in" onClick={zoomIn}>
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SceneStage
