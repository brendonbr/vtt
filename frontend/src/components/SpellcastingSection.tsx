import { useMemo, useState } from 'react'

export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
export type ActivationType = 'action' | 'bonusAction' | 'reaction' | 'other'
export type SpellcastingMode = 'prepared' | 'known' | 'pactMagic' | 'custom'

export interface SpellcastingSettings {
  enabled: boolean
  spellcastingClass: string
  spellcastingAbility: AbilityKey
  spellcastingMode: SpellcastingMode
  ritualCasting: boolean
  spellcastingFocus?: string
  preparedSpellMax?: number
  strictPreparedLimit?: boolean
  notes?: string
}

export interface SpellSlot {
  level: number
  total: number
  expended: number
}

export interface PactMagicSlots {
  enabled: boolean
  slotLevel: number
  total: number
  expended: number
}

export interface CharacterSpell {
  id: string
  name: string
  level: number
  school?: string
  castingTime: string
  activationType?: ActivationType
  range?: string
  components?: string
  duration?: string
  concentration: boolean
  ritual: boolean
  prepared: boolean
  known: boolean
  requiresAttackRoll: boolean
  requiresSavingThrow: boolean
  saveAbility?: AbilityKey
  damage?: string
  damageType?: string
  healing?: string
  description?: string
  notes?: string
  source?: string
}

export interface SpellCombatLogEntry {
  id: string
  characterId: string
  spellId: string
  spellName: string
  spellLevel: number
  slotLevelUsed?: number
  timestamp: string
}

export interface SpellCharacter {
  id?: string | number
  name?: string
  basic?: { characterName?: string, level?: number }
  core: { proficiencyBonus: number }
  abilities: Record<AbilityKey, { score: number, modifier?: number }>
  spellcasting: SpellcastingSettings & {
    ability?: AbilityKey
    className?: string
    spellSaveDc?: number
    spellAttackBonus?: number
    slots?: Record<number, { total: number, expended: number }>
    spells?: Partial<CharacterSpell>[]
  }
  spellSlots?: SpellSlot[]
  pactMagicSlots?: PactMagicSlots
  spells?: CharacterSpell[]
  spellCombatLog?: SpellCombatLogEntry[]
}

interface SpellcastingSectionProps {
  character: SpellCharacter
  onChange: (character: SpellCharacter) => void
}

const ABILITY_OPTIONS: Array<{ value: AbilityKey, label: string }> = [
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'charisma', label: 'Charisma' },
]

const SAVE_ABILITIES: Array<{ value: AbilityKey, label: string }> = [
  { value: 'strength', label: 'Strength' },
  { value: 'dexterity', label: 'Dexterity' },
  { value: 'constitution', label: 'Constitution' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'charisma', label: 'Charisma' },
]

const SPELLCASTING_MODES: Array<{ value: SpellcastingMode, label: string }> = [
  { value: 'prepared', label: 'Prepared' },
  { value: 'known', label: 'Known' },
  { value: 'pactMagic', label: 'Pact Magic' },
  { value: 'custom', label: 'Custom' },
]

const ACTIVATION_LABELS: Record<ActivationType, string> = {
  action: 'Action',
  bonusAction: 'Bonus Action',
  reaction: 'Reaction',
  other: 'Other',
}

const SPELL_LEVELS = Array.from({ length: 10 }, (_, level) => level)
const SLOT_LEVELS = Array.from({ length: 9 }, (_, index) => index + 1)
const SPELL_SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
const CASTING_TIME_OPTIONS = [
  { value: '', label: 'Select casting time' },
  { value: '1 action', label: '1 Action' },
  { value: '1 bonus action', label: '1 Bonus Action' },
  { value: '1 reaction', label: '1 Reaction' },
  { value: '1 minute', label: '1 Minute' },
  { value: '10 minutes', label: '10 Minutes' },
  { value: '1 hour', label: '1 Hour' },
  { value: '8 hours', label: '8 Hours' },
  { value: '12 hours', label: '12 Hours' },
  { value: '24 hours', label: '24 Hours' },
  { value: 'custom', label: 'Custom' },
]
const COMBAT_ACTIVATION_TYPES: ActivationType[] = ['action', 'bonusAction', 'reaction']

