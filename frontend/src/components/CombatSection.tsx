import { useMemo, useState } from 'react'

export type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
export type ActivationType = 'action' | 'bonusAction' | 'reaction'
export type CombatOptionType = 'weaponAttack' | 'spell' | 'itemAction' | 'feature' | 'custom'
export type RechargeType = 'shortRest' | 'longRest' | 'turn' | 'custom' | 'none'

export interface CombatOption {
  id: string
  name: string
  type: CombatOptionType
  activationType: ActivationType
  source: string
  description?: string
  attackBonus?: number
  damage?: string
  damageType?: string
  range?: string
  saveDc?: number
  saveAbility?: AbilityKey
  uses?: number
  usesRemaining?: number
  rechargeType?: RechargeType
  requiresEquippedWeapon?: boolean
  selectedWeaponIds?: string[]
}

export interface CombatLogEntry {
  id: string
  characterId: string
  optionId: string
  optionName: string
  activationType: ActivationType
  timestamp: string
  selectedWeaponNames?: string[]
}

export interface EquipmentItem {
  id: string
  itemTemplateId?: string
  name?: string
  itemType?: 'weapon' | 'armor' | 'shield' | 'tool' | 'gear' | 'consumable' | 'magicItem' | 'magicalItem' | 'accessory' | 'ammunition'
  type?: string
  equipped: boolean
  attuned?: boolean
  quantity: number
  weight?: number
  description?: string
  slot?: string
  weaponData?: {
    damage: string
    damageType: string
    attackAbility: AbilityKey | 'spellcasting'
    range?: string
    properties?: string[]
    isFinesse?: boolean
    isRanged?: boolean
    proficient?: boolean
    actionType?: ActivationType
    miscBonus?: number
  }
  actionData?: ItemActionData
}

export interface ItemTemplate {
  id: string
  name: string
  type: string
  description?: string
  damage?: {
    dice?: string
    type?: string
    types?: string[]
    bonus?: number
  } | null
  properties?: string[]
  modifiers?: Array<{ target: string, value: number | string }>
  range?: string
  actionData?: ItemActionData
}

export interface ItemActionData {
  name: string
  activationType: ActivationType
  description?: string
  attackBonus?: number
  damage?: string
  damageType?: string
  saveDc?: number
  saveAbility?: AbilityKey
  uses?: number
  usesRemaining?: number
  rechargeType?: RechargeType
}

export interface CharacterSpell {
  id?: string
  name: string
  level: number
  castingTime: string
  activationType?: ActivationType | 'other'
  range?: string
  components?: string
  duration?: string
  concentration?: boolean
  ritual?: boolean
  prepared?: boolean
  known?: boolean
  requiresAttackRoll?: boolean
  requiresSavingThrow?: boolean
  description?: string
  notes?: string
  attackBonus?: number
  saveDc?: number
  saveAbility?: AbilityKey
  damage?: string
  damageType?: string
  healing?: string
}

export interface CharacterFeature {
  id?: string
  name: string
  source?: 'race' | 'class' | 'background' | 'feat' | 'other' | string
  category?: string
  activationType?: ActivationType | 'passive'
  description?: string
  uses?: number | string
  usesRemaining?: number | string
  rechargeType?: RechargeType | string
}

export interface DndCharacter {
  id?: string | number
  basic?: {
    characterName?: string
    level?: number
  }
  abilities: Record<AbilityKey, { score: number }>
  core: {
    proficiencyBonus: number
  }
  spellcasting?: {
    ability?: AbilityKey
    spellcastingMode?: 'prepared' | 'known' | 'pactMagic' | 'custom'
    spellSaveDc?: number
    spellAttackBonus?: number
    spells?: CharacterSpell[]
  }
  equipment: {
    items: EquipmentItem[]
  }
  features?: Record<string, CharacterFeature[]>
  customCombatOptions?: CombatOption[]
  combatLog?: CombatLogEntry[]
  spells?: CharacterSpell[]
}

interface CombatSectionProps {
  character: DndCharacter
  itemTemplates?: ItemTemplate[]
  onChange: (character: DndCharacter) => void
}

