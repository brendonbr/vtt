import { Copy, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

/**
 * @typedef {'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'} TokenSize
 * @typedef {'Player' | 'NPC' | 'Monster' | 'Object'} TokenType
 * @typedef {'Blinded' | 'Charmed' | 'Deafened' | 'Frightened' | 'Grappled' | 'Incapacitated' | 'Invisible' | 'Paralyzed' | 'Petrified' | 'Poisoned' | 'Prone' | 'Restrained' | 'Stunned' | 'Unconscious'} TokenCondition
 *
 * @typedef {Object} TokenTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} imageUrl
 * @property {TokenSize} size
 * @property {TokenType} type
 * @property {number} armorClass
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} initiative
 * @property {number} speed
 * @property {string} notes
 *
 * @typedef {Object} PlacedToken
 * @property {string} id
 * @property {string} templateId
 * @property {string} name
 * @property {string} imageUrl
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {TokenSize} size
 * @property {TokenType} type
 * @property {number} armorClass
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} rotation
 * @property {TokenCondition[]} conditions
 * @property {string} notes
 * @property {number} zIndex
 *
 * @typedef {Object} MapSettings
 * @property {boolean} gridEnabled
 * @property {number} gridSize
 * @property {boolean} snapToGrid
 * @property {number} mapWidth
 * @property {number} mapHeight
 * @property {string} backgroundImage
 */

export const TOKEN_SIZES = {
  Tiny: 0.5,
  Small: 1,
  Medium: 1,
  Large: 2,
  Huge: 3,
  Gargantuan: 4,
}

export const TOKEN_TYPES = ['Player', 'NPC', 'Monster', 'Object']
export const TOKEN_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
]

const TYPE_COLORS = {
  Player: '#63c7b2',
  NPC: '#d8b45f',
  Monster: '#ef6f6c',
  Object: '#99a3b3',
}

const EMPTY_TOKEN = {
  name: '',
  imageUrl: '',
  size: 'Medium',
  type: 'Player',
  armorClass: 10,
  currentHp: 1,
  maxHp: 1,
  initiative: 0,
  speed: 30,
  notes: '',
}

export function isValidTokenImage(file) {
  return Boolean(file && ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type))
}