const randomId = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number(value) || 0))
const numberFromInput = (value: string) => Math.max(0, Number(value) || 0)
const spellLevelLabel = (level: number) => (Number(level) === 0 ? 'Cantrips' : `Level ${level}`)

export const createSpellSlots = (): SpellSlot[] => SLOT_LEVELS.map((level) => ({ level, total: 0, expended: 0 }))

export const createPactMagicSlots = (): PactMagicSlots => ({
  enabled: false,
  slotLevel: 1,
  total: 0,
  expended: 0,
})

export const createSpellcastingSettings = (): SpellcastingSettings => ({
  enabled: false,
  spellcastingClass: '',
  spellcastingAbility: 'intelligence',
  spellcastingMode: 'prepared',
  ritualCasting: false,
  spellcastingFocus: '',
  preparedSpellMax: 0,
  strictPreparedLimit: false,
  notes: '',
})

export const createEmptySpell = (level = 0): CharacterSpell => ({
  id: randomId(),
  name: '',
  level,
  school: '',
  castingTime: '',
  activationType: 'other',
  range: '',
  components: '',
  duration: '',
  concentration: false,
  ritual: false,
  prepared: level === 0,
  known: level === 0,
  requiresAttackRoll: false,
  requiresSavingThrow: false,
  saveAbility: undefined,
  damage: '',
  damageType: '',
  healing: '',
  description: '',
  notes: '',
  source: '',
})

export function getAbilityModifier(character: SpellCharacter, abilityKey: AbilityKey): number {
  const ability = character.abilities?.[abilityKey]
  if (ability?.modifier !== undefined) return Number(ability.modifier) || 0
  return Math.floor(((Number(ability?.score) || 10) - 10) / 2)
}

export function getSpellSaveDc(character: SpellCharacter): number {
  const ability = character.spellcasting.spellcastingAbility || character.spellcasting.ability || 'intelligence'
  return 8 + (Number(character.core?.proficiencyBonus) || 0) + getAbilityModifier(character, ability)
}

export function getSpellAttackBonus(character: SpellCharacter): number {
  const ability = character.spellcasting.spellcastingAbility || character.spellcasting.ability || 'intelligence'
  return (Number(character.core?.proficiencyBonus) || 0) + getAbilityModifier(character, ability)
}

export function getActivationTypeFromCastingTime(castingTime: string): ActivationType {
  const value = String(castingTime || '').trim().toLowerCase()
  if (value === '1 action' || value === 'action') return 'action'
  if (value === '1 bonus action' || value === 'bonus action') return 'bonusAction'
  if (value === '1 reaction' || value === 'reaction') return 'reaction'
  return 'other'
}

const getCombatActivationType = (spell: Partial<CharacterSpell>): ActivationType => (
  COMBAT_ACTIVATION_TYPES.includes(spell.activationType as ActivationType)
    ? spell.activationType as ActivationType
    : getActivationTypeFromCastingTime(spell.castingTime || '')
)

const getCastingTimeSelectValue = (castingTime: string) => {
  const value = String(castingTime || '')
  return CASTING_TIME_OPTIONS.some((option) => option.value === value) ? value : 'custom'
}

export function getRemainingSpellSlots(character: SpellCharacter, spellLevel: number): number {
  const slot = (character.spellSlots || []).find((item) => item.level === spellLevel)
  if (!slot) return 0
  return Math.max((Number(slot.total) || 0) - (Number(slot.expended) || 0), 0)
}

export function getPreparedSpellCount(character: SpellCharacter): number {
  return (character.spells || []).filter((spell) => spell.level > 0 && spell.prepared).length
}

export function getPreparedSpellMax(character: SpellCharacter): number {
  if (Number(character.spellcasting.preparedSpellMax) > 0) return Number(character.spellcasting.preparedSpellMax)
  const ability = character.spellcasting.spellcastingAbility || 'intelligence'
  return Math.max(1, getAbilityModifier(character, ability) + (Number(character.basic?.level) || 1))
}

