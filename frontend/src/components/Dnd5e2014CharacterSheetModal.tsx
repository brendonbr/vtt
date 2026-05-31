import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Dices, ImagePlus, X } from 'lucide-react'
import {
  EQUIPMENT_SLOTS,
  ITEM_TEMPLATES,
  calculateEquipmentSummary,
  createInventoryItem,
  formatDamageTypes,
  itemWeight,
  normalizeItemTemplate,
  normalizeInventoryItem,
  templateMap,
} from '../data/dnd5e2014Items.js'
import CombatSection from './CombatSection'
import SpellcastingSection, { createPactMagicSlots, createSpellSlots, createSpellcastingSettings } from './SpellcastingSection'
import { API_BASE } from './vtt/vttConfig'
export const ABILITIES = [
  { id: 'strength', label: 'Strength', short: 'STR' },
  { id: 'dexterity', label: 'Dexterity', short: 'DEX' },
  { id: 'constitution', label: 'Constitution', short: 'CON' },
  { id: 'intelligence', label: 'Intelligence', short: 'INT' },
  { id: 'wisdom', label: 'Wisdom', short: 'WIS' },
  { id: 'charisma', label: 'Charisma', short: 'CHA' },
]

export const SKILLS = [
  { id: 'acrobatics', label: 'Acrobatics', ability: 'dexterity' },
  { id: 'animalHandling', label: 'Animal Handling', ability: 'wisdom' },
  { id: 'arcana', label: 'Arcana', ability: 'intelligence' },
  { id: 'athletics', label: 'Athletics', ability: 'strength' },
  { id: 'deception', label: 'Deception', ability: 'charisma' },
  { id: 'history', label: 'History', ability: 'intelligence' },
  { id: 'insight', label: 'Insight', ability: 'wisdom' },
  { id: 'intimidation', label: 'Intimidation', ability: 'charisma' },
  { id: 'investigation', label: 'Investigation', ability: 'intelligence' },
  { id: 'medicine', label: 'Medicine', ability: 'wisdom' },
  { id: 'nature', label: 'Nature', ability: 'intelligence' },
  { id: 'perception', label: 'Perception', ability: 'wisdom' },
  { id: 'performance', label: 'Performance', ability: 'charisma' },
  { id: 'persuasion', label: 'Persuasion', ability: 'charisma' },
  { id: 'religion', label: 'Religion', ability: 'intelligence' },
  { id: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dexterity' },
  { id: 'stealth', label: 'Stealth', ability: 'dexterity' },
  { id: 'survival', label: 'Survival', ability: 'wisdom' },
]

const TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'combat', label: 'Combat' },
  { id: 'spells', label: 'Spells' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'features', label: 'Features' },
  { id: 'story', label: 'Story' },
  { id: 'notes', label: 'Notes' },
]

const PASSIVE_SCORE_OPTIONS = [
  { value: 'passivePerception', label: 'Perception' },
  { value: 'passiveInvestigation', label: 'Investigation' },
  { value: 'passiveInsight', label: 'Insight' },
]

export const abilityModifier = (score) => Math.floor(((Number(score) || 0) - 10) / 2)

export const proficiencyBonusByLevel = (level) => {
  const value = Number(level) || 1
  if (value >= 17) return 6
  if (value >= 13) return 5
  if (value >= 9) return 4
  if (value >= 5) return 3
  return 2
}

export const savingThrowBonus = (ability, proficiencyBonus) => (
  abilityModifier(ability.score) + (ability.saveProficient ? proficiencyBonus : 0)
)

export const skillTotal = (skill, abilityScore, proficiencyBonus) => (
  abilityModifier(abilityScore)
  + (skill.proficient ? proficiencyBonus : 0)
  + (skill.expertise ? proficiencyBonus : 0)
  + (Number(skill.miscBonus) || 0)
)

export const spellSaveDc = (proficiencyBonus, spellAbilityScore) => (
  8 + proficiencyBonus + abilityModifier(spellAbilityScore)
)

export const spellAttackBonus = (proficiencyBonus, spellAbilityScore) => (
  proficiencyBonus + abilityModifier(spellAbilityScore)
)

const formatBonus = (value) => (Number(value) > 0 ? `+${value}` : `${value}`)
const DAMAGE_TYPE_OPTIONS = ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder']
const PROPERTY_OPTIONS = [
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'magical',
  'reach',
  'special',
  'thrown',
  'two-handed',
  'versatile',
  'silvered',
  'stealth disadvantage',
]
const MODIFIER_OPTIONS = [
  { value: 'armorClass', label: 'Armor Class' },
  { value: 'weaponDamage', label: 'Weapon Damage' },
  { value: 'spellAttack', label: 'Spell Attack' },
  { value: 'spellSaveDc', label: 'Spell Save DC' },
  { value: 'speed', label: 'Speed' },
  { value: 'savingThrows', label: 'Saving Throws' },
]
const DEFENSIVE_ITEM_TYPES = ['armor', 'shield']
const normalizeEquipmentSlot = (slot) => {
  if (slot === 'mainHand' || slot === 'offHand') return 'weapon'
  if (slot === 'carried') return 'gear'
  return slot
}
const parseOptionList = (value) => String(value || '')
  .split(/[\n,]/)
  .map((item) => item.trim())
  .filter(Boolean)
const formatOptionList = (items) => (items || []).join('\n')
const customItemModifierRows = (value) => String(value || '').split('\n').map((line) => {
  const [target, rawValue] = line.split(':').map((part) => part.trim())
  return target ? { target, value: Number(rawValue) || rawValue || 0 } : null
}).filter(Boolean)
const modifierValue = (modifiers, target) => modifiers?.find((modifier) => modifier.target === target)?.value || 0
const modifierRowsWithout = (modifiers, targets) => modifiers
  ?.filter((modifier) => !targets.includes(modifier.target))
  .map((modifier) => `${modifier.target}: ${modifier.value}`)
  .join('\n') || ''
const formatModifierRows = (modifiers) => modifiers.map((modifier) => `${modifier.target}: ${modifier.value}`).join('\n')

const emptyAttack = () => ({
  name: '',
  attackBonus: '',
  damage: '',
  damageType: '',
  range: '',
  ammunition: '',
  notes: '',
})

const emptySpell = () => ({
  name: '',
  level: 0,
  school: '',
  castingTime: '',
  range: '',
  components: '',
  duration: '',
  concentration: false,
  ritual: false,
  prepared: false,
  notes: '',
})

const emptyEquipment = () => ({
  ...createInventoryItem(),
})

const emptyCustomItemForm = () => ({
  name: '',
  type: 'weapon',
  description: '',
  damageDice: '',
  damageTypes: '',
  damageBonus: 0,
  attackBonus: 0,
  armorBaseAc: '',
  shieldAcBonus: '',
  dexterityLimit: '',
  properties: '',
  rarity: 'Common',
  weight: 0,
  cost: '',
  requiresAttunement: false,
  image: '',
  modifiers: '',
  effects: '',
})

const emptyFeature = (category = 'otherTraits') => ({
  category,
  name: '',
  source: '',
  description: '',
  uses: '',
  usesRemaining: '',
  rechargeType: '',
})

const buildAbilities = () => Object.fromEntries(
  ABILITIES.map((ability) => [ability.id, { score: 10, saveProficient: false }]),
)

const buildSkills = () => Object.fromEntries(
  SKILLS.map((skill) => [
    skill.id,
    {
      ability: skill.ability,
      proficient: false,
      expertise: false,
      miscBonus: 0,
    },
  ]),
)