export function snapToGrid(value, gridSize, enabled) {
  if (!enabled || gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

export function tokenPixels(size, gridSize) {
  return Math.max(24, Math.round((TOKEN_SIZES[size] || 1) * gridSize))
}

export function clampTokenPosition(token, mapSettings) {
  return {
    x: Math.min(Math.max(0, token.x), Math.max(0, mapSettings.mapWidth - token.width)),
    y: Math.min(Math.max(0, token.y), Math.max(0, mapSettings.mapHeight - token.height)),
  }
}

export function tokenTemplateToPlacedToken(template, position, gridSize, zIndex) {
  const sizePx = tokenPixels(template.size, gridSize)
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    name: template.name,
    imageUrl: template.imageUrl,
    x: position.x,
    y: position.y,
    width: sizePx,
    height: sizePx,
    size: template.size,
    type: template.type,
    armorClass: template.armorClass,
    maxHp: template.maxHp,
    currentHp: template.currentHp,
    rotation: 0,
    conditions: [],
    notes: template.notes,
    zIndex,
  }
}

export function tokenPayloadToPlacedToken(tokenPayload, position, gridSize, zIndex) {
  return tokenTemplateToPlacedToken(
    {
      id: tokenPayload.templateId || tokenPayload.id || crypto.randomUUID(),
      name: tokenPayload.name,
      imageUrl: tokenPayload.imageUrl,
      size: tokenPayload.size || 'Medium',
      type: tokenPayload.type || 'Player',
      armorClass: tokenPayload.armorClass || 10,
      maxHp: tokenPayload.maxHp || 1,
      currentHp: tokenPayload.currentHp || 1,
      initiative: tokenPayload.initiative || 0,
      speed: tokenPayload.speed || 30,
      notes: tokenPayload.notes || '',
    },
    position,
    gridSize,
    zIndex,
  )
}

export function TokenCreationModal({ initialToken, onCancel, onSave }) {
  const [form, setForm] = useState(initialToken || EMPTY_TOKEN)
  const [error, setError] = useState('')

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const uploadImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isValidTokenImage(file)) {
      setError('Invalid image type. Use PNG, JPG, JPEG, or WEBP.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setError('')
      setField('imageUrl', String(reader.result || ''))
    }
    reader.onerror = () => {
      setError('Image upload failed.')
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const save = (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Token name is required.')
      return
    }
    if (!form.imageUrl) {
      setError('Token image is required.')
      return
    }
    onSave({ ...form, id: initialToken?.id || crypto.randomUUID() })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="token-modal" aria-label="Create token">
        <button className="modal-close" type="button" onClick={onCancel} aria-label="Close token modal">
          <X size={18} />
        </button>
        <div className="panel-title">{initialToken ? 'Edit Token' : 'Create Token'}</div>
        <form className="token-form" onSubmit={save}>
          <label>
            <span>Token Name</span>
            <input value={form.name} onChange={(event) => setField('name', event.target.value)} autoFocus />
          </label>
          <label className="token-upload">
            <span>Token Image</span>
            <div>
              {form.imageUrl ? <img src={form.imageUrl} alt="" /> : <ImagePlus size={22} />}
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={uploadImage} />
            </div>
          </label>
          <label>
            <span>Token Size</span>
            <select value={form.size} onChange={(event) => setField('size', event.target.value)}>
              {Object.keys(TOKEN_SIZES).map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <label>
            <span>Token Type</span>
            <select value={form.type} onChange={(event) => setField('type', event.target.value)}>
              {TOKEN_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label><span>Armor Class</span><input type="number" value={form.armorClass} onChange={(event) => setField('armorClass', Number(event.target.value) || 0)} /></label>
          <label><span>Current HP</span><input type="number" value={form.currentHp} onChange={(event) => setField('currentHp', Number(event.target.value) || 0)} /></label>
          <label><span>Max HP</span><input type="number" value={form.maxHp} onChange={(event) => setField('maxHp', Number(event.target.value) || 0)} /></label>
          <label><span>Initiative</span><input type="number" value={form.initiative} onChange={(event) => setField('initiative', Number(event.target.value) || 0)} /></label>
          <label><span>Speed</span><input type="number" value={form.speed} onChange={(event) => setField('speed', Number(event.target.value) || 0)} /></label>
          <label className="wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></label>
          {error && <p className="token-error">{error}</p>}
          <button className="primary-action" type="submit">Save Token</button>
        </form>
      </section>
    </div>
  )
}

export function TokenLibrary({ tokenTemplates, onCreate, onEdit, onDelete, onDuplicate }) {
  return (
    <aside className="token-library">
      <div className="token-panel-header">
        <span>Token Library</span>
        <button type="button" title="Create token" onClick={onCreate}><Plus size={16} /></button>
      </div>
      <div className="token-template-list">
        {tokenTemplates.length === 0 ? (
          <p>No tokens yet.</p>
        ) : tokenTemplates.map((token) => (
          <article
            className="token-template-card"
            draggable
            key={token.id}
            onDragStart={(event) => event.dataTransfer.setData('application/x-vtt-token-template', token.id)}
          >
            <img src={token.imageUrl} alt="" />
            <div>
              <strong>{token.name}</strong>
              <span>{token.size} {token.type}</span>
            </div>
            <button type="button" title="Edit token" onClick={() => onEdit(token)}>Edit</button>
            <button type="button" title="Duplicate token" onClick={() => onDuplicate(token)}><Copy size={14} /></button>
            <button className="danger" type="button" title="Delete token" onClick={() => onDelete(token.id)}><Trash2 size={14} /></button>
          </article>
        ))}
      </div>
    </aside>
  )
}

export function PlacedTokenView({ token, selected, zoom, pan, onSelect, onMove, onOpenInspector }) {
  const dragRef = useRef(null)
  const hpPercent = Math.max(0, Math.min(100, token.maxHp ? (token.currentHp / token.maxHp) * 100 : 0))

  const startMove = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x: token.x, y: token.y }
    onSelect(token.id)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stopMove, { once: true })
  }

  const move = (event) => {
    if (!dragRef.current) return
    const dx = (event.clientX - dragRef.current.clientX) / zoom
    const dy = (event.clientY - dragRef.current.clientY) / zoom
    onMove(token.id, dragRef.current.x + dx, dragRef.current.y + dy)
  }

  const stopMove = () => {
    dragRef.current = null
    window.removeEventListener('pointermove', move)
  }

  return (
    <button
      className={`placed-token ${selected ? 'selected' : ''}`}
      style={{
        left: pan.x + token.x * zoom,
        top: pan.y + token.y * zoom,
        width: token.width * zoom,
        height: token.height * zoom,
        borderColor: TYPE_COLORS[token.type],
        zIndex: token.zIndex,
        transform: `rotate(${token.rotation}deg)`,
      }}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onSelect(token.id)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onOpenInspector(token.id)
      }}
      onPointerDown={startMove}
    >
      <img src={token.imageUrl} alt="" draggable="false" />
      <span className="placed-token-name">{token.name}</span>
      <span className="placed-token-hp"><span style={{ width: `${hpPercent}%` }} /></span>
      {token.conditions.length > 0 && <span className="placed-token-conditions">{token.conditions.length}</span>}
    </button>
  )
}

