import { ChevronDown, FolderPlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Dnd5e2014CharacterSheetModal, { createEmptyDnd5e2014Character } from './Dnd5e2014CharacterSheetModal'
import { API_BASE } from './vtt/vttConfig'
const EMPTY_FORM = {
  name: '',
  player_name: '',
  race: '',
  class_name: '',
  subclass: '',
  level: 1,
  background: '',
  alignment: '',
  experience_points: 0,
  inspiration: false,
  proficiency_bonus: 2,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  saving_throw_proficiencies: '',
  skill_proficiencies: '',
  skill_expertise: '',
  armor_class: 10,
  initiative: 0,
  speed: 30,
  max_hit_points: 1,
  current_hit_points: 1,
  temporary_hit_points: 0,
  hit_dice_total: '',
  hit_dice_current: '',
  death_save_successes: 0,
  death_save_failures: 0,
  attacks: '',
  equipment: '',
  currency: 'cp: 0, sp: 0, ep: 0, gp: 0, pp: 0',
  features_traits: '',
  proficiencies_languages: '',
  spellcasting_class: '',
  spellcasting_ability: '',
  spell_save_dc: 0,
  spell_attack_bonus: 0,
  spells: '',
  personality_traits: '',
  ideals: '',
  bonds: '',
  flaws: '',
  backstory: '',
  allies_organizations: '',
  treasure: '',
  notes: '',
  conditions: '',
  avatar: '',
  origin: '',
}

const parseList = (value) => (
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
)

const parseLines = (value, key = 'name') => (
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ [key]: item }))
)

const parseCurrency = (value) => {
  const currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }
  value.split(',').forEach((part) => {
    const [key, amount] = part.split(':').map((item) => item.trim().toLowerCase())
    if (key in currency) currency[key] = Number(amount) || 0
  })
  return currency
}

const parseSpells = (value) => {
  const spells = {}
  value.split('\n').forEach((line) => {
    const [levelLabel, names] = line.split(':')
    if (!levelLabel || !names) return
    const level = levelLabel.trim().toLowerCase()
    spells[level] = names
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }))
  })
  return spells
}

const dndModalCharacterToPayload = (character, campaignId) => {
  const savingThrowProficiencies = Object.entries(character.abilities)
    .filter(([, ability]) => ability.saveProficient)
    .map(([abilityId]) => abilityId)
  const skillProficiencies = Object.entries(character.skills)
    .filter(([, skill]) => skill.proficient)
    .map(([skillId]) => skillId)
  const skillExpertise = Object.entries(character.skills)
    .filter(([, skill]) => skill.expertise)
    .map(([skillId]) => skillId)
  const featureGroups = Object.values(character.features).flat()
  const notes = [
    character.notes.characterNotes,
    character.notes.campaignNotes,
    character.notes.privateNotes,
    character.story.appearance,
  ].filter(Boolean).join('\n\n')

  return {
    campaign_id: campaignId,
    name: character.basic.characterName,
    player_name: character.basic.playerName,
    race: [character.basic.race, character.basic.subrace].filter(Boolean).join(' - '),
    class_name: character.basic.className,
    subclass: character.basic.subclass,
    level: character.basic.level,
    background: character.basic.background,
    alignment: character.basic.alignment,
    experience_points: character.basic.experiencePoints,
    inspiration: character.core.inspiration,
    proficiency_bonus: character.core.proficiencyBonus,
    strength: character.abilities.strength.score,
    dexterity: character.abilities.dexterity.score,
    constitution: character.abilities.constitution.score,
    intelligence: character.abilities.intelligence.score,
    wisdom: character.abilities.wisdom.score,
    charisma: character.abilities.charisma.score,
    saving_throw_proficiencies: savingThrowProficiencies,
    skill_proficiencies: skillProficiencies,
    skill_expertise: skillExpertise,
    armor_class: character.core.armorClass,
    initiative: character.core.initiative,
    speed: character.core.speed,
    max_hit_points: character.core.hitPointMaximum,
    current_hit_points: character.core.currentHitPoints,
    temporary_hit_points: character.core.temporaryHitPoints,
    hit_dice_total: character.core.hitDiceTotal,
    hit_dice_current: character.core.hitDiceRemaining,
    death_save_successes: character.core.deathSaveSuccesses,
    death_save_failures: character.core.deathSaveFailures,
    attacks: character.attacks,
    equipment: character.equipment.items,
    currency: {
      cp: character.equipment.currency.copper,
      sp: character.equipment.currency.silver,
      ep: character.equipment.currency.electrum,
      gp: character.equipment.currency.gold,
      pp: character.equipment.currency.platinum,
    },
    features_traits: featureGroups,
    proficiencies_languages: [
      character.proficiencies.armor,
      character.proficiencies.weapons,
      character.proficiencies.tools,
      character.proficiencies.languages,
      character.proficiencies.other,
    ].filter(Boolean).join('\n\n'),
    spellcasting_class: character.spellcasting.className,
    spellcasting_ability: character.spellcasting.ability,
    spell_save_dc: character.spellcasting.spellSaveDc,
    spell_attack_bonus: character.spellcasting.spellAttackBonus,
    spells: {
      slots: character.spellcasting.slots,
      list: character.spellcasting.spells,
      cantripsKnown: character.spellcasting.cantripsKnown,
      preparedSpells: character.spellcasting.preparedSpells,
      knownSpells: character.spellcasting.knownSpells,
    },
    personality_traits: character.story.personalityTraits,
    ideals: character.story.ideals,
    bonds: character.story.bonds,
    flaws: character.story.flaws,
    backstory: character.story.backstory,
    allies_organizations: character.story.alliesAndOrganizations,
    treasure: character.notes.treasure,
    notes,
    conditions: [],
    avatar: character.basic.imageUrl || null,
    sheet_data: character,
  }
}