export function canCastSpell(character: SpellCharacter, spell: CharacterSpell): boolean {
  if (spell.level === 0) return true
  if (character.spellcasting.spellcastingMode === 'pactMagic') {
    const pact = character.pactMagicSlots || createPactMagicSlots()
    return pact.enabled && Math.max(Number(pact.total) - Number(pact.expended), 0) > 0
  }
  return getRemainingSpellSlots(character, spell.level) > 0
}

export function castSpell(character: SpellCharacter, spellId: string, slotLevelUsed?: number): SpellCharacter {
  const spell = (character.spells || []).find((item) => item.id === spellId)
  if (!spell || !canCastSpell(character, spell)) return character

  let nextSpellSlots = character.spellSlots || createSpellSlots()
  let nextPactSlots = character.pactMagicSlots || createPactMagicSlots()
  const usedSlotLevel = spell.level === 0 ? undefined : slotLevelUsed || spell.level

  if (spell.level > 0 && character.spellcasting.spellcastingMode === 'pactMagic') {
    nextPactSlots = { ...nextPactSlots, expended: Math.min(nextPactSlots.total, Number(nextPactSlots.expended) + 1) }
  } else if (spell.level > 0) {
    nextSpellSlots = nextSpellSlots.map((slot) => (
      slot.level === usedSlotLevel ? { ...slot, expended: Math.min(slot.total, Number(slot.expended) + 1) } : slot
    ))
  }

  const logEntry: SpellCombatLogEntry = {
    id: randomId(),
    characterId: String(character.id || character.basic?.characterName || character.name || 'character'),
    spellId: spell.id,
    spellName: spell.name,
    spellLevel: spell.level,
    slotLevelUsed: usedSlotLevel,
    timestamp: new Date().toISOString(),
  }

  return {
    ...character,
    spellSlots: nextSpellSlots,
    pactMagicSlots: nextPactSlots,
    spellCombatLog: [...(character.spellCombatLog || []), logEntry],
  }
}

export function getSpellsForCombat(character: SpellCharacter, activationType: ActivationType): CharacterSpell[] {
  return (character.spells || []).filter((spell) => {
    const spellActivation = getCombatActivationType(spell)
    if (spellActivation !== activationType) return false
    return spell.level === 0
      || spell.prepared
      || spell.known
      || character.spellcasting.spellcastingMode === 'custom'
  })
}

export function resetSpellSlots(character: SpellCharacter): SpellCharacter {
  return {
    ...character,
    spellSlots: (character.spellSlots || createSpellSlots()).map((slot) => ({ ...slot, expended: 0 })),
    pactMagicSlots: { ...(character.pactMagicSlots || createPactMagicSlots()), expended: 0 },
  }
}

export function normalizeSpellcastingCharacter(character: SpellCharacter): SpellCharacter {
  const settings = {
    ...createSpellcastingSettings(),
    ...character.spellcasting,
    spellcastingClass: character.spellcasting.spellcastingClass || character.spellcasting.className || '',
    spellcastingAbility: character.spellcasting.spellcastingAbility || character.spellcasting.ability || 'intelligence',
  }
  const nestedSlots = character.spellcasting.slots || {}
  const spellSlots = character.spellSlots || createSpellSlots().map((slot) => ({
    ...slot,
    ...nestedSlots[slot.level],
    level: slot.level,
  }))
  const sourceSpells = character.spells?.length ? character.spells : (character.spellcasting.spells || [])
  const spells = sourceSpells.map((spell, index) => ({
    ...createEmptySpell(Number(spell.level) || 0),
    ...spell,
    id: spell.id || `spell-${index}-${String(spell.name || 'new').toLowerCase().replace(/\s+/g, '-')}`,
    level: clampNumber(Number(spell.level) || 0, 0, 9),
    activationType: getCombatActivationType(spell),
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    prepared: Boolean(spell.prepared || Number(spell.level) === 0),
    known: Boolean(spell.known || Number(spell.level) === 0),
  }))

  return {
    ...character,
    spellcasting: {
      ...settings,
      ability: settings.spellcastingAbility,
      className: settings.spellcastingClass,
      spellSaveDc: getSpellSaveDc({ ...character, spellcasting: settings }),
      spellAttackBonus: getSpellAttackBonus({ ...character, spellcasting: settings }),
      slots: Object.fromEntries(spellSlots.map((slot) => [slot.level, { total: slot.total, expended: slot.expended }])),
      spells,
    },
    spellSlots,
    pactMagicSlots: character.pactMagicSlots || createPactMagicSlots(),
    spells,
  }
}