const ACTION_LABELS: Record<ActivationType, string> = {
  action: 'Action',
  bonusAction: 'Bonus Action',
  reaction: 'Reaction',
}

const TYPE_LABELS: Record<CombatOptionType, string> = {
  weaponAttack: 'Attack',
  spell: 'Spell',
  itemAction: 'Item',
  feature: 'Feature',
  custom: 'Custom',
}

const SAVE_ABILITIES: Array<{ value: AbilityKey, label: string }> = [
  { value: 'strength', label: 'STR' },
  { value: 'dexterity', label: 'DEX' },
  { value: 'constitution', label: 'CON' },
  { value: 'intelligence', label: 'INT' },
  { value: 'wisdom', label: 'WIS' },
  { value: 'charisma', label: 'CHA' },
]

const CUSTOM_TYPES: Array<{ value: CombatOptionType, label: string }> = [
  { value: 'weaponAttack', label: 'Attack' },
  { value: 'spell', label: 'Spell-like' },
  { value: 'feature', label: 'Feature' },
  { value: 'itemAction', label: 'Item Action' },
  { value: 'custom', label: 'Other' },
]

const RECHARGE_TYPES: Array<{ value: RechargeType, label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'shortRest', label: 'Short Rest' },
  { value: 'longRest', label: 'Long Rest' },
  { value: 'turn', label: 'Turn' },
  { value: 'custom', label: 'Custom' },
]