const dndApiCharacterToModalData = (character) => {
  if (!character) return undefined
  if (character.sheet_data?.basic) return character.sheet_data

  const sheet = createEmptyDnd5e2014Character()
  const [race, subrace = ''] = (character.race || '').split(' - ')
  return {
    ...sheet,
    basic: {
      ...sheet.basic,
      characterName: character.name || '',
      imageUrl: character.avatar || '',
      playerName: character.player_name || '',
      className: character.class_name || '',
      subclass: character.subclass || '',
      level: character.level || 1,
      race: race || '',
      subrace,
      background: character.background || '',
      alignment: character.alignment || '',
      experiencePoints: character.experience_points || 0,
    },
    abilities: {
      ...sheet.abilities,
      strength: { ...sheet.abilities.strength, score: character.strength || 10 },
      dexterity: { ...sheet.abilities.dexterity, score: character.dexterity || 10 },
      constitution: { ...sheet.abilities.constitution, score: character.constitution || 10 },
      intelligence: { ...sheet.abilities.intelligence, score: character.intelligence || 10 },
      wisdom: { ...sheet.abilities.wisdom, score: character.wisdom || 10 },
      charisma: { ...sheet.abilities.charisma, score: character.charisma || 10 },
    },
    core: {
      ...sheet.core,
      proficiencyBonus: character.proficiency_bonus || 2,
      armorClass: character.armor_class || 10,
      initiative: character.initiative || 0,
      initiativeOverride: true,
      speed: character.speed || 30,
      inspiration: Boolean(character.inspiration),
      hitPointMaximum: character.max_hit_points || 1,
      currentHitPoints: character.current_hit_points || 1,
      temporaryHitPoints: character.temporary_hit_points || 0,
      hitDiceTotal: character.hit_dice_total || '',
      hitDiceRemaining: character.hit_dice_current || '',
      deathSaveSuccesses: character.death_save_successes || 0,
      deathSaveFailures: character.death_save_failures || 0,
    },
    attacks: Array.isArray(character.attacks) && character.attacks.length > 0 ? character.attacks : sheet.attacks,
    equipment: {
      ...sheet.equipment,
      items: Array.isArray(character.equipment) && character.equipment.length > 0 ? character.equipment : sheet.equipment.items,
      currency: {
        copper: character.currency?.cp || 0,
        silver: character.currency?.sp || 0,
        electrum: character.currency?.ep || 0,
        gold: character.currency?.gp || 0,
        platinum: character.currency?.pp || 0,
      },
    },
    story: {
      ...sheet.story,
      personalityTraits: character.personality_traits || '',
      ideals: character.ideals || '',
      bonds: character.bonds || '',
      flaws: character.flaws || '',
      backstory: character.backstory || '',
      alliesAndOrganizations: character.allies_organizations || '',
    },
    notes: {
      ...sheet.notes,
      treasure: character.treasure || '',
      characterNotes: character.notes || '',
    },
  }
}