const buildSpellSlots = () => Object.fromEntries(
  Array.from({ length: 9 }, (_, index) => [index + 1, { total: 0, expended: 0 }]),
)

export const createEmptyDnd5e2014Character = () => ({
  basic: {
    characterName: '',
    imageUrl: '',
    className: '',
    subclass: '',
    level: 1,
    race: '',
    subrace: '',
    background: '',
    alignment: '',
    experiencePoints: 0,
    deity: '',
    faction: '',
    campaignName: '',
  },
  abilities: buildAbilities(),
  core: {
    proficiencyBonus: 2,
    armorClass: 10,
    initiative: 0,
    initiativeOverride: false,
    speed: 30,
    passivePerception: 10,
    passiveInvestigation: 10,
    passiveInsight: 10,
    inspiration: false,
    hitPointMaximum: 1,
    currentHitPoints: 1,
    temporaryHitPoints: 0,
    hitDiceTotal: '',
    hitDiceRemaining: '',
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
  },
  skills: buildSkills(),
  attacks: [emptyAttack()],
  spellcasting: {
    ...createSpellcastingSettings(),
    className: '',
    ability: 'intelligence',
    spellSaveDc: 10,
    spellAttackBonus: 2,
    cantripsKnown: 0,
    preparedSpells: 0,
    knownSpells: 0,
    slots: buildSpellSlots(),
    spells: [emptySpell()],
  },
  spellSlots: createSpellSlots(),
  pactMagicSlots: createPactMagicSlots(),
  spells: [],
  equipment: {
    items: [emptyEquipment()],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
  },
  proficiencies: {
    armor: '',
    weapons: '',
    tools: '',
    languages: '',
    other: '',
  },
  features: {
    raceTraits: [emptyFeature('raceTraits')],
    classFeatures: [emptyFeature('classFeatures')],
    backgroundFeature: [emptyFeature('backgroundFeature')],
    feats: [emptyFeature('feats')],
    otherTraits: [emptyFeature('otherTraits')],
  },
  story: {
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    alliesAndOrganizations: '',
    appearance: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
  },
  notes: {
    treasure: '',
    characterNotes: '',
    campaignNotes: '',
    privateNotes: '',
  },
  customCombatOptions: [],
  combatLog: [],
  spellCombatLog: [],
})

/**
 * @typedef {ReturnType<typeof createEmptyDnd5e2014Character>} Dnd5e2014CharacterData
 *
 * @typedef {Object} Dnd5e2014CharacterSheetModalProps
 * @property {boolean} isOpen
 * @property {Dnd5e2014CharacterData=} initialCharacter
 * @property {(character: Dnd5e2014CharacterData, options?: { autoSave?: boolean }) => void | Promise<void>} onSave
 * @property {(roll: { skill: string, totalBonus: number, characterName: string }) => void | Promise<void>} [onRollSkill]
 * @property {(characterName: string) => { roll: number } | void | Promise<{ roll: number } | void>} [onRollDeathSave]
 * @property {number=} campaignId
 * @property {() => void} onCancel
 */

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))

const deepClone = (value) => JSON.parse(JSON.stringify(value))

const mergeCharacter = (initialCharacter) => ({
  ...createEmptyDnd5e2014Character(),
  ...initialCharacter,
  basic: { ...createEmptyDnd5e2014Character().basic, ...initialCharacter?.basic },
  abilities: { ...buildAbilities(), ...initialCharacter?.abilities },
  core: { ...createEmptyDnd5e2014Character().core, ...initialCharacter?.core },
  skills: { ...buildSkills(), ...initialCharacter?.skills },
  spellcasting: {
    ...createEmptyDnd5e2014Character().spellcasting,
    ...initialCharacter?.spellcasting,
    slots: { ...buildSpellSlots(), ...initialCharacter?.spellcasting?.slots },
  },
  spellSlots: initialCharacter?.spellSlots || createSpellSlots().map((slot) => ({
    ...slot,
    ...initialCharacter?.spellcasting?.slots?.[slot.level],
  })),
  pactMagicSlots: { ...createPactMagicSlots(), ...initialCharacter?.pactMagicSlots },
  spells: initialCharacter?.spells || initialCharacter?.spellcasting?.spells || [],
  equipment: {
    ...createEmptyDnd5e2014Character().equipment,
    ...initialCharacter?.equipment,
    items: (initialCharacter?.equipment?.items?.length
      ? initialCharacter.equipment.items
      : createEmptyDnd5e2014Character().equipment.items
    ).map((item) => normalizeInventoryItem(item)),
    currency: {
      ...createEmptyDnd5e2014Character().equipment.currency,
      ...initialCharacter?.equipment?.currency,
    },
  },
  proficiencies: { ...createEmptyDnd5e2014Character().proficiencies, ...initialCharacter?.proficiencies },
  features: { ...createEmptyDnd5e2014Character().features, ...initialCharacter?.features },
  story: { ...createEmptyDnd5e2014Character().story, ...initialCharacter?.story },
  notes: { ...createEmptyDnd5e2014Character().notes, ...initialCharacter?.notes },
  customCombatOptions: initialCharacter?.customCombatOptions || [],
  combatLog: initialCharacter?.combatLog || [],
  spellCombatLog: initialCharacter?.spellCombatLog || [],
})

function Field({ label, children }: any) {
  return (
    <label className="dnd-modal-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function TextInput({ label, value, onChange, type = 'text', min, max, required = false }: any) {
  return (
    <Field label={label}>
      <input
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(event) => onChange(type === 'number' ? event.target.valueAsNumber : event.target.value)}
      />
    </Field>
  )
}