export function BattleMapTokenLayer({ mapSettings, onCloseInspector, onOpenInspector, pan, placedTokens, selectedTokenId, setPlacedTokens, setSelectedTokenId, tokenTemplates, zoom }) {
  const maxZIndex = useMemo(
    () => placedTokens.reduce((highest, token) => Math.max(highest, token.zIndex), 0),
    [placedTokens],
  )

  const updateTokenPosition = (tokenId, x, y) => {
    setPlacedTokens((prev) => prev.map((token) => {
      if (token.id !== tokenId) return token
      const snapped = {
        ...token,
        x: snapToGrid(x, mapSettings.gridSize, mapSettings.gridEnabled && mapSettings.snapToGrid),
        y: snapToGrid(y, mapSettings.gridSize, mapSettings.gridEnabled && mapSettings.snapToGrid),
      }
      return { ...token, ...clampTokenPosition(snapped, mapSettings) }
    }))
  }

  return (
    <div
      className="token-map-layer"
      onClick={() => {
        setSelectedTokenId(null)
        onCloseInspector()
      }}
    >
      {placedTokens.map((token) => (
        <PlacedTokenView
          key={token.id}
          token={token}
          selected={selectedTokenId === token.id}
          zoom={zoom}
          pan={pan}
          onSelect={setSelectedTokenId}
          onMove={updateTokenPosition}
          onOpenInspector={onOpenInspector}
        />
      ))}
    </div>
  )
}