const characterInitialsImage = (name) => {
  const initials = (name || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="64" fill="#252936"/><text x="64" y="72" text-anchor="middle" font-family="Arial" font-size="42" font-weight="700" fill="#d8b45f">${initials}</text></svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

const characterToTokenDragPayload = (character) => ({
  id: `character-${character.id}`,
  templateId: `character-${character.id}`,
  name: character.name,
  imageUrl: character.avatar || character.sheet_data?.basic?.imageUrl || characterInitialsImage(character.name),
  size: 'Medium',
  type: 'Player',
  armorClass: character.armor_class || 10,
  maxHp: character.max_hit_points || 1,
  currentHp: character.current_hit_points || 1,
  initiative: character.initiative || 0,
  speed: character.speed || 30,
  notes: character.notes || '',
})

function CharacterSheet({ activeCampaign, onAuthRequired, setMessages }) {
  const [characters, setCharacters] = useState([])
  const [characterGroups, setCharacterGroups] = useState([{ id: 'default', name: 'Characters' }])
  const [characterGroupAssignments, setCharacterGroupAssignments] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [editingCharacter, setEditingCharacter] = useState(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [openAccordions, setOpenAccordions] = useState({ characters: true, tokens: true })
  const gameSystem = activeCampaign?.game_system || 'Dnd5e 2014'
  const isTormenta20 = gameSystem === 'Tormenta20'
  const normalizedCharacterGroups = characterGroups.length > 0 ? characterGroups : [{ id: 'default', name: 'Characters' }]

  useEffect(() => {
    setSelectedId(null)
    loadCharacters()
  }, [activeCampaign?.id])

  const loadCharacters = async () => {
    if (!activeCampaign?.id) return

    try {
      const response = await fetch(`${API_BASE}/api/characters/?campaign_id=${activeCampaign.id}`, {
        credentials: 'include',
      })
      if (response.status === 401) {
        onAuthRequired?.()
        return
      }
      if (response.ok) {
        setCharacters(await response.json())
      }
    } catch (error) {
      setMessage(`Character load error: ${error.message}`)
    }
  }

  const closeCreateModal = () => {
    setIsCreateOpen(false)
    setEditingCharacter(null)
    setForm(EMPTY_FORM)
  }

  const openCreateModal = () => {
    setEditingCharacter(null)
    setForm(EMPTY_FORM)
    setIsCreateOpen(true)
  }

  const rollDndSkill = async ({ skill, totalBonus, characterName }) => {
    try {
      const response = await fetch(`${API_BASE}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dice_type: 'd20', num_rolls: 1 }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.detail || data.error || 'Roll failed')
      }
      const roll = Number(data.rolls?.[0]) || 0
      const total = roll + totalBonus
      const bonusLabel = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`
      const rollMessage = `${characterName} rolls ${skill}: d20(${roll}) ${bonusLabel} = ${total}`
      if (setMessages) {
        setMessages((prev) => [...prev, rollMessage])
      } else {
        setMessage(rollMessage)
      }
    } catch (error) {
      const rollError = `Roll error: ${error.message}`
      if (setMessages) {
        setMessages((prev) => [...prev, rollError])
      } else {
        setMessage(rollError)
      }
    }
  }

  const rollDndDeathSave = async (characterName) => {
    try {
      const response = await fetch(`${API_BASE}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dice_type: 'd20', num_rolls: 1 }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.detail || data.error || 'Roll failed')
      }
      const roll = Number(data.rolls?.[0]) || 0
      let outcome = 'success'
      if (roll === 1) outcome = 'two failures'
      else if (roll >= 2 && roll <= 9) outcome = 'failure'
      else if (roll === 20) outcome = 'back with 1 HP'
      const rollMessage = `${characterName} rolls Death Save: d20(${roll}) - ${outcome}`
      if (setMessages) {
        setMessages((prev) => [...prev, rollMessage])
      } else {
        setMessage(rollMessage)
      }
      return { roll }
    } catch (error) {
      const rollError = `Roll error: ${error.message}`
      if (setMessages) {
        setMessages((prev) => [...prev, rollError])
      } else {
        setMessage(rollError)
      }
      return null
    }
  }

  const openEditModal = (character) => {
    setSelectedId(character.id)
    setEditingCharacter(character)
    setForm({
      ...EMPTY_FORM,
      name: character.name || '',
      player_name: character.player_name || '',
      race: character.race || '',
      class_name: character.class_name || '',
      subclass: character.subclass || '',
      level: character.level || 1,
      background: character.background || '',
      alignment: character.alignment || '',
      experience_points: character.experience_points || 0,
      inspiration: Boolean(character.inspiration),
      proficiency_bonus: character.proficiency_bonus || 2,
      strength: character.strength || 10,
      dexterity: character.dexterity || 10,
      constitution: character.constitution || 10,
      intelligence: character.intelligence || 10,
      wisdom: character.wisdom || 10,
      charisma: character.charisma || 10,
      armor_class: character.armor_class || 10,
      initiative: character.initiative || 0,
      speed: character.speed || 30,
      max_hit_points: character.max_hit_points || 1,
      current_hit_points: character.current_hit_points || 1,
      temporary_hit_points: character.temporary_hit_points || 0,
      hit_dice_total: character.hit_dice_total || '',
      hit_dice_current: character.hit_dice_current || '',
      death_save_successes: character.death_save_successes || 0,
      death_save_failures: character.death_save_failures || 0,
      origin: character.origin || '',
    })
    setIsCreateOpen(true)
  }

  const toggleAccordion = (section) => {
    setOpenAccordions((current) => ({ ...current, [section]: !current[section] }))
  }

  const insertCharacterAccordion = () => {
    const name = window.prompt('Accordion name')
    if (!name?.trim()) return
    const group = { id: crypto.randomUUID(), name: name.trim() }
    setCharacterGroups((prev) => [...prev, group])
    setOpenAccordions((current) => ({ ...current, [`characterGroup:${group.id}`]: true, characters: true }))
  }

  const renameCharacterAccordion = (groupId) => {
    const group = normalizedCharacterGroups.find((item) => item.id === groupId)
    const name = window.prompt('Accordion name', group?.name || '')
    if (!name?.trim()) return
    setCharacterGroups((prev) => prev.map((item) => (item.id === groupId ? { ...item, name: name.trim() } : item)))
  }

  const deleteCharacterAccordion = (groupId) => {
    if (groupId === 'default') return
    setCharacterGroups((prev) => prev.filter((item) => item.id !== groupId))
    setCharacterGroupAssignments((prev) => Object.fromEntries(
      Object.entries(prev).map(([characterId, currentGroupId]) => [
        characterId,
        currentGroupId === groupId ? 'default' : currentGroupId,
      ]),
    ))
  }

  const moveCharacterToAccordion = (characterId, groupId) => {
    setCharacterGroupAssignments((prev) => ({ ...prev, [characterId]: groupId }))
  }

  const createCharacter = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !activeCampaign?.id) return

    const payload = isTormenta20
      ? {
        campaign_id: activeCampaign.id,
        name: form.name,
        race: form.race,
        class_name: form.class_name,
        origin: form.origin,
      }
      : {
        campaign_id: activeCampaign.id,
        name: form.name,
        player_name: form.player_name,
        race: form.race,
        class_name: form.class_name,
        subclass: form.subclass,
        level: Number(form.level) || 1,
        background: form.background,
        alignment: form.alignment,
        experience_points: Number(form.experience_points) || 0,
        inspiration: form.inspiration,
        proficiency_bonus: Number(form.proficiency_bonus) || 2,
        strength: Number(form.strength) || 10,
        dexterity: Number(form.dexterity) || 10,
        constitution: Number(form.constitution) || 10,
        intelligence: Number(form.intelligence) || 10,
        wisdom: Number(form.wisdom) || 10,
        charisma: Number(form.charisma) || 10,
        saving_throw_proficiencies: parseList(form.saving_throw_proficiencies),
        skill_proficiencies: parseList(form.skill_proficiencies),
        skill_expertise: parseList(form.skill_expertise),
        armor_class: Number(form.armor_class) || 10,
        initiative: Number(form.initiative) || 0,
        speed: Number(form.speed) || 30,
        max_hit_points: Number(form.max_hit_points) || 1,
        current_hit_points: Number(form.current_hit_points) || 1,
        temporary_hit_points: Number(form.temporary_hit_points) || 0,
        hit_dice_total: form.hit_dice_total,
        hit_dice_current: form.hit_dice_current,
        death_save_successes: Number(form.death_save_successes) || 0,
        death_save_failures: Number(form.death_save_failures) || 0,
        attacks: parseLines(form.attacks),
        equipment: parseLines(form.equipment),
        currency: parseCurrency(form.currency),
        features_traits: parseLines(form.features_traits),
        proficiencies_languages: form.proficiencies_languages,
        spellcasting_class: form.spellcasting_class,
        spellcasting_ability: form.spellcasting_ability,
        spell_save_dc: Number(form.spell_save_dc) || 0,
        spell_attack_bonus: Number(form.spell_attack_bonus) || 0,
        spells: parseSpells(form.spells),
        personality_traits: form.personality_traits,
        ideals: form.ideals,
        bonds: form.bonds,
        flaws: form.flaws,
        backstory: form.backstory,
        allies_organizations: form.allies_organizations,
        treasure: form.treasure,
        notes: form.notes,
        conditions: parseList(form.conditions),
        avatar: form.avatar || null,
      }

    try {
      const isEditing = Boolean(editingCharacter)
      const response = await fetch(
        isEditing
          ? `${API_BASE}/api/characters/${editingCharacter.id}?campaign_id=${activeCampaign.id}`
          : `${API_BASE}/api/characters/`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      if (response.status === 401) {
        onAuthRequired?.()
        return
      }
      if (!response.ok) {
        setMessage(`${isEditing ? 'Update' : 'Create'} error: ${data.detail || data.error}`)
        return
      }
      setMessage(`${isEditing ? 'Updated' : 'Created'} ${data.name}`)
      closeCreateModal()
      loadCharacters()
    } catch (error) {
      setMessage(`${editingCharacter ? 'Update' : 'Create'} error: ${error.message}`)
    }
  }

  const saveDndCharacter = async (character, options = {}) => {
    if (!activeCampaign?.id) return

    try {
      const isEditing = Boolean(editingCharacter)
      const response = await fetch(
        isEditing
          ? `${API_BASE}/api/characters/${editingCharacter.id}?campaign_id=${activeCampaign.id}`
          : `${API_BASE}/api/characters/`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dndModalCharacterToPayload(character, activeCampaign.id)),
        },
      )
      const data = await response.json()
      if (response.status === 401) {
        onAuthRequired?.()
        return
      }
      if (!response.ok) {
        setMessage(`${isEditing ? 'Update' : 'Create'} error: ${data.detail || data.error}`)
        return
      }
      if (options.autoSave) {
        setCharacters((prev) => prev.map((item) => (item.id === data.id ? data : item)))
        setMessage(`Saved ${data.name}`)
        return
      }
      setMessage(`${isEditing ? 'Updated' : 'Created'} ${data.name}`)
      closeCreateModal()
      loadCharacters()
    } catch (error) {
      setMessage(`${editingCharacter ? 'Update' : 'Create'} error: ${error.message}`)
    }
  }

  const deleteCharacter = async () => {
    if (!selectedId || !activeCampaign?.id) return

    try {
      const response = await fetch(`${API_BASE}/api/characters/${selectedId}?campaign_id=${activeCampaign.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.status === 401) {
        onAuthRequired?.()
        return
      }
      if (!response.ok) {
        setMessage(`Delete error: ${data.detail || data.error}`)
        return
      }
      setMessage(data.message)
      setSelectedId(null)
      loadCharacters()
    } catch (error) {
      setMessage(`Delete error: ${error.message}`)
    }
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const renderInput = (field, label, type = 'text') => (
    <label>
      <span>{label}</span>
      <input
        type={type}
        value={form[field]}
        onChange={(event) => setField(field, event.target.value)}
      />
    </label>
  )

  const renderTextarea = (field, label, rows = 3) => (
    <label>
      <span>{label}</span>
      <textarea
        rows={rows}
        value={form[field]}
        onChange={(event) => setField(field, event.target.value)}
      />
    </label>
  )

  const renderDnd5eForm = () => (
    <>
      <fieldset className="sheet-fieldset">
        <legend>Identity</legend>
        {renderInput('name', 'Character Name')}
        {renderInput('player_name', 'Player Name')}
        {renderInput('race', 'Race')}
        {renderInput('class_name', 'Class')}
        {renderInput('subclass', 'Subclass')}
        {renderInput('level', 'Level', 'number')}
        {renderInput('background', 'Background')}
        {renderInput('alignment', 'Alignment')}
        {renderInput('experience_points', 'Experience', 'number')}
        <label className="sheet-checkbox">
          <input
            type="checkbox"
            checked={form.inspiration}
            onChange={(event) => setField('inspiration', event.target.checked)}
          />
          <span>Inspiration</span>
        </label>
      </fieldset>

      <fieldset className="sheet-fieldset compact">
        <legend>Ability Scores</legend>
        {renderInput('strength', 'STR', 'number')}
        {renderInput('dexterity', 'DEX', 'number')}
        {renderInput('constitution', 'CON', 'number')}
        {renderInput('intelligence', 'INT', 'number')}
        {renderInput('wisdom', 'WIS', 'number')}
        {renderInput('charisma', 'CHA', 'number')}
      </fieldset>

      <fieldset className="sheet-fieldset">
        <legend>Proficiency & Skills</legend>
        {renderInput('proficiency_bonus', 'Proficiency Bonus', 'number')}
        {renderTextarea('saving_throw_proficiencies', 'Saving Throw Proficiencies')}
        {renderTextarea('skill_proficiencies', 'Skill Proficiencies')}
        {renderTextarea('skill_expertise', 'Skill Expertise')}
        {renderTextarea('proficiencies_languages', 'Other Proficiencies & Languages', 4)}
      </fieldset>

      <fieldset className="sheet-fieldset compact">
        <legend>Combat</legend>
        {renderInput('armor_class', 'Armor Class', 'number')}
        {renderInput('initiative', 'Initiative', 'number')}
        {renderInput('speed', 'Speed', 'number')}
        {renderInput('max_hit_points', 'Max HP', 'number')}
        {renderInput('current_hit_points', 'Current HP', 'number')}
        {renderInput('temporary_hit_points', 'Temp HP', 'number')}
        {renderInput('hit_dice_total', 'Hit Dice Total')}
        {renderInput('hit_dice_current', 'Hit Dice Current')}
        {renderInput('death_save_successes', 'Death Save Successes', 'number')}
        {renderInput('death_save_failures', 'Death Save Failures', 'number')}
      </fieldset>

      <fieldset className="sheet-fieldset">
        <legend>Inventory & Features</legend>
        {renderTextarea('attacks', 'Attacks & Spell Attacks', 4)}
        {renderTextarea('equipment', 'Equipment', 4)}
        {renderInput('currency', 'Currency')}
        {renderTextarea('features_traits', 'Features & Traits', 5)}
      </fieldset>

      <fieldset className="sheet-fieldset">
        <legend>Spellcasting</legend>
        {renderInput('spellcasting_class', 'Spellcasting Class')}
        {renderInput('spellcasting_ability', 'Spellcasting Ability')}
        {renderInput('spell_save_dc', 'Spell Save DC', 'number')}
        {renderInput('spell_attack_bonus', 'Spell Attack Bonus', 'number')}
        {renderTextarea('spells', 'Spells', 5)}
      </fieldset>

      <fieldset className="sheet-fieldset">
        <legend>Personality & Notes</legend>
        {renderTextarea('personality_traits', 'Personality Traits')}
        {renderTextarea('ideals', 'Ideals')}
        {renderTextarea('bonds', 'Bonds')}
        {renderTextarea('flaws', 'Flaws')}
        {renderTextarea('backstory', 'Backstory', 5)}
        {renderTextarea('allies_organizations', 'Allies & Organizations')}
        {renderTextarea('treasure', 'Treasure')}
        {renderTextarea('conditions', 'Conditions')}
        {renderTextarea('notes', 'Notes', 5)}
        {renderInput('avatar', 'Avatar URL')}
      </fieldset>
    </>
  )

  const renderTormenta20Form = () => (
    <>
      {renderInput('name', 'Name')}
      {renderInput('race', 'Race')}
      {renderInput('class_name', 'Class')}
      {renderInput('origin', 'Origin')}
    </>
  )

  return (
    <section className="sheet-dock-panel">
      <div className="sheet-system">
        <span>{gameSystem}</span>
        <button className="sheet-mini-action" type="button" title="Insert character accordion" onClick={insertCharacterAccordion}>
          <FolderPlus size={15} />
        </button>
      </div>

      <div className="sheet-accordion-stack">
        <section className="sheet-group-shell">
          <div className="sheet-accordion-header">
            <button type="button" onClick={() => toggleAccordion('characters')} aria-expanded={openAccordions.characters}>
              <ChevronDown size={16} />
              <span>Character Sheets</span>
              <small>{characters.length}</small>
            </button>
            <button className="sheet-mini-action" type="button" title="Insert accordion" onClick={insertCharacterAccordion}>
              <FolderPlus size={15} />
            </button>
          </div>
          {openAccordions.characters && (
            <div className="sheet-token-group-stack" aria-label="Character sheet accordions">
              {normalizedCharacterGroups.map((group) => {
                const groupCharacters = characters.filter((character) => (
                  (characterGroupAssignments[character.id] || 'default') === group.id
                ))
                const groupKey = `characterGroup:${group.id}`
                const isGroupOpen = openAccordions[groupKey] !== false

                return (
                  <section className="sheet-token-group" key={group.id}>
                    <div
                      className="sheet-token-group-header"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const characterId = event.dataTransfer.getData('application/x-vtt-character-sheet-id')
                        if (!characterId) return
                        event.preventDefault()
                        moveCharacterToAccordion(characterId, group.id)
                      }}
                    >
                      <button type="button" onClick={() => toggleAccordion(groupKey)} aria-expanded={isGroupOpen}>
                        <ChevronDown size={15} />
                        <span>{group.name}</span>
                        <small>{groupCharacters.length}</small>
                      </button>
                      <button type="button" title="Rename accordion" onClick={() => renameCharacterAccordion(group.id)}>
                        <Pencil size={14} />
                      </button>
                      <button
                        className="danger"
                        type="button"
                        title="Delete accordion"
                        disabled={group.id === 'default'}
                        onClick={() => deleteCharacterAccordion(group.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {isGroupOpen && (
                      <div
                        className="sheet-list"
                        aria-label={`${group.name} character sheets`}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          const characterId = event.dataTransfer.getData('application/x-vtt-character-sheet-id')
                          if (!characterId) return
                          event.preventDefault()
                          moveCharacterToAccordion(characterId, group.id)
                        }}
                      >
                        {groupCharacters.length === 0 ? (
                          <p className="sheet-empty">Drop character sheets here.</p>
                        ) : (
                          groupCharacters.map((character) => (
                            <button
                              className={selectedId === character.id ? 'sheet-list-item active' : 'sheet-list-item'}
                              draggable
                              key={character.id}
                              type="button"
                              onClick={() => setSelectedId(character.id)}
                              onDoubleClick={() => openEditModal(character)}
                              onDragStart={(event) => {
                                event.dataTransfer.setData('application/x-vtt-character-sheet-id', String(character.id))
                                event.dataTransfer.setData('application/x-vtt-character-token', JSON.stringify(characterToTokenDragPayload(character)))
                                event.dataTransfer.effectAllowed = 'copyMove'
                              }}
                            >
                              <img
                                className="sheet-list-avatar"
                                src={character.avatar || character.sheet_data?.basic?.imageUrl || characterInitialsImage(character.name)}
                                alt=""
                              />
                              <strong>{character.name}</strong>
                              <span>{character.race || 'No race'} {character.class_name || ''}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </section>

      </div>

      {message && <p className="sheet-message">{message}</p>}

      <div className="sheet-actions">
        <button type="button" onClick={openCreateModal}>
          <Plus size={16} />
          <span>Create</span>
        </button>
        <button className="danger" type="button" disabled={!selectedId} onClick={deleteCharacter}>
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>

      {isCreateOpen && (
        isTormenta20 ? (
          <div className="modal-backdrop" role="presentation">
          <section className="sheet-modal" aria-label="Create character sheet">
            <button className="modal-close" type="button" onClick={closeCreateModal}>
              <X size={18} />
            </button>
            <div className="panel-title">{editingCharacter ? 'Edit' : 'Create'} {gameSystem} Sheet</div>
            <form className="sheet-form" onSubmit={createCharacter}>
              {isTormenta20 ? renderTormenta20Form() : renderDnd5eForm()}
              <button className="primary-action" type="submit">{editingCharacter ? 'Save' : 'Create'}</button>
            </form>
          </section>
          </div>
        ) : (
          <Dnd5e2014CharacterSheetModal
            isOpen={isCreateOpen}
            initialCharacter={dndApiCharacterToModalData(editingCharacter)}
            onCancel={closeCreateModal}
            onSave={saveDndCharacter}
            onRollSkill={rollDndSkill}
            onRollDeathSave={rollDndDeathSave}
            campaignId={activeCampaign?.id}
            characterId={editingCharacter?.id}
          />
        )
      )}
    </section>
  )
}

export default CharacterSheet