function TextArea({ label, value, onChange, rows = 4 }: any) {
  return (
    <Field label={label}>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

function CheckboxField({ label, checked, onChange }: any) {
  return (
    <label className="dnd-modal-checkbox">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function SelectInput({ label, value, onChange, options }: any) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </Field>
  )
}

function CheckboxDropdown({ label, summary, children }: any) {
  return (
    <details className="dnd-checkbox-dropdown">
      <summary>
        <span>{label}</span>
        <strong>{summary}</strong>
        <ChevronDown size={16} />
      </summary>
      <div className="dnd-checkbox-dropdown-menu">
        {children}
      </div>
    </details>
  )
}

function SlotPicker({ label, value, onChange, options }: any) {
  const selected = options.find((option) => option.value === value) || options[0]

  return (
    <Field label={label}>
      <details className="dnd-slot-picker">
        <summary>
          <strong>{selected?.label || 'Select Slot'}</strong>
          <ChevronDown size={16} />
        </summary>
        <div className="dnd-slot-picker-menu">
          {options.map((option) => (
            <button
              className={option.value === value ? 'active' : ''}
              key={option.value}
              type="button"
              onClick={(event) => {
                onChange(option.value)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </details>
    </Field>
  )
}

function DynamicRows({ title, rows, createRow, onChange, renderRow }) {
  const updateRow = (index, patch) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }

  const removeRow = (index) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <section className="dnd-dynamic-section">
      <div className="dnd-dynamic-header">
        <h3>{title}</h3>
        <button type="button" onClick={() => onChange([...rows, createRow()])}>Add</button>
      </div>
      <div className="dnd-dynamic-list">
        {rows.map((row, index) => (
          <div className="dnd-dynamic-row" key={index}>
            {renderRow(row, (patch) => updateRow(index, patch), index)}
            <button className="dnd-row-remove" type="button" onClick={() => removeRow(index)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Full D&D 5e 2014 character sheet modal.
 *
 * Example:
 * const [open, setOpen] = useState(false)
 * <button onClick={() => setOpen(true)}>Create</button>
 * <Dnd5e2014CharacterSheetModal
 *   isOpen={open}
 *   onCancel={() => setOpen(false)}
 *   onSave={(character) => {
 *     console.log(character)
 *     setOpen(false)
 *   }}
 * />
 *
 * @param {Dnd5e2014CharacterSheetModalProps} props
 */
function Dnd5e2014CharacterSheetModal({ isOpen, initialCharacter, onSave, onCancel, onRollSkill, onRollDeathSave, onCombatMessage, campaignId, characterId }: any) {
  const [activeTab, setActiveTab] = useState('basic')
  const [character, setCharacter] = useState(() => mergeCharacter(initialCharacter))
  const [errors, setErrors] = useState([])
  const [itemTemplates, setItemTemplates] = useState(ITEM_TEMPLATES)
  const [customItemForm, setCustomItemForm] = useState(emptyCustomItemForm)
  const [editingCustomItemId, setEditingCustomItemId] = useState(null)
  const [showCustomItemBuilder, setShowCustomItemBuilder] = useState(false)
  const [showInventoryItemPicker, setShowInventoryItemPicker] = useState(false)
  const [selectedInventoryItemTemplateId, setSelectedInventoryItemTemplateId] = useState(ITEM_TEMPLATES[0]?.id || '')
  const [selectedPassiveScore, setSelectedPassiveScore] = useState(PASSIVE_SCORE_OPTIONS[0].value)
  const autoSaveReadyRef = useRef(false)
  const lastAutoSaveSnapshotRef = useRef('')
  const itemTemplatesById = useMemo(() => templateMap(itemTemplates), [itemTemplates])

  useEffect(() => {
    if (isOpen) {
      setCharacter(mergeCharacter(initialCharacter))
      setActiveTab('basic')
      setErrors([])
      setCustomItemForm(emptyCustomItemForm())
      setEditingCustomItemId(null)
      setShowCustomItemBuilder(false)
      setShowInventoryItemPicker(false)
      setSelectedInventoryItemTemplateId(ITEM_TEMPLATES[0]?.id || '')
      setSelectedPassiveScore(PASSIVE_SCORE_OPTIONS[0].value)
      autoSaveReadyRef.current = false
      lastAutoSaveSnapshotRef.current = JSON.stringify(mergeCharacter(initialCharacter))
    }
  }, [isOpen, initialCharacter])

  useEffect(() => {
    if (!isOpen) return
    const loadItemTemplates = async () => {
      if (!characterId) {
        setItemTemplates(ITEM_TEMPLATES)
        setCharacter((prev) => ({
          ...prev,
          equipment: {
            ...prev.equipment,
            items: prev.equipment.items.map((item) => normalizeInventoryItem(item, ITEM_TEMPLATES)),
          },
        }))
        return
      }
      try {
        const params = new URLSearchParams()
        if (campaignId) params.set('campaign_id', campaignId)
        params.set('character_id', characterId)
        const query = `?${params.toString()}`
        const response = await fetch(`${API_BASE}/api/item-templates/${query}`, { credentials: 'include' })
        if (!response.ok) return
        const templates = (await response.json()).map(normalizeItemTemplate)
        setItemTemplates(templates)
        setCharacter((prev) => ({
          ...prev,
          equipment: {
            ...prev.equipment,
            items: prev.equipment.items.map((item) => normalizeInventoryItem(item, templates)),
          },
        }))
      } catch {
        setItemTemplates(ITEM_TEMPLATES)
      }
    }
    loadItemTemplates()
  }, [campaignId, characterId, isOpen])

  const proficiencyBonus = useMemo(() => proficiencyBonusByLevel(character.basic.level), [character.basic.level])

  const computed = useMemo(() => {
    const skillTotals: Record<string, number> = {}
    SKILLS.forEach((skill) => {
      skillTotals[skill.id] = skillTotal(
        character.skills[skill.id],
        character.abilities[skill.ability].score,
        proficiencyBonus,
      )
    })

    const spellAbilityScore = character.abilities[character.spellcasting.ability]?.score || 10
    const equipmentSummary = calculateEquipmentSummary({
      inventory: character.equipment.items,
      abilities: character.abilities,
      proficiencyBonus,
      spellcastingAbility: character.spellcasting.ability,
      baseSpeed: character.core.speed,
      templates: itemTemplates,
    })

    return {
      skillTotals,
      passivePerception: 10 + skillTotals.perception,
      passiveInvestigation: 10 + skillTotals.investigation,
      passiveInsight: 10 + skillTotals.insight,
      initiative: abilityModifier(character.abilities.dexterity.score),
      spellSaveDc: spellSaveDc(proficiencyBonus, spellAbilityScore) + equipmentSummary.bonuses.spellSaveDc,
      spellAttackBonus: spellAttackBonus(proficiencyBonus, spellAbilityScore) + equipmentSummary.bonuses.spellAttack,
      equipment: equipmentSummary,
    }
  }, [character.abilities, character.core.speed, character.equipment.items, character.skills, character.spellcasting.ability, itemTemplates, proficiencyBonus])

  useEffect(() => {
    setCharacter((prev) => ({
      ...prev,
      core: {
        ...prev.core,
        proficiencyBonus,
        armorClass: computed.equipment.finalArmorClass,
        initiative: prev.core.initiativeOverride ? prev.core.initiative : computed.initiative,
        passivePerception: computed.passivePerception,
        passiveInvestigation: computed.passiveInvestigation,
        passiveInsight: computed.passiveInsight,
      },
      spellcasting: {
        ...prev.spellcasting,
        spellSaveDc: computed.spellSaveDc,
        spellAttackBonus: computed.spellAttackBonus,
      },
    }))
  }, [computed.equipment.finalArmorClass, computed.initiative, computed.passiveInsight, computed.passiveInvestigation, computed.passivePerception, computed.spellAttackBonus, computed.spellSaveDc, proficiencyBonus])

  const setSection = (section, patch) => {
    setCharacter((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }))
  }

  const setAbility = (abilityId, patch) => {
    setCharacter((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [abilityId]: { ...prev.abilities[abilityId], ...patch },
      },
    }))
  }

  const setSkill = (skillId, patch) => {
    setCharacter((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillId]: { ...prev.skills[skillId], ...patch },
      },
    }))
  }

  const setNested = (section, key, patch) => {
    setCharacter((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { ...prev[section][key], ...patch },
      },
    }))
  }

  const validate = () => {
    const nextErrors = []
    if (!character.basic.characterName.trim()) nextErrors.push('Character Name is required.')
    if (!character.basic.className.trim()) nextErrors.push('Class is required.')
    if (!character.basic.race.trim()) nextErrors.push('Race is required.')
    if (character.basic.level < 1 || character.basic.level > 20) nextErrors.push('Level must be between 1 and 20.')
    ABILITIES.forEach((ability) => {
      const score = Number(character.abilities[ability.id].score)
      if (score < 1 || score > 30) nextErrors.push(`${ability.label} score must be between 1 and 30.`)
    })
    if (character.core.hitPointMaximum < 0 || character.core.currentHitPoints < 0 || character.core.temporaryHitPoints < 0) {
      nextErrors.push('Hit points cannot be negative.')
    }
    if (character.core.currentHitPoints > character.core.hitPointMaximum) {
      nextErrors.push('Current HP cannot exceed maximum HP.')
    }
    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    await onSave(deepClone(character))
  }

  useEffect(() => {
    if (!isOpen || !characterId) return undefined

    const snapshot = JSON.stringify(character)
    if (!autoSaveReadyRef.current) {
      autoSaveReadyRef.current = true
      lastAutoSaveSnapshotRef.current = snapshot
      return undefined
    }
    if (snapshot === lastAutoSaveSnapshotRef.current) return undefined

    const timeoutId = window.setTimeout(async () => {
      if (!validate()) return
      lastAutoSaveSnapshotRef.current = snapshot
      await onSave(deepClone(character), { autoSave: true })
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [character, characterId, isOpen, onSave])

  if (!isOpen) return null

  const uploadCharacterImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrors(['Invalid image type. Use PNG, JPG, JPEG, or WEBP.'])
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setSection('basic', { imageUrl: reader.result })
    reader.readAsDataURL(file)
  }

  const rollDeathSave = async () => {
    const result = await onRollDeathSave?.(character.basic.characterName || 'Character')
    const roll = Number(result?.roll) || Math.floor(Math.random() * 20) + 1

    setCharacter((prev) => {
      const nextCore = { ...prev.core }
      if (roll === 1) {
        nextCore.deathSaveFailures = Math.min(3, Number(prev.core.deathSaveFailures || 0) + 2)
      } else if (roll >= 2 && roll <= 9) {
        nextCore.deathSaveFailures = Math.min(3, Number(prev.core.deathSaveFailures || 0) + 1)
      } else if (roll >= 10 && roll <= 19) {
        nextCore.deathSaveSuccesses = Math.min(3, Number(prev.core.deathSaveSuccesses || 0) + 1)
      } else if (roll === 20) {
        nextCore.currentHitPoints = 1
        nextCore.deathSaveSuccesses = 0
        nextCore.deathSaveFailures = 0
      }
      return { ...prev, core: nextCore }
    })
  }

  const renderBasic = () => (
    <div className="dnd-basic-stack">
      <label className="dnd-image-upload dnd-character-image-upload">
        <span>Character Image</span>
        <div>
          {character.basic.imageUrl ? <img src={character.basic.imageUrl} alt="" /> : <ImagePlus size={24} />}
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={uploadCharacterImage} />
        </div>
      </label>
      <div className="dnd-basic-key-fields">
        <TextInput label="Character Name" value={character.basic.characterName} required onChange={(value) => setSection('basic', { characterName: value })} />
        <TextInput label="Alignment" value={character.basic.alignment} onChange={(value) => setSection('basic', { alignment: value })} />
        <TextInput label="Level" type="number" min="1" max="20" value={character.basic.level} required onChange={(value) => setSection('basic', { level: clampNumber(value, 1, 20) })} />
        <TextInput label="Experience Points" value={character.basic.experiencePoints} onChange={(value) => setSection('basic', { experiencePoints: value })} />
      </div>
      <div className="dnd-modal-grid">
        <TextInput label="Class" value={character.basic.className} required onChange={(value) => setSection('basic', { className: value })} />
        <TextInput label="Subclass" value={character.basic.subclass} onChange={(value) => setSection('basic', { subclass: value })} />
        <TextInput label="Race" value={character.basic.race} required onChange={(value) => setSection('basic', { race: value })} />
        <TextInput label="Subrace" value={character.basic.subrace} onChange={(value) => setSection('basic', { subrace: value })} />
        <TextInput label="Background" value={character.basic.background} onChange={(value) => setSection('basic', { background: value })} />
        <TextInput label="Deity" value={character.basic.deity} onChange={(value) => setSection('basic', { deity: value })} />
        <TextInput label="Faction" value={character.basic.faction} onChange={(value) => setSection('basic', { faction: value })} />
      </div>
    </div>
  )

  const renderAbilities = () => (
    <div className="dnd-ability-grid">
      {ABILITIES.map((ability) => {
        const current = character.abilities[ability.id]
        const modifier = abilityModifier(current.score)
        const saveBonus = savingThrowBonus(current, proficiencyBonus)
        return (
          <section className="dnd-ability-card" key={ability.id}>
            <div className="dnd-ability-card-header">
              <span className="dnd-ability-short">{ability.short}</span>
              <div>
                <h3>{ability.label}</h3>
              </div>
            </div>

            <label className="dnd-ability-score-control">
              <span className="sr-only">{ability.label} Score</span>
              <input
                aria-label={`${ability.label} Score`}
                type="number"
                min="1"
                max="30"
                value={current.score}
                onChange={(event) => setAbility(ability.id, { score: clampNumber(event.target.value, 1, 30) })}
              />
            </label>

            <div className="dnd-ability-results">
              <div>
                <span>Modifier</span>
                <strong>{formatBonus(modifier)}</strong>
              </div>
              <div>
                <span>Save</span>
                <strong>{formatBonus(saveBonus)}</strong>
              </div>
            </div>

            <label className="dnd-ability-save-toggle">
              <input
                type="checkbox"
                checked={current.saveProficient}
                onChange={(event) => setAbility(ability.id, { saveProficient: event.target.checked })}
              />
              <span>Saving throw proficiency</span>
            </label>
          </section>
        )
      })}
    </div>
  )

  const renderCombat = () => (
    <div className="dnd-combat-panel">
      <section className="dnd-combat-stat-grid" aria-label="Combat stats">
        <label className="dnd-combat-stat-card">
          <span>Armor Class</span>
          <input type="number" value={character.core.armorClass} onChange={(event) => setSection('core', { armorClass: Number(event.target.value) || 0 })} />
        </label>
        <label className="dnd-combat-stat-card">
          <span>Initiative</span>
          <input type="number" value={character.core.initiative} onChange={(event) => setSection('core', { initiative: Number(event.target.value) || 0, initiativeOverride: true })} />
        </label>
        <label className="dnd-combat-stat-card">
          <span>Speed</span>
          <input type="number" value={character.core.speed} onChange={(event) => setSection('core', { speed: Number(event.target.value) || 0 })} />
        </label>
        <label className="dnd-combat-stat-card readonly">
          <span>Proficiency</span>
          <input type="number" value={character.core.proficiencyBonus} readOnly />
        </label>
        <label className="dnd-combat-stat-card dnd-combat-passive-card readonly">
          <span>Passive</span>
          <select value={selectedPassiveScore} onChange={(event) => setSelectedPassiveScore(event.target.value)}>
            {PASSIVE_SCORE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <strong>{character.core[selectedPassiveScore]}</strong>
        </label>
        <label className={`dnd-combat-inspiration ${character.core.inspiration ? 'active' : ''}`}>
          <input type="checkbox" checked={character.core.inspiration} onChange={(event) => setSection('core', { inspiration: event.target.checked })} />
          <span>Inspiration</span>
        </label>
      </section>

      <section className="dnd-combat-section">
        <div className="dnd-combat-section-heading">
          <h3>Hit Points</h3>
        </div>
        <div className="dnd-combat-hp-grid">
          <TextInput label="Maximum" type="number" min="0" value={character.core.hitPointMaximum} onChange={(value) => setSection('core', { hitPointMaximum: Math.max(0, Number(value) || 0) })} />
          <TextInput label="Current" type="number" min="0" value={character.core.currentHitPoints} onChange={(value) => setSection('core', { currentHitPoints: Math.max(0, Number(value) || 0) })} />
          <TextInput label="Temporary" type="number" min="0" value={character.core.temporaryHitPoints} onChange={(value) => setSection('core', { temporaryHitPoints: Math.max(0, Number(value) || 0) })} />
        </div>
      </section>

      <div className="dnd-combat-recovery-row">
        <section className="dnd-combat-section">
          <div className="dnd-combat-section-heading">
            <h3>Recovery</h3>
          </div>
          <div className="dnd-combat-recovery-grid">
            <TextInput label="Hit Dice Total" value={character.core.hitDiceTotal} onChange={(value) => setSection('core', { hitDiceTotal: value })} />
            <TextInput label="Hit Dice Remaining" value={character.core.hitDiceRemaining} onChange={(value) => setSection('core', { hitDiceRemaining: value })} />
          </div>
        </section>

        <section className="dnd-combat-section dnd-death-save-block">
          <div className="dnd-combat-section-heading">
            <h3>Death Saves</h3>
            <button
              className="dnd-death-save-roll"
              type="button"
              title="Roll Death Save"
              aria-label="Roll Death Save"
              onClick={rollDeathSave}
            >
              <Dices size={16} />
            </button>
          </div>
          <div className="dnd-death-save-grid">
            <div className="dnd-death-save-track">
              <span>Successes</span>
              <div>
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    className={character.core.deathSaveSuccesses >= value ? 'checked' : ''}
                    type="button"
                    aria-label={`${value} death save success${value > 1 ? 'es' : ''}`}
                    onClick={() => setSection('core', { deathSaveSuccesses: character.core.deathSaveSuccesses === value ? value - 1 : value })}
                  />
                ))}
              </div>
            </div>
            <div className="dnd-death-save-track failures">
              <span>Failures</span>
              <div>
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    className={character.core.deathSaveFailures >= value ? 'checked' : ''}
                    type="button"
                    aria-label={`${value} death save failure${value > 1 ? 's' : ''}`}
                    onClick={() => setSection('core', { deathSaveFailures: character.core.deathSaveFailures === value ? value - 1 : value })}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <CombatSection
        character={character}
        itemTemplates={itemTemplates}
        onChange={setCharacter}
        onCombatMessage={onCombatMessage}
      />
    </div>
  )

  const renderSkills = () => (
    <div className="dnd-skill-list">
      {SKILLS.map((skill) => {
        const current = character.skills[skill.id]
        const ability = ABILITIES.find((item) => item.id === skill.ability)
        const total = computed.skillTotals[skill.id]
        return (
          <section className="dnd-skill-card" key={skill.id}>
            <div className="dnd-skill-header">
              <div className="dnd-skill-title">
                <strong>{skill.label}</strong>
                <span>{ability?.label}</span>
              </div>
              <div className="dnd-skill-actions">
                <div className="dnd-skill-total">
                  <strong>{formatBonus(total)}</strong>
                  <span>Total</span>
                </div>
                <button
                  className="dnd-skill-roll"
                  type="button"
                  title={`Roll ${skill.label}`}
                  aria-label={`Roll ${skill.label}`}
                  onClick={() => onRollSkill?.({
                    skill: skill.label,
                    totalBonus: total,
                    characterName: character.basic.characterName || 'Character',
                  })}
                >
                  <Dices size={16} />
                </button>
              </div>
            </div>
            <div className="dnd-skill-controls">
              <label className={`dnd-skill-toggle ${current.proficient ? 'active' : ''}`}>
                <input type="checkbox" checked={current.proficient} onChange={(event) => setSkill(skill.id, { proficient: event.target.checked })} />
                <span>Prof</span>
              </label>
              <TextInput label="Misc" type="number" value={current.miscBonus} onChange={(value) => setSkill(skill.id, { miscBonus: Number(value) || 0 })} />
            </div>
          </section>
        )
      })}
    </div>
  )

  const renderAttacks = () => (
    <DynamicRows
      title="Attacks"
      rows={character.attacks}
      createRow={emptyAttack}
      onChange={(rows) => setCharacter((prev) => ({ ...prev, attacks: rows }))}
      renderRow={(row, update) => (
        <div className="dnd-modal-grid">
          <TextInput label="Name" value={row.name} onChange={(value) => update({ name: value })} />
          <TextInput label="Attack Bonus" value={row.attackBonus} onChange={(value) => update({ attackBonus: value })} />
          <TextInput label="Damage" value={row.damage} onChange={(value) => update({ damage: value })} />
          <TextInput label="Damage Type" value={row.damageType} onChange={(value) => update({ damageType: value })} />
          <TextInput label="Range" value={row.range} onChange={(value) => update({ range: value })} />
          <TextInput label="Ammunition" value={row.ammunition} onChange={(value) => update({ ammunition: value })} />
          <TextArea label="Notes" value={row.notes} onChange={(value) => update({ notes: value })} />
        </div>
      )}
    />
  )

  const renderSpells = () => (
    <SpellcastingSection character={character} onChange={setCharacter} />
  )

  const saveCustomItem = async () => {
    if (!characterId) {
      setErrors(['Save the character sheet before creating custom items for it.'])
      return
    }
    const damageTypes = parseOptionList(customItemForm.damageTypes)
    const isDefensiveItem = DEFENSIVE_ITEM_TYPES.includes(customItemForm.type)
    const invalidDamageTypes = damageTypes.filter((type) => !DAMAGE_TYPE_OPTIONS.includes(type))
    if (invalidDamageTypes.length > 0) {
      setErrors([`Invalid damage type: ${invalidDamageTypes.join(', ')}`])
      return
    }
    const modifiers = customItemModifierRows(customItemForm.modifiers)
    const attackBonus = Number(customItemForm.attackBonus) || 0
    if (attackBonus !== 0) {
      modifiers.push({ target: 'weaponAttack', value: attackBonus })
    }

    const payload = {
      campaign_id: campaignId || null,
      character_id: characterId,
      name: customItemForm.name,
      type: customItemForm.type,
      description: customItemForm.description,
      rarity: customItemForm.rarity,
      weight: Number(customItemForm.weight) || 0,
      cost: customItemForm.cost,
      image: customItemForm.image,
      requires_attunement: customItemForm.requiresAttunement,
      damage: {
        dice: customItemForm.damageDice,
        type: damageTypes[0] || '',
        types: damageTypes,
        bonus: Number(customItemForm.damageBonus) || 0,
      },
      armor_class: isDefensiveItem
        ? {
            base: customItemForm.type === 'armor' && customItemForm.armorBaseAc !== '' ? Number(customItemForm.armorBaseAc) || 0 : null,
            shieldBonus: customItemForm.type === 'shield' && customItemForm.shieldAcBonus !== '' ? Number(customItemForm.shieldAcBonus) || 0 : null,
            dexterity: customItemForm.type === 'armor' ? customItemForm.dexterityLimit : '',
          }
        : {},
      properties: parseOptionList(customItemForm.properties),
      modifiers,
      effects: customItemForm.effects.split('\n').map((item) => item.trim()).filter(Boolean),
    }

    try {
      const response = await fetch(`${API_BASE}/api/item-templates/${editingCustomItemId || ''}`, {
        method: editingCustomItemId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrors([data.detail || data.error || 'Item save failed'])
        return
      }
      const normalized = normalizeItemTemplate(data)
      setItemTemplates((prev) => editingCustomItemId
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [...prev, normalized])
      setCustomItemForm(emptyCustomItemForm())
      setEditingCustomItemId(null)
      setShowCustomItemBuilder(false)
    } catch (error) {
      setErrors([`Item save failed: ${error.message}`])
    }
  }

  const editCustomItem = (template) => {
    setEditingCustomItemId(template.id)
    setShowCustomItemBuilder(true)
    setCustomItemForm({
      name: template.name,
      type: template.type,
      description: template.description || '',
      damageDice: template.damage?.dice || '',
      damageTypes: formatOptionList(formatDamageTypes(template).split(', ').filter(Boolean)),
      damageBonus: template.damage?.bonus || 0,
      attackBonus: modifierValue(template.modifiers, 'weaponAttack'),
      armorBaseAc: template.armorClass?.base ?? '',
      shieldAcBonus: template.shieldBonus ?? template.armorClass?.shieldBonus ?? '',
      dexterityLimit: template.armorClass?.dexterity || '',
      properties: formatOptionList(template.properties),
      rarity: template.rarity || 'Common',
      weight: template.weight || 0,
      cost: template.cost || '',
      requiresAttunement: Boolean(template.requiresAttunement || template.attunement),
      image: template.image || '',
      modifiers: modifierRowsWithout(template.modifiers, ['weaponAttack']),
      effects: template.effects?.join('\n') || '',
    })
  }

  const deleteCustomItem = async (templateId) => {
    try {
      const response = await fetch(`${API_BASE}/api/item-templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json()
        setErrors([data.detail || data.error || 'Item delete failed'])
        return
      }
      setItemTemplates((prev) => prev.filter((item) => item.id !== templateId))
      setSection('equipment', { items: character.equipment.items.filter((item) => item.itemTemplateId !== templateId) })
    } catch (error) {
      setErrors([`Item delete failed: ${error.message}`])
    }
  }

  const renderEquipment = () => (
    (() => {
      const items = character.equipment.items
      const updateItem = (index, patch) => {
        setSection('equipment', {
          items: items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
        })
      }
      const updateItemEquipped = (index, checked) => {
        setSection('equipment', {
          items: items.map((item, itemIndex) => (itemIndex === index ? { ...item, equipped: checked } : item)),
        })
      }
      const removeItem = (index) => {
        setSection('equipment', { items: items.filter((_, itemIndex) => itemIndex !== index) })
      }
      const attunedCount = items.filter((item) => item.attuned).length
      const totalWeight = items.reduce((total, item) => total + itemWeight(item, itemTemplates), 0)
      const selectedInventoryTemplateId = itemTemplatesById[selectedInventoryItemTemplateId]
        ? selectedInventoryItemTemplateId
        : itemTemplates[0]?.id || ''
      const selectedDamageTypes = parseOptionList(customItemForm.damageTypes)
      const selectedProperties = parseOptionList(customItemForm.properties)
      const selectedModifiers = customItemModifierRows(customItemForm.modifiers)
      const selectedModifierTargets = selectedModifiers.map((modifier) => modifier.target)
      const toggleDamageType = (type, checked) => {
        const next = checked
          ? [...new Set([...selectedDamageTypes, type])]
          : selectedDamageTypes.filter((damageType) => damageType !== type)
        setCustomItemForm((prev) => ({ ...prev, damageTypes: formatOptionList(next) }))
      }
      const toggleProperty = (property, checked) => {
        const next = checked
          ? [...new Set([...selectedProperties, property])]
          : selectedProperties.filter((selectedProperty) => selectedProperty !== property)
        setCustomItemForm((prev) => ({ ...prev, properties: formatOptionList(next) }))
      }
      const toggleModifier = (target, checked) => {
        const next = checked
          ? [...selectedModifiers, { target, value: 1 }]
          : selectedModifiers.filter((modifier) => modifier.target !== target)
        setCustomItemForm((prev) => ({ ...prev, modifiers: formatModifierRows(next) }))
      }
      const setModifierValue = (target, value) => {
        const next = selectedModifiers.map((modifier) => (
          modifier.target === target ? { ...modifier, value: Number(value) || 0 } : modifier
        ))
        setCustomItemForm((prev) => ({ ...prev, modifiers: formatModifierRows(next) }))
      }
      const coins = [
        ['copper', 'CP'],
        ['silver', 'SP'],
        ['electrum', 'EP'],
        ['gold', 'GP'],
        ['platinum', 'PP'],
      ]
      const ammunitionItems = items
        .map((item) => ({ item, template: itemTemplatesById[item.itemTemplateId] }))
        .filter(({ template }) => template?.type === 'ammunition')
      const ammunitionOptions = [
        { value: '', label: 'Select ammunition' },
        ...ammunitionItems.map(({ item, template }) => ({
          value: item.id,
          label: `${template.name} (${Number(item.quantity) || 0})`,
        })),
      ]

      return (
        <div className="dnd-equipment-panel">
          <section className="dnd-equipment-inventory">
            <div className="dnd-equipment-section-heading">
              <div>
                <h3>Inventory</h3>
                <span>{items.length} entries</span>
              </div>
            </div>

            <div className="dnd-equipment-list">
              {items.map((row, index) => (
                <article className="dnd-equipment-card" key={index}>
                  {(() => {
                    const template = itemTemplatesById[row.itemTemplateId] || itemTemplates[0]
                    const isAmmunitionWeapon = template?.type === 'weapon'
                      && (template.properties || []).map((property) => String(property).toLowerCase()).includes('ammunition')
                    const selectedAmmunitionStillExists = ammunitionItems.some(({ item }) => item.id === row.weaponData?.ammunitionItemId)
                    const selectedAmmunitionItemId = selectedAmmunitionStillExists ? row.weaponData?.ammunitionItemId || '' : ''
                    const updateWeaponData = (patch) => updateItem(index, {
                      weaponData: {
                        ...(row.weaponData || {}),
                        ...patch,
                      },
                    })
                    return (
                      <>
                  <div className="dnd-equipment-card-head">
                    <div className="dnd-equipment-item-name">
                      <span>Item</span>
                      <strong>{template.name}</strong>
                    </div>
                    <label className="dnd-equipment-equipped">
                      <input
                        type="checkbox"
                        checked={row.equipped}
                        onChange={(event) => updateItemEquipped(index, event.target.checked)}
                      />
                      <span>Equipped</span>
                    </label>
                    <label className="dnd-equipment-equipped">
                      <input type="checkbox" checked={row.attuned} disabled={!template.attunement} onChange={(event) => updateItem(index, { attuned: event.target.checked })} />
                      <span>Attuned</span>
                    </label>
                    <button type="button" onClick={() => removeItem(index)}>Remove</button>
                  </div>
                  <div className="dnd-equipment-card-body">
                    <TextInput label="Quantity" type="number" min="0" value={row.quantity} onChange={(value) => updateItem(index, { quantity: Math.max(0, Number(value) || 0) })} />
                    <SlotPicker
                      label="Slot"
                      value={normalizeEquipmentSlot(row.slot)}
                      onChange={(value) => updateItem(index, { slot: value })}
                      options={EQUIPMENT_SLOTS}
                    />
                    {isAmmunitionWeapon && (
                      <>
                        <SelectInput
                          label="Ammunition"
                          value={selectedAmmunitionItemId}
                          onChange={(value) => updateWeaponData({ ammunitionItemId: value })}
                          options={ammunitionOptions}
                        />
                        <TextInput
                          label="Ammo Used"
                          type="number"
                          min="1"
                          value={row.weaponData?.ammunitionPerAttack || 1}
                          onChange={(value) => updateWeaponData({ ammunitionPerAttack: Math.max(1, Number(value) || 1) })}
                        />
                      </>
                    )}
                    <div className="dnd-equipment-line-total">
                      <span>Line Weight</span>
                      <strong>{itemWeight(row, itemTemplates).toFixed(1)}</strong>
                    </div>
                    <div className="dnd-item-template-details">
                      <p>{template.description}</p>
                      <div className="dnd-item-tags">
                        <span>{template.type}</span>
                        <span>{template.rarity}</span>
                        {template.damage?.dice && <span>{template.damage.dice} {formatDamageTypes(template)}</span>}
                        {template.damage?.versatile && <span>Versatile {template.damage.versatile}</span>}
                        {template.armorClass && <span>AC {template.armorClass.base}</span>}
                        {template.armorClass?.stealthDisadvantage && <span>Stealth disadvantage</span>}
                        {template.armorClass?.strengthRequirement > 0 && <span>STR {template.armorClass.strengthRequirement}</span>}
                        {template.shieldBonus && <span>{formatBonus(template.shieldBonus)} AC</span>}
                        {template.range && <span>{template.range}</span>}
                        {template.ammunition && <span>{template.ammunition}</span>}
                        {template.cost && <span>{template.cost}</span>}
                        {template.properties?.map((property) => <span key={property}>{property}</span>)}
                        {template.effects?.map((effect) => <span key={effect}>{effect}</span>)}
                      </div>
                    </div>
                  </div>
                      </>
                    )
                  })()}
                </article>
              ))}
            </div>

            <div className="dnd-equipment-inventory-actions">
              {showInventoryItemPicker ? (
                <>
                  <label className="dnd-equipment-add-select">
                    <span>Item</span>
                    <select value={selectedInventoryTemplateId} onChange={(event) => setSelectedInventoryItemTemplateId(event.target.value)}>
                      {itemTemplates.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!selectedInventoryTemplateId}
                    onClick={() => {
                      setSection('equipment', { items: [...items, createInventoryItem(selectedInventoryTemplateId, itemTemplates)] })
                      setShowInventoryItemPicker(false)
                    }}
                  >
                    Add Item
                  </button>
                  <button type="button" onClick={() => setShowInventoryItemPicker(false)}>Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => setShowInventoryItemPicker(true)}>Add Item</button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingCustomItemId(null)
                  setCustomItemForm(emptyCustomItemForm())
                  setShowCustomItemBuilder(true)
                  setShowInventoryItemPicker(false)
                }}
              >
                Create Custom Item
              </button>
            </div>
          </section>

          <section className="dnd-equipment-derived">
            <div>
              <span>Final AC</span>
              <strong>{computed.equipment.finalArmorClass}</strong>
            </div>
            <div>
              <span>Movement</span>
              <strong>{computed.equipment.speed}</strong>
            </div>
            <div>
              <span>Weapon Attack</span>
              <strong>{formatBonus(computed.equipment.weaponAttackBonus)}</strong>
            </div>
            <div>
              <span>Spell Save DC</span>
              <strong>{computed.equipment.spellSaveDc}</strong>
            </div>
            <div>
              <span>Attunement</span>
              <strong>{attunedCount}/3</strong>
            </div>
            <div>
              <span>Weight</span>
              <strong>{totalWeight.toFixed(1)}</strong>
            </div>
          </section>

          <section className="dnd-equipment-wallet">
            <div className="dnd-equipment-section-heading">
              <h3>Currency</h3>
            </div>
            <div className="dnd-coin-grid">
              {coins.map(([coin, label]) => (
                <label className="dnd-coin-control" key={coin}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={character.equipment.currency[coin]}
                    onChange={(event) => setNested('equipment', 'currency', { [coin]: Math.max(0, Number(event.target.value) || 0) })}
                  />
                </label>
              ))}
            </div>
          </section>

          {showCustomItemBuilder && (
          <section className="dnd-custom-item-builder">
            <div className="dnd-equipment-section-heading">
              <div>
                <h3>{editingCustomItemId ? 'Edit Custom Item' : 'Create Custom Item'}</h3>
                <span>Custom items use the same template system as official items</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomItemId(null)
                  setCustomItemForm(emptyCustomItemForm())
                  setShowCustomItemBuilder(false)
                }}
              >
                Cancel
              </button>
            </div>
            <div className="dnd-custom-item-grid">
              <TextInput label="Name" value={customItemForm.name} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, name: value }))} />
              <SelectInput
                label="Type"
                value={customItemForm.type}
                onChange={(value) => setCustomItemForm((prev) => ({
                  ...prev,
                  type: value,
                  armorBaseAc: value === 'armor' ? prev.armorBaseAc : '',
                  shieldAcBonus: value === 'shield' ? prev.shieldAcBonus : '',
                  dexterityLimit: value === 'armor' ? prev.dexterityLimit : '',
                }))}
                options={['weapon', 'armor', 'shield', 'gear', 'magic', 'consumable', 'ammunition'].map((type) => ({ value: type, label: type }))}
              />
              <SelectInput
                label="Rarity"
                value={customItemForm.rarity}
                onChange={(value) => setCustomItemForm((prev) => ({ ...prev, rarity: value }))}
                options={['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Unknown'].map((rarity) => ({ value: rarity, label: rarity }))}
              />
              <TextInput label="Damage Dice" value={customItemForm.damageDice} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, damageDice: value }))} />
              <CheckboxDropdown
                label="Damage Types"
                summary={selectedDamageTypes.length ? selectedDamageTypes.join(', ') : 'None'}
              >
                {DAMAGE_TYPE_OPTIONS.map((type) => (
                  <label className="dnd-checkbox-option" key={type}>
                    <input
                      type="checkbox"
                      checked={selectedDamageTypes.includes(type)}
                      onChange={(event) => toggleDamageType(type, event.target.checked)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </CheckboxDropdown>
              <TextInput label="Damage Bonus" type="number" value={customItemForm.damageBonus} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, damageBonus: Number(value) || 0 }))} />
              <TextInput label="Attack Bonus" type="number" value={customItemForm.attackBonus} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, attackBonus: Number(value) || 0 }))} />
              {customItemForm.type === 'armor' && (
                <>
                  <TextInput label="Armor Base AC" type="number" value={customItemForm.armorBaseAc} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, armorBaseAc: value }))} />
                  <SelectInput
                    label="Dexterity Limit"
                    value={customItemForm.dexterityLimit}
                    onChange={(value) => setCustomItemForm((prev) => ({ ...prev, dexterityLimit: value }))}
                    options={[
                      { value: '', label: 'None' },
                      { value: 'full', label: 'Full Dex' },
                      { value: 'max2', label: 'Max +2' },
                      { value: 'none', label: 'No Dex' },
                    ]}
                  />
                </>
              )}
              {customItemForm.type === 'shield' && (
                <TextInput label="Shield AC Bonus" type="number" value={customItemForm.shieldAcBonus} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, shieldAcBonus: value }))} />
              )}
              <TextInput label="Weight" type="number" value={customItemForm.weight} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, weight: Number(value) || 0 }))} />
              <TextInput label="Cost" value={customItemForm.cost} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, cost: value }))} />
              <TextInput label="Image URL" value={customItemForm.image} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, image: value }))} />
              <CheckboxDropdown
                label="Properties"
                summary={selectedProperties.length ? selectedProperties.join(', ') : 'None'}
              >
                {PROPERTY_OPTIONS.map((property) => (
                  <label className="dnd-checkbox-option" key={property}>
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property)}
                      onChange={(event) => toggleProperty(property, event.target.checked)}
                    />
                    <span>{property}</span>
                  </label>
                ))}
              </CheckboxDropdown>
              <CheckboxField label="Requires Attunement" checked={customItemForm.requiresAttunement} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, requiresAttunement: value }))} />
              <TextArea label="Description" value={customItemForm.description} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, description: value }))} />
              <CheckboxDropdown
                label="Modifiers"
                summary={selectedModifiers.length ? selectedModifiers.map((modifier) => `${MODIFIER_OPTIONS.find((option) => option.value === modifier.target)?.label || modifier.target} ${formatBonus(modifier.value)}`).join(', ') : 'None'}
              >
                {MODIFIER_OPTIONS.map((option) => {
                  const modifier = selectedModifiers.find((item) => item.target === option.value)
                  return (
                    <label className="dnd-checkbox-option dnd-checkbox-option-with-value" key={option.value}>
                      <input
                        type="checkbox"
                        checked={selectedModifierTargets.includes(option.value)}
                        onChange={(event) => toggleModifier(option.value, event.target.checked)}
                      />
                      <span>{option.label}</span>
                      {modifier && (
                        <input
                          type="number"
                          value={modifier.value}
                          onChange={(event) => setModifierValue(option.value, event.target.value)}
                        />
                      )}
                    </label>
                  )
                })}
              </CheckboxDropdown>
              <TextArea label="Effects" value={customItemForm.effects} onChange={(value) => setCustomItemForm((prev) => ({ ...prev, effects: value }))} />
            </div>
            <button className="dnd-custom-item-save" type="button" onClick={saveCustomItem}>{editingCustomItemId ? 'Save Custom Item' : 'Create Custom Item'}</button>
            <div className="dnd-custom-item-list">
              {itemTemplates.filter((template) => template.source === 'custom').map((template) => (
                <div key={template.id}>
                  <span>{template.name}</span>
                  <button type="button" onClick={() => editCustomItem(template)}>Edit</button>
                  <button type="button" onClick={() => deleteCustomItem(template.id)}>Delete</button>
                  <button type="button" onClick={() => setSection('equipment', { items: [...items, createInventoryItem(template.id, itemTemplates)] })}>Add</button>
                </div>
              ))}
            </div>
          </section>
          )}
        </div>
      )
    })()
  )

  const renderProficiencies = () => (
    <div className="dnd-modal-grid">
      <TextArea label="Armor Proficiencies" value={character.proficiencies.armor} onChange={(value) => setSection('proficiencies', { armor: value })} />
      <TextArea label="Weapon Proficiencies" value={character.proficiencies.weapons} onChange={(value) => setSection('proficiencies', { weapons: value })} />
      <TextArea label="Tool Proficiencies" value={character.proficiencies.tools} onChange={(value) => setSection('proficiencies', { tools: value })} />
      <TextArea label="Languages" value={character.proficiencies.languages} onChange={(value) => setSection('proficiencies', { languages: value })} />
      <TextArea label="Other Proficiencies" value={character.proficiencies.other} onChange={(value) => setSection('proficiencies', { other: value })} />
    </div>
  )

  const renderFeatureRows = (category, title) => (
    <DynamicRows
      title={title}
      rows={character.features[category]}
      createRow={() => emptyFeature(category)}
      onChange={(rows) => setSection('features', { [category]: rows })}
      renderRow={(row, update) => (
        <div className="dnd-modal-grid">
          <TextInput label="Feature Name" value={row.name} onChange={(value) => update({ name: value })} />
          <TextInput label="Source" value={row.source} onChange={(value) => update({ source: value })} />
          <TextInput label="Uses" value={row.uses} onChange={(value) => update({ uses: value })} />
          <TextInput label="Uses Remaining" value={row.usesRemaining} onChange={(value) => update({ usesRemaining: value })} />
          <TextInput label="Recharge Type" value={row.rechargeType} onChange={(value) => update({ rechargeType: value })} />
          <TextArea label="Description" value={row.description} onChange={(value) => update({ description: value })} />
        </div>
      )}
    />
  )

  const renderFeatures = () => (
    <div className="dnd-tab-stack">
      {renderFeatureRows('raceTraits', 'Race Traits')}
      {renderFeatureRows('classFeatures', 'Class Features')}
      {renderFeatureRows('backgroundFeature', 'Background Feature')}
      {renderFeatureRows('feats', 'Feats')}
      {renderFeatureRows('otherTraits', 'Other Traits')}
    </div>
  )

  const renderStory = () => (
    <div className="dnd-modal-grid">
      <TextArea label="Personality Traits" value={character.story.personalityTraits} onChange={(value) => setSection('story', { personalityTraits: value })} />
      <TextArea label="Ideals" value={character.story.ideals} onChange={(value) => setSection('story', { ideals: value })} />
      <TextArea label="Bonds" value={character.story.bonds} onChange={(value) => setSection('story', { bonds: value })} />
      <TextArea label="Flaws" value={character.story.flaws} onChange={(value) => setSection('story', { flaws: value })} />
      <TextArea label="Backstory" value={character.story.backstory} onChange={(value) => setSection('story', { backstory: value })} rows={6} />
      <TextArea label="Allies and Organizations" value={character.story.alliesAndOrganizations} onChange={(value) => setSection('story', { alliesAndOrganizations: value })} />
      <TextArea label="Character Appearance" value={character.story.appearance} onChange={(value) => setSection('story', { appearance: value })} />
      <TextInput label="Age" value={character.story.age} onChange={(value) => setSection('story', { age: value })} />
      <TextInput label="Height" value={character.story.height} onChange={(value) => setSection('story', { height: value })} />
      <TextInput label="Weight" value={character.story.weight} onChange={(value) => setSection('story', { weight: value })} />
      <TextInput label="Eyes" value={character.story.eyes} onChange={(value) => setSection('story', { eyes: value })} />
      <TextInput label="Skin" value={character.story.skin} onChange={(value) => setSection('story', { skin: value })} />
      <TextInput label="Hair" value={character.story.hair} onChange={(value) => setSection('story', { hair: value })} />
    </div>
  )

  const renderNotes = () => (
    <div className="dnd-modal-grid">
      <TextArea label="Treasure" value={character.notes.treasure} onChange={(value) => setSection('notes', { treasure: value })} />
      <TextArea label="Character Notes" value={character.notes.characterNotes} onChange={(value) => setSection('notes', { characterNotes: value })} rows={5} />
      <TextArea label="Campaign Notes" value={character.notes.campaignNotes} onChange={(value) => setSection('notes', { campaignNotes: value })} rows={5} />
      <TextArea label="Private Notes" value={character.notes.privateNotes} onChange={(value) => setSection('notes', { privateNotes: value })} rows={5} />
    </div>
  )

  const contentByTab = {
    basic: renderBasic,
    abilities: renderAbilities,
    skills: renderSkills,
    combat: renderCombat,
    spells: renderSpells,
    equipment: renderEquipment,
    features: renderFeatures,
    story: renderStory,
    notes: renderNotes,
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="dnd-modal" aria-label="D&D 5e 2014 character sheet">
        <header className="dnd-modal-header">
          <div>
            <p className="sheet-system">Dnd5e 2014</p>
            <h2>Character Sheet</h2>
          </div>
          <button className="modal-close" type="button" onClick={onCancel} aria-label="Close character sheet modal">
            <X size={18} />
          </button>
        </header>

        {errors.length > 0 && (
          <div className="dnd-modal-errors" role="alert">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        )}

        <nav className="dnd-modal-tabs" aria-label="Character sheet sections">
          {TABS.map((tab) => (
            <button
              className={activeTab === tab.id ? 'active' : ''}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="dnd-modal-body">
          {contentByTab[activeTab]()}
        </div>

        <footer className="dnd-modal-footer">
          <button type="button" onClick={onCancel}>{characterId ? 'Close' : 'Cancel'}</button>
          {!characterId && <button className="primary-action" type="button" onClick={handleSave}>Create</button>}
        </footer>
      </section>
    </div>
  )
}

export function Dnd5e2014CharacterSheetModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>Open Character Modal</button>
      <Dnd5e2014CharacterSheetModal
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onSave={(character) => {
          console.log(character)
          setIsOpen(false)
        }}
      />
    </>
  )
}

export default Dnd5e2014CharacterSheetModal