function SpellcastingSettingsPanel({ character, onChange }: SpellcastingSectionProps) {
  const preparedCount = getPreparedSpellCount(character)
  const preparedMax = getPreparedSpellMax(character)
  const updateSettings = (patch: Partial<SpellcastingSettings>) => {
    const spellcasting = { ...character.spellcasting, ...patch }
    onChange({
      ...character,
      spellcasting: {
        ...spellcasting,
        ability: spellcasting.spellcastingAbility,
        className: spellcasting.spellcastingClass,
        spellSaveDc: getSpellSaveDc({ ...character, spellcasting }),
        spellAttackBonus: getSpellAttackBonus({ ...character, spellcasting }),
      },
    })
  }

  return (
    <section className="spell-panel">
      <div className="spell-section-heading">
        <h3>Spellcasting Settings</h3>
        <span>{preparedCount}/{preparedMax} prepared</span>
      </div>
      <div className="spell-settings-grid">
        <label className="spell-check-field"><input type="checkbox" checked={character.spellcasting.enabled} onChange={(event) => updateSettings({ enabled: event.target.checked })} /><span>Spellcasting Enabled</span></label>
        <label><span>Spellcasting Class</span><input value={character.spellcasting.spellcastingClass} onChange={(event) => updateSettings({ spellcastingClass: event.target.value })} /></label>
        <label><span>Spellcasting Ability</span><select value={character.spellcasting.spellcastingAbility} onChange={(event) => updateSettings({ spellcastingAbility: event.target.value as AbilityKey })}>{ABILITY_OPTIONS.map((ability) => <option key={ability.value} value={ability.value}>{ability.label}</option>)}</select></label>
        <label><span>Spellcasting Mode</span><select value={character.spellcasting.spellcastingMode} onChange={(event) => updateSettings({ spellcastingMode: event.target.value as SpellcastingMode })}>{SPELLCASTING_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
        <label><span>Spell Save DC</span><input readOnly value={getSpellSaveDc(character)} /></label>
        <label><span>Spell Attack Bonus</span><input readOnly value={`+${getSpellAttackBonus(character)}`} /></label>
        <label className="spell-check-field"><input type="checkbox" checked={character.spellcasting.ritualCasting} onChange={(event) => updateSettings({ ritualCasting: event.target.checked })} /><span>Ritual Casting</span></label>
        <label><span>Spellcasting Focus</span><input value={character.spellcasting.spellcastingFocus || ''} onChange={(event) => updateSettings({ spellcastingFocus: event.target.value })} /></label>
        <label><span>Prepared Max</span><input type="number" min="0" value={character.spellcasting.preparedSpellMax || 0} onChange={(event) => updateSettings({ preparedSpellMax: numberFromInput(event.target.value) })} /></label>
        <label className="spell-check-field"><input type="checkbox" checked={Boolean(character.spellcasting.strictPreparedLimit)} onChange={(event) => updateSettings({ strictPreparedLimit: event.target.checked })} /><span>Strict Prepared Limit</span></label>
        <label className="spell-wide-field"><span>Notes</span><textarea rows={3} value={character.spellcasting.notes || ''} onChange={(event) => updateSettings({ notes: event.target.value })} /></label>
      </div>
    </section>
  )
}

function SpellSlotsTracker({ character, onChange }: SpellcastingSectionProps) {
  const updateSlot = (level: number, patch: Partial<SpellSlot>) => {
    const spellSlots = (character.spellSlots || createSpellSlots()).map((slot) => (
      slot.level === level ? { ...slot, ...patch } : slot
    ))
    onChange({ ...character, spellSlots })
  }

  return (
    <section className="spell-panel">
      <div className="spell-section-heading">
        <h3>Spell Slots</h3>
        <button type="button" onClick={() => onChange(resetSpellSlots(character))}>Reset Expended Slots</button>
      </div>
      <div className="spell-slot-grid">
        {(character.spellSlots || createSpellSlots()).map((slot) => (
          <div className="spell-slot-row" key={slot.level}>
            <strong>Level {slot.level}</strong>
            <label><span>Total</span><input type="number" min="0" value={slot.total} onChange={(event) => updateSlot(slot.level, { total: numberFromInput(event.target.value) })} /></label>
            <label><span>Expended</span><input type="number" min="0" value={slot.expended} onChange={(event) => updateSlot(slot.level, { expended: numberFromInput(event.target.value) })} /></label>
            <div><span>Remaining</span><strong>{Math.max(slot.total - slot.expended, 0)}</strong></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PactMagicTracker({ character, onChange }: SpellcastingSectionProps) {
  const pact = character.pactMagicSlots || createPactMagicSlots()
  const update = (patch: Partial<PactMagicSlots>) => onChange({ ...character, pactMagicSlots: { ...pact, ...patch } })

  return (
    <section className="spell-panel">
      <div className="spell-section-heading">
        <h3>Pact Magic</h3>
        <span>{Math.max(pact.total - pact.expended, 0)} remaining</span>
      </div>
      <div className="spell-pact-grid">
        <label className="spell-check-field"><input type="checkbox" checked={pact.enabled} onChange={(event) => update({ enabled: event.target.checked })} /><span>Pact Slots Enabled</span></label>
        <label><span>Pact Slots Total</span><input type="number" min="0" value={pact.total} onChange={(event) => update({ total: numberFromInput(event.target.value) })} /></label>
        <label><span>Pact Slots Expended</span><input type="number" min="0" value={pact.expended} onChange={(event) => update({ expended: numberFromInput(event.target.value) })} /></label>
        <label><span>Pact Slot Level</span><input type="number" min="1" max="9" value={pact.slotLevel} onChange={(event) => update({ slotLevel: clampNumber(Number(event.target.value), 1, 9) })} /></label>
      </div>
    </section>
  )
}

interface SpellFiltersState {
  search: string
  level: string
  school: string
  castingTime: string
  preparedOnly: boolean
  concentrationOnly: boolean
  ritualOnly: boolean
}

function SpellFilters({ filters, onChange }: { filters: SpellFiltersState, onChange: (filters: SpellFiltersState) => void }) {
  const patch = (updates: Partial<SpellFiltersState>) => onChange({ ...filters, ...updates })
  return (
    <section className="spell-panel spell-filters">
      <label><span>Search</span><input placeholder="Spell name" value={filters.search} onChange={(event) => patch({ search: event.target.value })} /></label>
      <label><span>Level</span><select value={filters.level} onChange={(event) => patch({ level: event.target.value })}><option value="">All</option>{SPELL_LEVELS.map((level) => <option key={level} value={level}>{spellLevelLabel(level)}</option>)}</select></label>
      <label><span>School</span><select value={filters.school} onChange={(event) => patch({ school: event.target.value })}><option value="">All</option>{SPELL_SCHOOLS.map((school) => <option key={school} value={school}>{school}</option>)}</select></label>
      <label><span>Casting Time</span><input value={filters.castingTime} onChange={(event) => patch({ castingTime: event.target.value })} /></label>
      <label className="spell-check-field"><input type="checkbox" checked={filters.preparedOnly} onChange={(event) => patch({ preparedOnly: event.target.checked })} /><span>Prepared only</span></label>
      <label className="spell-check-field"><input type="checkbox" checked={filters.concentrationOnly} onChange={(event) => patch({ concentrationOnly: event.target.checked })} /><span>Concentration</span></label>
      <label className="spell-check-field"><input type="checkbox" checked={filters.ritualOnly} onChange={(event) => patch({ ritualOnly: event.target.checked })} /><span>Ritual</span></label>
    </section>
  )
}

function SpellCard({ character, spell, onCast, onEdit, onDelete, onTogglePrepared, onToggleKnown }: {
  character: SpellCharacter
  spell: CharacterSpell
  onCast: (spell: CharacterSpell) => void
  onEdit: (spell: CharacterSpell) => void
  onDelete: (spellId: string) => void
  onTogglePrepared: (spellId: string, prepared: boolean) => void
  onToggleKnown: (spellId: string, known: boolean) => void
}) {
  const castDisabled = !canCastSpell(character, spell)
  return (
    <article className="spell-card">
      <header>
        <div>
          <h4>{spell.name || 'Unnamed spell'}</h4>
          <span>{spellLevelLabel(spell.level)} {spell.school ? `• ${spell.school}` : ''}</span>
        </div>
        <div className="spell-badges">
          <span>{ACTIVATION_LABELS[getCombatActivationType(spell)]}</span>
          {spell.concentration && <span>Concentration</span>}
          {spell.ritual && <span>Ritual</span>}
          {spell.prepared && <span>Prepared</span>}
          {spell.known && <span>Known</span>}
        </div>
      </header>
      <div className="spell-card-stats">
        {spell.castingTime && <span>{spell.castingTime}</span>}
        {spell.range && <span>Range {spell.range}</span>}
        {spell.components && <span>{spell.components}</span>}
        {spell.requiresAttackRoll && <span>Attack +{getSpellAttackBonus(character)}</span>}
        {spell.requiresSavingThrow && <span>Save DC {getSpellSaveDc(character)} {spell.saveAbility || ''}</span>}
        {spell.damage && <span>Damage {spell.damage} {spell.damageType || ''}</span>}
        {spell.healing && <span>Healing {spell.healing}</span>}
      </div>
      {spell.description && <p>{spell.description}</p>}
      {spell.notes && <p>{spell.notes}</p>}
      <footer>
        {spell.level > 0 && character.spellcasting.spellcastingMode === 'prepared' && (
          <label><input type="checkbox" checked={spell.prepared} onChange={(event) => onTogglePrepared(spell.id, event.target.checked)} /> Prepared</label>
        )}
        {spell.level > 0 && character.spellcasting.spellcastingMode === 'known' && (
          <label><input type="checkbox" checked={spell.known} onChange={(event) => onToggleKnown(spell.id, event.target.checked)} /> Known</label>
        )}
        <button type="button" disabled={castDisabled} onClick={() => onCast(spell)}>Cast</button>
        <button type="button" onClick={() => onEdit(spell)}>Edit</button>
        <button type="button" onClick={() => onDelete(spell.id)}>Delete</button>
      </footer>
    </article>
  )
}

function SpellFormModal({ initialSpell, level, onSave, onCancel }: {
  initialSpell?: CharacterSpell | null
  level: number
  onSave: (spell: CharacterSpell) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<CharacterSpell>(() => initialSpell || createEmptySpell(level))
  const [castingTimeMode, setCastingTimeMode] = useState(() => getCastingTimeSelectValue(initialSpell?.castingTime || ''))
  const patch = (updates: Partial<CharacterSpell>) => setForm((prev) => ({ ...prev, ...updates }))
  const updateCastingTime = (castingTime: string) => {
    patch({
      castingTime,
      activationType: getActivationTypeFromCastingTime(castingTime),
    })
  }

  return (
    <div className="spell-modal-backdrop" role="presentation">
      <section className="spell-form-modal" aria-label="Spell form">
        <header><h3>{initialSpell ? 'Edit Spell' : 'Add Spell'}</h3><button type="button" onClick={onCancel}>Close</button></header>
        <div className="spell-form-grid">
          <label><span>Name</span><input value={form.name} placeholder="Fire spell" onChange={(event) => patch({ name: event.target.value })} /></label>
          <label><span>Level</span><input type="number" min="0" max="9" value={form.level} onChange={(event) => patch({ level: clampNumber(Number(event.target.value), 0, 9) })} /></label>
          <label><span>School</span><input value={form.school || ''} onChange={(event) => patch({ school: event.target.value })} /></label>
          <label>
            <span>Casting Time</span>
            <select
              value={castingTimeMode}
              onChange={(event) => {
                setCastingTimeMode(event.target.value)
                if (event.target.value === 'custom') {
                  if (getCastingTimeSelectValue(form.castingTime) !== 'custom') updateCastingTime('')
                  return
                }
                updateCastingTime(event.target.value)
              }}
            >
              {CASTING_TIME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {castingTimeMode === 'custom' && (
            <label>
              <span>Custom Casting Time</span>
              <input value={form.castingTime} onChange={(event) => updateCastingTime(event.target.value)} />
            </label>
          )}
          <label><span>Range</span><input value={form.range || ''} onChange={(event) => patch({ range: event.target.value })} /></label>
          <label><span>Components</span><input value={form.components || ''} onChange={(event) => patch({ components: event.target.value })} /></label>
          <label><span>Duration</span><input value={form.duration || ''} onChange={(event) => patch({ duration: event.target.value })} /></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.concentration} onChange={(event) => patch({ concentration: event.target.checked })} /><span>Concentration</span></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.ritual} onChange={(event) => patch({ ritual: event.target.checked })} /><span>Ritual</span></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.prepared} onChange={(event) => patch({ prepared: event.target.checked })} /><span>Prepared</span></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.known} onChange={(event) => patch({ known: event.target.checked })} /><span>Known</span></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.requiresAttackRoll} onChange={(event) => patch({ requiresAttackRoll: event.target.checked })} /><span>Requires Attack Roll</span></label>
          <label className="spell-check-field"><input type="checkbox" checked={form.requiresSavingThrow} onChange={(event) => patch({ requiresSavingThrow: event.target.checked })} /><span>Requires Saving Throw</span></label>
          <label><span>Save Ability</span><select value={form.saveAbility || ''} onChange={(event) => patch({ saveAbility: event.target.value ? event.target.value as AbilityKey : undefined })}><option value="">None</option>{SAVE_ABILITIES.map((ability) => <option key={ability.value} value={ability.value}>{ability.label}</option>)}</select></label>
          <label><span>Damage</span><input value={form.damage || ''} onChange={(event) => patch({ damage: event.target.value })} /></label>
          <label><span>Damage Type</span><input value={form.damageType || ''} onChange={(event) => patch({ damageType: event.target.value })} /></label>
          <label><span>Healing</span><input value={form.healing || ''} onChange={(event) => patch({ healing: event.target.value })} /></label>
          <label><span>Source</span><input value={form.source || ''} onChange={(event) => patch({ source: event.target.value })} /></label>
          <label className="spell-wide-field"><span>Description</span><textarea rows={4} placeholder="Protective spell" value={form.description || ''} onChange={(event) => patch({ description: event.target.value })} /></label>
          <label className="spell-wide-field"><span>Notes</span><textarea rows={3} value={form.notes || ''} onChange={(event) => patch({ notes: event.target.value })} /></label>
        </div>
        <footer><button type="button" onClick={onCancel}>Cancel</button><button type="button" disabled={!form.name.trim()} onClick={() => onSave({ ...form, activationType: getCombatActivationType(form) })}>Save Spell</button></footer>
      </section>
    </div>
  )
}

function SpellLevelGroup({ character, level, spells, onAdd, onCast, onEdit, onDelete, onTogglePrepared, onToggleKnown }: {
  character: SpellCharacter
  level: number
  spells: CharacterSpell[]
  onAdd: (level: number) => void
  onCast: (spell: CharacterSpell) => void
  onEdit: (spell: CharacterSpell) => void
  onDelete: (spellId: string) => void
  onTogglePrepared: (spellId: string, prepared: boolean) => void
  onToggleKnown: (spellId: string, known: boolean) => void
}) {
  return (
    <details className="spell-level-group" open={level <= 1}>
      <summary><div><h3>{spellLevelLabel(level)}</h3><span>{spells.length} spell{spells.length === 1 ? '' : 's'}</span></div><button type="button" onClick={(event) => { event.preventDefault(); onAdd(level) }}>Add Spell</button></summary>
      <div className="spell-card-list">
        {spells.length ? spells.map((spell) => (
          <SpellCard key={spell.id} character={character} spell={spell} onCast={onCast} onEdit={onEdit} onDelete={onDelete} onTogglePrepared={onTogglePrepared} onToggleKnown={onToggleKnown} />
        )) : <p className="spell-empty">No spells at this level.</p>}
      </div>
    </details>
  )
}

function SpellList({ character, filters, onChange }: { character: SpellCharacter, filters: SpellFiltersState, onChange: (character: SpellCharacter) => void }) {
  const [editingSpell, setEditingSpell] = useState<CharacterSpell | null>(null)
  const [addingLevel, setAddingLevel] = useState<number | null>(null)
  const preparedMax = getPreparedSpellMax(character)
  const preparedCount = getPreparedSpellCount(character)

  const updateSpells = (spells: CharacterSpell[]) => {
    onChange({ ...character, spells, spellcasting: { ...character.spellcasting, spells } })
  }

  const filteredSpells = (character.spells || []).filter((spell) => {
    if (filters.search && !spell.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.level !== '' && spell.level !== Number(filters.level)) return false
    if (filters.school && spell.school !== filters.school) return false
    if (filters.castingTime && !spell.castingTime.toLowerCase().includes(filters.castingTime.toLowerCase())) return false
    if (filters.preparedOnly && !spell.prepared) return false
    if (filters.concentrationOnly && !spell.concentration) return false
    if (filters.ritualOnly && !spell.ritual) return false
    return true
  })

  const saveSpell = (spell: CharacterSpell) => {
    const exists = (character.spells || []).some((item) => item.id === spell.id)
    updateSpells(exists ? (character.spells || []).map((item) => (item.id === spell.id ? spell : item)) : [...(character.spells || []), spell])
    setEditingSpell(null)
    setAddingLevel(null)
  }

  const togglePrepared = (spellId: string, prepared: boolean) => {
    if (prepared && character.spellcasting.strictPreparedLimit && preparedCount >= preparedMax) return
    updateSpells((character.spells || []).map((spell) => (spell.id === spellId ? { ...spell, prepared } : spell)))
  }

  return (
    <section className="spell-list">
      {SPELL_LEVELS.map((level) => (
        <SpellLevelGroup
          key={level}
          character={character}
          level={level}
          spells={filteredSpells.filter((spell) => spell.level === level)}
          onAdd={setAddingLevel}
          onCast={(spell) => onChange(castSpell(character, spell.id))}
          onEdit={setEditingSpell}
          onDelete={(spellId) => updateSpells((character.spells || []).filter((spell) => spell.id !== spellId))}
          onTogglePrepared={togglePrepared}
          onToggleKnown={(spellId, known) => updateSpells((character.spells || []).map((spell) => (spell.id === spellId ? { ...spell, known } : spell)))}
        />
      ))}
      {(editingSpell || addingLevel !== null) && <SpellFormModal initialSpell={editingSpell} level={addingLevel ?? editingSpell?.level ?? 0} onSave={saveSpell} onCancel={() => { setEditingSpell(null); setAddingLevel(null) }} />}
    </section>
  )
}

export function SpellcastingSection({ character, onChange }: SpellcastingSectionProps) {
  const normalized = useMemo(() => normalizeSpellcastingCharacter(character), [character])
  const [filters, setFilters] = useState<SpellFiltersState>({
    search: '',
    level: '',
    school: '',
    castingTime: '',
    preparedOnly: false,
    concentrationOnly: false,
    ritualOnly: false,
  })

  return (
    <div className="spellcasting-section">
      <SpellcastingSettingsPanel character={normalized} onChange={onChange} />
      <div className="spell-resource-row">
        <SpellSlotsTracker character={normalized} onChange={onChange} />
        <PactMagicTracker character={normalized} onChange={onChange} />
      </div>
      <SpellFilters filters={filters} onChange={setFilters} />
      <SpellList character={normalized} filters={filters} onChange={onChange} />
    </div>
  )
}

export {
  PactMagicTracker,
  SpellCard,
  SpellFilters,
  SpellFormModal,
  SpellList,
  SpellLevelGroup,
  SpellSlotsTracker,
  SpellcastingSettingsPanel,
}

export default SpellcastingSection