const randomId = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
const numberOrUndefined = (value: string) => (value === '' ? undefined : Number(value) || 0)
const abilityModifier = (score: number) => Math.floor(((Number(score) || 10) - 10) / 2)
const formatBonus = (value?: number) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0)}`
const normalizeText = (value?: string) => String(value || '').trim().toLowerCase()
const templateMapCache = new WeakMap<ItemTemplate[], Record<string, ItemTemplate>>()

const getTemplatesById = (itemTemplates: ItemTemplate[] = []) => {
  const cached = templateMapCache.get(itemTemplates)
  if (cached) return cached
  const templatesById = Object.fromEntries(itemTemplates.map((template) => [template.id, template]))
  templateMapCache.set(itemTemplates, templatesById)
  return templatesById
}

const getItemTemplate = (item: EquipmentItem, itemTemplates: ItemTemplate[] = []) => (
  item.itemTemplateId ? getTemplatesById(itemTemplates)[item.itemTemplateId] : undefined
)

const getWeaponName = (item: EquipmentItem, itemTemplates: ItemTemplate[] = []) => (
  item.name || getItemTemplate(item, itemTemplates)?.name || 'Weapon'
)

const getItemType = (item: EquipmentItem, itemTemplates: ItemTemplate[] = []) => (
  item.itemType || item.type || getItemTemplate(item, itemTemplates)?.type || ''
)

const getWeaponDamageType = (item: EquipmentItem, itemTemplates: ItemTemplate[] = []) => {
  const template = getItemTemplate(item, itemTemplates)
  const templateTypes = template?.damage?.types
  if (item.weaponData?.damageType) return item.weaponData.damageType
  if (Array.isArray(templateTypes) && templateTypes.length > 0) return templateTypes.join(', ')
  return template?.damage?.type || ''
}

const getModifierValue = (template: ItemTemplate | undefined, target: string) => (
  template?.modifiers?.reduce((total, modifier) => (
    modifier.target === target ? total + (Number(modifier.value) || 0) : total
  ), 0) || 0
)

const getWeaponAbilityKey = (character: DndCharacter, weapon: EquipmentItem, itemTemplates: ItemTemplate[] = []): AbilityKey => {
  const template = getItemTemplate(weapon, itemTemplates)
  const weaponData = weapon.weaponData
  if (weaponData?.attackAbility && weaponData.attackAbility !== 'spellcasting') return weaponData.attackAbility
  if (weaponData?.attackAbility === 'spellcasting') return character.spellcasting?.ability || 'intelligence'

  const properties = new Set((weaponData?.properties || template?.properties || []).map((property) => normalizeText(property)))
  const isRanged = Boolean(weaponData?.isRanged || template?.range?.includes('/'))
  const isFinesse = Boolean(weaponData?.isFinesse || properties.has('finesse'))
  if (isFinesse) {
    return abilityModifier(character.abilities.dexterity.score) > abilityModifier(character.abilities.strength.score)
      ? 'dexterity'
      : 'strength'
  }
  return isRanged ? 'dexterity' : 'strength'
}

export function getEquippedWeapons(character: DndCharacter, itemTemplates: ItemTemplate[] = []): EquipmentItem[] {
  return (character.equipment?.items || []).filter((item) => (
    item.equipped && getItemType(item, itemTemplates) === 'weapon'
  ))
}

export function getActivationTypeFromSpell(spell: CharacterSpell): ActivationType | null {
  const castingTime = normalizeText(spell.castingTime)
  if (castingTime === '1 action' || castingTime === 'action') return 'action'
  if (castingTime === '1 bonus action' || castingTime === 'bonus action') return 'bonusAction'
  if (castingTime === '1 reaction' || castingTime === 'reaction') return 'reaction'
  return null
}

export function getWeaponAttackBonus(character: DndCharacter, weapon: EquipmentItem, itemTemplates: ItemTemplate[] = []): number {
  const template = getItemTemplate(weapon, itemTemplates)
  const abilityKey = getWeaponAbilityKey(character, weapon, itemTemplates)
  const proficient = weapon.weaponData?.proficient ?? true
  return abilityModifier(character.abilities[abilityKey].score)
    + (proficient ? Number(character.core.proficiencyBonus) || 0 : 0)
    + (Number(weapon.weaponData?.miscBonus) || 0)
    + getModifierValue(template, 'weaponAttack')
}

export function getWeaponDamageDisplay(character: DndCharacter, weapon: EquipmentItem, itemTemplates: ItemTemplate[] = []): string {
  const template = getItemTemplate(weapon, itemTemplates)
  const abilityKey = getWeaponAbilityKey(character, weapon, itemTemplates)
  const abilityBonus = abilityModifier(character.abilities[abilityKey].score)
  const damageBonus = abilityBonus + getModifierValue(template, 'weaponDamage') + (Number(template?.damage?.bonus) || 0)
  const dice = weapon.weaponData?.damage || template?.damage?.dice || ''
  const damageType = getWeaponDamageType(weapon, itemTemplates)
  return [dice, formatBonus(damageBonus), damageType].filter(Boolean).join(' ')
}

const featureSourceFromCategory = (category: string) => {
  if (category === 'raceTraits') return 'race'
  if (category === 'classFeatures') return 'class'
  if (category === 'backgroundFeature') return 'background'
  if (category === 'feats') return 'feat'
  return 'other'
}

const spellIsCombatReady = (spell: CharacterSpell) => (
  Number(spell.level) === 0 || spell.prepared || spell.known
)

export function getCombatOptions(character: DndCharacter, itemTemplates: ItemTemplate[] = []): CombatOption[] {
  const equippedWeapons = getEquippedWeapons(character, itemTemplates)
  const weaponAttacks = equippedWeapons.map((weapon): CombatOption => ({
    id: `weapon-${weapon.id}`,
    name: getWeaponName(weapon, itemTemplates),
    type: 'weaponAttack',
    activationType: weapon.weaponData?.actionType || 'action',
    source: 'Equipped weapon',
    description: weapon.description || getItemTemplate(weapon, itemTemplates)?.description,
    attackBonus: getWeaponAttackBonus(character, weapon, itemTemplates),
    damage: getWeaponDamageDisplay(character, weapon, itemTemplates),
    damageType: getWeaponDamageType(weapon, itemTemplates),
    range: weapon.weaponData?.range || getItemTemplate(weapon, itemTemplates)?.range,
    selectedWeaponIds: [weapon.id],
  }))

  const itemActions = (character.equipment?.items || []).flatMap((item): CombatOption[] => {
    if (!item.equipped) return []
    const template = getItemTemplate(item, itemTemplates)
    const actionData = item.actionData || template?.actionData
    if (!actionData) return []
    return [{
      id: `item-${item.id}`,
      name: actionData.name,
      type: 'itemAction',
      activationType: actionData.activationType,
      source: getWeaponName(item, itemTemplates),
      description: actionData.description,
      attackBonus: actionData.attackBonus,
      damage: actionData.damage,
      damageType: actionData.damageType,
      range: template?.range,
      saveDc: actionData.saveDc,
      saveAbility: actionData.saveAbility,
      uses: actionData.uses,
      usesRemaining: actionData.usesRemaining,
      rechargeType: actionData.rechargeType || 'none',
    }]
  })

  const sourceSpells = character.spells?.length ? character.spells : character.spellcasting?.spells || []
  const spellOptions = sourceSpells.flatMap((spell, index): CombatOption[] => {
    const explicitActivation = ['action', 'bonusAction', 'reaction'].includes(String(spell.activationType))
      ? spell.activationType as ActivationType
      : null
    const activationType = explicitActivation || getActivationTypeFromSpell(spell)
    const isReady = spellIsCombatReady(spell) || character.spellcasting?.spellcastingMode === 'custom'
    if (!activationType || !isReady || !spell.name) return []
    return [{
      id: `spell-${spell.id || index}`,
      name: spell.name,
      type: 'spell',
      activationType,
      source: `${Number(spell.level) === 0 ? 'Cantrip' : `Level ${spell.level}`} spell`,
      description: [
        spell.description || spell.notes,
        spell.concentration ? 'Concentration' : '',
        spell.ritual ? 'Ritual' : '',
        spell.components ? `Components: ${spell.components}` : '',
      ].filter(Boolean).join(' | '),
      attackBonus: spell.requiresAttackRoll ? spell.attackBonus ?? character.spellcasting?.spellAttackBonus : undefined,
      damage: spell.damage || spell.healing,
      damageType: spell.damageType,
      range: spell.range,
      saveDc: spell.requiresSavingThrow ? spell.saveDc ?? character.spellcasting?.spellSaveDc : undefined,
      saveAbility: spell.saveAbility,
    }]
  })

  const featureOptions = Object.entries(character.features || {}).flatMap(([category, features]) => (
    (features || []).flatMap((feature, index): CombatOption[] => {
      if (!feature.name || !['action', 'bonusAction', 'reaction'].includes(String(feature.activationType))) return []
      return [{
        id: `feature-${category}-${feature.id || index}`,
        name: feature.name,
        type: 'feature',
        activationType: feature.activationType as ActivationType,
        source: String(feature.source || featureSourceFromCategory(category)),
        description: feature.description,
        uses: feature.uses === '' || feature.uses === undefined ? undefined : Number(feature.uses) || 0,
        usesRemaining: feature.usesRemaining === '' || feature.usesRemaining === undefined ? undefined : Number(feature.usesRemaining) || 0,
        rechargeType: (feature.rechargeType as RechargeType) || 'none',
      }]
    })
  ))

  return [
    ...weaponAttacks,
    ...itemActions,
    ...spellOptions,
    ...featureOptions,
    ...(character.customCombatOptions || []),
  ]
}

export function filterCombatOptionsByActivation(options: CombatOption[], activationType: ActivationType): CombatOption[] {
  return options.filter((option) => option.activationType === activationType)
}

export function useCombatOption(character: DndCharacter, optionId: string): DndCharacter {
  const option = getCombatOptions(character).find((item) => item.id === optionId)
  if (!option) return character
  const customCombatOptions = (character.customCombatOptions || []).map((item) => (
    item.id === optionId && item.usesRemaining !== undefined
      ? { ...item, usesRemaining: Math.max(0, Number(item.usesRemaining) - 1) }
      : item
  ))
  const nextLogEntry: CombatLogEntry = {
    id: randomId(),
    characterId: String(character.id || character.basic?.characterName || 'character'),
    optionId: option.id,
    optionName: option.name,
    activationType: option.activationType,
    timestamp: new Date().toISOString(),
  }
  return {
    ...character,
    customCombatOptions,
    combatLog: [...(character.combatLog || []), nextLogEntry],
  }
}

function EquippedWeaponMultiSelect({
  character,
  itemTemplates = [],
  selectedWeaponIds,
  onChange,
}: {
  character: DndCharacter
  itemTemplates?: ItemTemplate[]
  selectedWeaponIds: string[]
  onChange: (selectedWeaponIds: string[]) => void
}) {
  const equippedWeapons = getEquippedWeapons(character, itemTemplates)
  const selectedNames = equippedWeapons
    .filter((weapon) => selectedWeaponIds.includes(weapon.id))
    .map((weapon) => getWeaponName(weapon, itemTemplates))

  if (equippedWeapons.length === 0) {
    return <p className="combat-empty-inline">No equipped weapons available</p>
  }

  return (
    <details className="combat-weapon-select">
      <summary>
        <span>Equipped Weapons</span>
        <strong>{selectedNames.length ? selectedNames.join(', ') : 'None selected'}</strong>
      </summary>
      <div>
        {equippedWeapons.map((weapon) => (
          <label key={weapon.id}>
            <input
              type="checkbox"
              checked={selectedWeaponIds.includes(weapon.id)}
              onChange={(event) => {
                onChange(event.target.checked
                  ? [...selectedWeaponIds, weapon.id]
                  : selectedWeaponIds.filter((weaponId) => weaponId !== weapon.id))
              }}
            />
            <span>{getWeaponName(weapon, itemTemplates)}</span>
          </label>
        ))}
      </div>
    </details>
  )
}

function CombatOptionCard({
  option,
  character,
  itemTemplates = [],
  onUse,
  onEdit,
  onDelete,
}: {
  option: CombatOption
  character: DndCharacter
  itemTemplates?: ItemTemplate[]
  onUse: (option: CombatOption) => void
  onEdit?: (option: CombatOption) => void
  onDelete?: (optionId: string) => void
}) {
  const selectedWeaponNames = getEquippedWeapons(character, itemTemplates)
    .filter((weapon) => option.selectedWeaponIds?.includes(weapon.id))
    .map((weapon) => getWeaponName(weapon, itemTemplates))
  const hasUses = option.usesRemaining !== undefined
  const useDisabled = hasUses && Number(option.usesRemaining) <= 0

  return (
    <article className="combat-option-card">
      <header>
        <div>
          <h4>{option.name}</h4>
          <span>{option.source}</span>
        </div>
        <div className="combat-option-badges">
          <span>{TYPE_LABELS[option.type]}</span>
          <span>{ACTION_LABELS[option.activationType]}</span>
        </div>
      </header>

      <div className="combat-option-stats">
        {option.attackBonus !== undefined && <span>Attack {formatBonus(option.attackBonus)}</span>}
        {option.damage && <span>Damage {option.damage}{option.damageType && !option.damage.includes(option.damageType) ? ` ${option.damageType}` : ''}</span>}
        {option.range && <span>Range {option.range}</span>}
        {option.saveDc !== undefined && <span>Save DC {option.saveDc}{option.saveAbility ? ` ${option.saveAbility.toUpperCase()}` : ''}</span>}
        {option.uses !== undefined && <span>Uses {option.usesRemaining ?? option.uses}/{option.uses} {option.rechargeType && option.rechargeType !== 'none' ? option.rechargeType : ''}</span>}
      </div>

      {option.description && <p>{option.description}</p>}
      {selectedWeaponNames.length > 0 && (
        <div className="combat-selected-weapons">
          <span>Weapons</span>
          <strong>{selectedWeaponNames.join(', ')}</strong>
        </div>
      )}

      <footer>
        <button type="button" disabled={useDisabled} onClick={() => onUse(option)}>Use</button>
        {option.type === 'custom' || option.id.startsWith('custom-') ? (
          <>
            <button type="button" onClick={() => onEdit?.(option)}>Edit</button>
            <button type="button" onClick={() => onDelete?.(option.id)}>Delete</button>
          </>
        ) : null}
      </footer>
    </article>
  )
}

function CustomCombatOptionModal({
  character,
  itemTemplates = [],
  activationType,
  initialOption,
  onSave,
  onCancel,
}: {
  character: DndCharacter
  itemTemplates?: ItemTemplate[]
  activationType: ActivationType
  initialOption?: CombatOption | null
  onSave: (option: CombatOption) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<CombatOption>(() => initialOption || {
    id: `custom-${randomId()}`,
    name: '',
    type: 'custom',
    activationType,
    source: 'Custom',
    description: '',
    rechargeType: 'none',
    selectedWeaponIds: [],
  })

  const patch = (updates: Partial<CombatOption>) => setForm((prev) => ({ ...prev, ...updates }))

  return (
    <div className="combat-modal-backdrop" role="presentation">
      <section className="combat-custom-modal" aria-label="Custom combat option">
        <header>
          <div>
            <span>{ACTION_LABELS[activationType]}</span>
            <h3>{initialOption ? 'Edit Custom Ability' : 'Add Custom Ability'}</h3>
          </div>
          <button type="button" onClick={onCancel}>Close</button>
        </header>

        <div className="combat-form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(event) => patch({ name: event.target.value })} />
          </label>
          <label>
            <span>Type</span>
            <select value={form.type} onChange={(event) => patch({ type: event.target.value as CombatOptionType })}>
              {CUSTOM_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label>
            <span>Attack Bonus</span>
            <input type="number" value={form.attackBonus ?? ''} onChange={(event) => patch({ attackBonus: numberOrUndefined(event.target.value) })} />
          </label>
          <label>
            <span>Damage</span>
            <input value={form.damage || ''} onChange={(event) => patch({ damage: event.target.value })} />
          </label>
          <label>
            <span>Damage Type</span>
            <input value={form.damageType || ''} onChange={(event) => patch({ damageType: event.target.value })} />
          </label>
          <label>
            <span>Range</span>
            <input value={form.range || ''} onChange={(event) => patch({ range: event.target.value })} />
          </label>
          <label>
            <span>Save DC</span>
            <input type="number" value={form.saveDc ?? ''} onChange={(event) => patch({ saveDc: numberOrUndefined(event.target.value) })} />
          </label>
          <label>
            <span>Save Ability</span>
            <select value={form.saveAbility || ''} onChange={(event) => patch({ saveAbility: event.target.value ? event.target.value as AbilityKey : undefined })}>
              <option value="">None</option>
              {SAVE_ABILITIES.map((ability) => <option key={ability.value} value={ability.value}>{ability.label}</option>)}
            </select>
          </label>
          <label>
            <span>Uses</span>
            <input type="number" value={form.uses ?? ''} onChange={(event) => patch({ uses: numberOrUndefined(event.target.value) })} />
          </label>
          <label>
            <span>Uses Remaining</span>
            <input type="number" value={form.usesRemaining ?? ''} onChange={(event) => patch({ usesRemaining: numberOrUndefined(event.target.value) })} />
          </label>
          <label>
            <span>Recharge</span>
            <select value={form.rechargeType || 'none'} onChange={(event) => patch({ rechargeType: event.target.value as RechargeType })}>
              {RECHARGE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="combat-checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(form.requiresEquippedWeapon)}
              onChange={(event) => patch({ requiresEquippedWeapon: event.target.checked })}
            />
            <span>Requires Equipped Weapon</span>
          </label>
          {(form.requiresEquippedWeapon || form.type === 'weaponAttack') && (
            <EquippedWeaponMultiSelect
              character={character}
              itemTemplates={itemTemplates}
              selectedWeaponIds={form.selectedWeaponIds || []}
              onChange={(selectedWeaponIds) => patch({ selectedWeaponIds })}
            />
          )}
          <label className="combat-description-field">
            <span>Description</span>
            <textarea rows={4} value={form.description || ''} onChange={(event) => patch({ description: event.target.value })} />
          </label>
        </div>

        <footer>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            disabled={!form.name.trim()}
            onClick={() => onSave({ ...form, activationType, source: form.source || 'Custom' })}
          >
            Save
          </button>
        </footer>
      </section>
    </div>
  )
}

function CombatAccordionPanel({
  activationType,
  options,
  character,
  itemTemplates = [],
  defaultOpen,
  onUse,
  onAdd,
  onEdit,
  onDelete,
}: {
  activationType: ActivationType
  options: CombatOption[]
  character: DndCharacter
  itemTemplates?: ItemTemplate[]
  defaultOpen?: boolean
  onUse: (option: CombatOption) => void
  onAdd: (activationType: ActivationType) => void
  onEdit: (option: CombatOption) => void
  onDelete: (optionId: string) => void
}) {
  return (
    <details className="combat-accordion-panel" open={defaultOpen}>
      <summary>
        <div>
          <h3>{ACTION_LABELS[activationType]}</h3>
          <span>{options.length} option{options.length === 1 ? '' : 's'}</span>
        </div>
        <button type="button" onClick={(event) => { event.preventDefault(); onAdd(activationType) }}>Add</button>
      </summary>
      <div className="combat-option-list">
        {options.length > 0 ? options.map((option) => (
          <CombatOptionCard
            key={option.id}
            option={option}
            character={character}
            itemTemplates={itemTemplates}
            onUse={onUse}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )) : <p className="combat-empty-inline">No combat options for this timing.</p>}
      </div>
    </details>
  )
}

export function CombatSection({ character, itemTemplates = [], onChange }: CombatSectionProps) {
  const [editingOption, setEditingOption] = useState<CombatOption | null>(null)
  const [modalActivationType, setModalActivationType] = useState<ActivationType | null>(null)
  const options = useMemo(() => getCombatOptions(character, itemTemplates), [character, itemTemplates])

  const saveCustomOption = (option: CombatOption) => {
    const existing = character.customCombatOptions || []
    const nextOptions = existing.some((item) => item.id === option.id)
      ? existing.map((item) => (item.id === option.id ? option : item))
      : [...existing, option]
    onChange({ ...character, customCombatOptions: nextOptions })
    setEditingOption(null)
    setModalActivationType(null)
  }

  const useOption = (option: CombatOption) => {
    const weaponNames = getEquippedWeapons(character, itemTemplates)
      .filter((weapon) => option.selectedWeaponIds?.includes(weapon.id))
      .map((weapon) => getWeaponName(weapon, itemTemplates))
    const customCombatOptions = (character.customCombatOptions || []).map((item) => (
      item.id === option.id && item.usesRemaining !== undefined
        ? { ...item, usesRemaining: Math.max(0, Number(item.usesRemaining) - 1) }
        : item
    ))
    const logEntry: CombatLogEntry = {
      id: randomId(),
      characterId: String(character.id || character.basic?.characterName || 'character'),
      optionId: option.id,
      optionName: option.name,
      activationType: option.activationType,
      timestamp: new Date().toISOString(),
      selectedWeaponNames: weaponNames,
    }
    onChange({
      ...character,
      customCombatOptions,
      combatLog: [...(character.combatLog || []), logEntry],
    })
  }

  return (
    <section className="combat-section">
      <div className="combat-section-heading">
        <div>
          <h3>Combat Options</h3>
          <span>Actions, reactions, equipped weapons, spells, items, and active features</span>
        </div>
      </div>

      {(['action', 'bonusAction', 'reaction'] as ActivationType[]).map((activationType) => (
        <CombatAccordionPanel
          key={activationType}
          activationType={activationType}
          options={filterCombatOptionsByActivation(options, activationType)}
          character={character}
          itemTemplates={itemTemplates}
          defaultOpen={activationType === 'action'}
          onUse={useOption}
          onAdd={(nextActivationType) => {
            setEditingOption(null)
            setModalActivationType(nextActivationType)
          }}
          onEdit={(option) => {
            setEditingOption(option)
            setModalActivationType(option.activationType)
          }}
          onDelete={(optionId) => onChange({
            ...character,
            customCombatOptions: (character.customCombatOptions || []).filter((option) => option.id !== optionId),
          })}
        />
      ))}

      {modalActivationType && (
        <CustomCombatOptionModal
          character={character}
          itemTemplates={itemTemplates}
          activationType={modalActivationType}
          initialOption={editingOption}
          onSave={saveCustomOption}
          onCancel={() => {
            setEditingOption(null)
            setModalActivationType(null)
          }}
        />
      )}
    </section>
  )
}

export {
  CombatAccordionPanel,
  CombatOptionCard,
  CustomCombatOptionModal,
  EquippedWeaponMultiSelect,
}

export default CombatSection