export function TokenInspector({ isOpen, selectedToken, onClose, onUpdate, onDelete, onBringToFront, onSendToBack }) {
  if (!isOpen || !selectedToken) return null

  const update = (field, value) => onUpdate(selectedToken.id, { [field]: value })
  const toggleCondition = (condition) => {
    const next = selectedToken.conditions.includes(condition)
      ? selectedToken.conditions.filter((item) => item !== condition)
      : [...selectedToken.conditions, condition]
    update('conditions', next)
  }

  return (
    <aside className="token-inspector">
      <div className="token-panel-header">
        <span>Token Inspector</span>
        <button type="button" title="Close inspector" aria-label="Close token inspector" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      <label><span>Name</span><input value={selectedToken.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label><span>Current HP</span><input type="number" value={selectedToken.currentHp} onChange={(event) => update('currentHp', Number(event.target.value) || 0)} /></label>
      <label><span>Max HP</span><input type="number" value={selectedToken.maxHp} onChange={(event) => update('maxHp', Number(event.target.value) || 0)} /></label>
      <label><span>Armor Class</span><input type="number" value={selectedToken.armorClass} onChange={(event) => update('armorClass', Number(event.target.value) || 0)} /></label>
      <label>
        <span>Size</span>
        <select value={selectedToken.size} onChange={(event) => update('size', event.target.value)}>
          {Object.keys(TOKEN_SIZES).map((size) => <option key={size}>{size}</option>)}
        </select>
      </label>
      <label><span>Rotate</span><input type="number" value={selectedToken.rotation} onChange={(event) => update('rotation', Number(event.target.value) || 0)} /></label>
      <label className="wide"><span>Notes</span><textarea value={selectedToken.notes} onChange={(event) => update('notes', event.target.value)} /></label>
      <div className="condition-grid">
        {TOKEN_CONDITIONS.map((condition) => (
          <button
            className={selectedToken.conditions.includes(condition) ? 'active' : ''}
            key={condition}
            type="button"
            onClick={() => toggleCondition(condition)}
          >
            {condition}
          </button>
        ))}
      </div>
      <div className="token-inspector-actions">
        <button type="button" onClick={() => onBringToFront(selectedToken.id)}>Bring to front</button>
        <button type="button" onClick={() => onSendToBack(selectedToken.id)}>Send to back</button>
        <button className="danger" type="button" onClick={() => onDelete(selectedToken.id)}>Delete</button>
      </div>
    </aside>
  )
}

function TokenSystem({
  gridSize,
  mapSettings,
  pan,
  placedTokens,
  selectedTokenId,
  setPlacedTokens,
  setSelectedTokenId,
  setTokenTemplates,
  tokenTemplates,
  zoom,
}) {
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const selectedToken = placedTokens.find((token) => token.id === selectedTokenId) || null
  const maxZIndex = useMemo(
    () => placedTokens.reduce((highest, token) => Math.max(highest, token.zIndex), 0),
    [placedTokens],
  )

  const saveTemplate = (token) => {
    setTokenTemplates((prev) => {
      const exists = prev.some((item) => item.id === token.id)
      return exists ? prev.map((item) => (item.id === token.id ? token : item)) : [...prev, token]
    })
    setEditingTemplate(null)
    setIsModalOpen(false)
  }

  const deleteTemplate = (templateId) => {
    setTokenTemplates((prev) => prev.filter((token) => token.id !== templateId))
  }

  const duplicateTemplate = (token) => {
    setTokenTemplates((prev) => [...prev, { ...token, id: crypto.randomUUID(), name: `${token.name} Copy` }])
  }

  const updatePlacedToken = (tokenId, patch) => {
    setPlacedTokens((prev) => prev.map((token) => {
      if (token.id !== tokenId) return token
      const next = { ...token, ...patch }
      if (patch.size) {
        const sizePx = tokenPixels(patch.size, gridSize)
        next.width = sizePx
        next.height = sizePx
      }
      return { ...next, ...clampTokenPosition(next, mapSettings) }
    }))
  }

  return (
    <>
      <BattleMapTokenLayer
        mapSettings={mapSettings}
        onCloseInspector={() => setIsInspectorOpen(false)}
        onOpenInspector={(tokenId) => {
          setSelectedTokenId(tokenId)
          setIsInspectorOpen(true)
        }}
        pan={pan}
        placedTokens={placedTokens}
        selectedTokenId={selectedTokenId}
        setPlacedTokens={setPlacedTokens}
        setSelectedTokenId={setSelectedTokenId}
        tokenTemplates={tokenTemplates}
        zoom={zoom}
      />
      <TokenInspector
        isOpen={isInspectorOpen}
        selectedToken={selectedToken}
        onClose={() => setIsInspectorOpen(false)}
        onUpdate={updatePlacedToken}
        onDelete={(tokenId) => {
          setPlacedTokens((prev) => prev.filter((token) => token.id !== tokenId))
          setSelectedTokenId(null)
          setIsInspectorOpen(false)
        }}
        onBringToFront={(tokenId) => updatePlacedToken(tokenId, { zIndex: maxZIndex + 1 })}
        onSendToBack={(tokenId) => updatePlacedToken(tokenId, { zIndex: 1 })}
      />
      {isModalOpen && (
        <TokenCreationModal
          initialToken={editingTemplate}
          onCancel={() => {
            setEditingTemplate(null)
            setIsModalOpen(false)
          }}
          onSave={saveTemplate}
        />
      )}
    </>
  )
}

export default TokenSystem
