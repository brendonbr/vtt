export const EQUIPMENT_SLOTS = [
  { value: 'mainHand', label: 'Main Hand' },
  { value: 'offHand', label: 'Off Hand' },
  { value: 'armor', label: 'Armor' },
  { value: 'shield', label: 'Shield' },
  { value: 'helmet', label: 'Helmet' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'boots', label: 'Boots' },
  { value: 'cloak', label: 'Cloak' },
  { value: 'ring1', label: 'Ring 1' },
  { value: 'ring2', label: 'Ring 2' },
  { value: 'amulet', label: 'Amulet' },
  { value: 'belt', label: 'Belt' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'ammunition', label: 'Ammunition' },
]

export const ITEM_TYPES = [
  'weapon',
  'armor',
  'shield',
  'magicalItem',
  'accessory',
  'ammunition',
  'consumable',
]

export const ITEM_TEMPLATES = [
  {
    id: 'longsword',
    name: 'Longsword',
    type: 'weapon',
    rarity: 'Common',
    description: 'A balanced martial melee weapon.',
    damage: { dice: '1d8', type: 'Slashing', versatile: '1d10' },
    properties: ['versatile'],
    modifiers: [],
    effects: [],
    weight: 3,
    cost: '15 gp',
    attunement: false,
    slot: 'mainHand',
    range: '5 ft.',
    ammunition: '',
  },
  {
    id: 'longsword-plus-one',
    name: 'Longsword +1',
    type: 'weapon',
    rarity: 'Uncommon',
    description: 'A magical martial melee weapon with a bonus to attack and damage.',
    damage: { dice: '1d8', type: 'Slashing', versatile: '1d10' },
    properties: ['versatile', 'magical'],
    modifiers: [
      { target: 'weaponAttack', value: 1 },
      { target: 'weaponDamage', value: 1 },
    ],
    effects: ['Magical weapon'],
    weight: 3,
    cost: '',
    attunement: false,
    slot: 'mainHand',
    range: '5 ft.',
    ammunition: '',
  },
  {
    id: 'shortbow',
    name: 'Shortbow',
    type: 'weapon',
    rarity: 'Common',
    description: 'A ranged weapon that uses arrows.',
    damage: { dice: '1d6', type: 'Piercing' },
    properties: ['ammunition', 'two-handed'],
    modifiers: [],
    effects: [],
    weight: 2,
    cost: '25 gp',
    attunement: false,
    slot: 'mainHand',
    range: '80/320 ft.',
    ammunition: 'Arrows',
  },
  {
    id: 'arrows',
    name: 'Arrows',
    type: 'ammunition',
    rarity: 'Common',
    description: 'Ammunition for bows.',
    damage: null,
    properties: ['ammunition'],
    modifiers: [],
    effects: [],
    weight: 0.05,
    cost: '1 gp / 20',
    attunement: false,
    slot: 'ammunition',
    range: '',
    ammunition: '',
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    type: 'armor',
    rarity: 'Common',
    description: 'Light armor.',
    armorClass: { base: 11, dexterity: 'full', stealthDisadvantage: false, strengthRequirement: 0 },
    properties: ['light'],
    modifiers: [],
    effects: [],
    weight: 10,
    cost: '10 gp',
    attunement: false,
    slot: 'armor',
  },
  {
    id: 'chain-mail',
    name: 'Chain Mail',
    type: 'armor',
    rarity: 'Common',
    description: 'Heavy armor.',
    armorClass: { base: 16, dexterity: 'none', stealthDisadvantage: true, strengthRequirement: 13 },
    properties: ['heavy'],
    modifiers: [],
    effects: ['Stealth disadvantage'],
    weight: 55,
    cost: '75 gp',
    attunement: false,
    slot: 'armor',
  },
  {
    id: 'plate-armor',
    name: 'Plate Armor',
    type: 'armor',
    rarity: 'Common',
    description: 'Heavy armor.',
    armorClass: { base: 18, dexterity: 'none', stealthDisadvantage: true, strengthRequirement: 15 },
    properties: ['heavy'],
    modifiers: [],
    effects: ['Stealth disadvantage'],
    weight: 65,
    cost: '1500 gp',
    attunement: false,
    slot: 'armor',
  },
  {
    id: 'shield',
    name: 'Shield',
    type: 'shield',
    rarity: 'Common',
    description: 'A carried shield.',
    shieldBonus: 2,
    properties: [],
    modifiers: [{ target: 'armorClass', value: 2 }],
    effects: [],
    weight: 6,
    cost: '10 gp',
    attunement: false,
    slot: 'shield',
  },
  {
    id: 'ring-of-protection',
    name: 'Ring of Protection',
    type: 'accessory',
    rarity: 'Rare',
    description: 'A protective magical ring.',
    properties: ['magical'],
    modifiers: [
      { target: 'armorClass', value: 1 },
      { target: 'savingThrows', value: 1 },
    ],
    effects: ['Passive defensive bonus'],
    weight: 0,
    cost: '',
    attunement: true,
    slot: 'ring1',
  },
  {
    id: 'boots-of-speed',
    name: 'Boots of Speed',
    type: 'accessory',
    rarity: 'Rare',
    description: 'Magical boots that can improve movement.',
    properties: ['magical'],
    modifiers: [{ target: 'speed', value: 10 }],
    effects: ['Movement bonus'],
    weight: 1,
    cost: '',
    attunement: true,
    slot: 'boots',
  },
  {
    id: 'potion-of-healing',
    name: 'Potion of Healing',
    type: 'consumable',
    rarity: 'Common',
    description: 'A consumable healing potion.',
    properties: ['consumable'],
    modifiers: [],
    effects: ['Healing consumable'],
    weight: 0.5,
    cost: '50 gp',
    attunement: false,
    slot: 'consumable',
  },
]

export const ITEM_TEMPLATE_BY_ID = Object.fromEntries(ITEM_TEMPLATES.map((item) => [item.id, item]))

const ensureTemplateArray = (templates = ITEM_TEMPLATES) => (Array.isArray(templates) ? templates : ITEM_TEMPLATES)
const hasObjectValues = (value) => Boolean(value && Object.values(value).some((item) => item !== null && item !== undefined && item !== ''))
export const damageTypesForTemplate = (template) => {
  const types = template?.damage?.types
  if (Array.isArray(types) && types.length > 0) return types
  return template?.damage?.type ? [template.damage.type] : []
}

export const formatDamageTypes = (template) => damageTypesForTemplate(template).join(', ')

export const templateMap = (templates = ITEM_TEMPLATES) => (
  Object.fromEntries(ensureTemplateArray(templates).map((item) => [item.id, item]))
)

export const normalizeItemTemplate = (template) => {
  const localOfficial = ITEM_TEMPLATE_BY_ID[template.id] || {}
  const armorClass = hasObjectValues(template.armorClass)
    ? template.armorClass
    : hasObjectValues(template.armor_class)
      ? template.armor_class
      : localOfficial.armorClass
  return {
    ...localOfficial,
    id: template.id,
    source: template.source || localOfficial.source || 'official',
    ownerId: template.ownerId ?? template.owner_id ?? localOfficial.ownerId ?? null,
    campaignId: template.campaignId ?? template.campaign_id ?? localOfficial.campaignId ?? null,
    name: template.name || localOfficial.name || '',
    type: template.type || localOfficial.type || 'gear',
    description: template.description ?? localOfficial.description ?? '',
    rarity: template.rarity || localOfficial.rarity || 'Common',
    weight: Number(template.weight ?? localOfficial.weight ?? 0) || 0,
    cost: template.cost ?? localOfficial.cost ?? '',
    image: template.image ?? localOfficial.image ?? '',
    requiresAttunement: Boolean(template.requiresAttunement ?? template.requires_attunement ?? localOfficial.attunement),
    attunement: Boolean(template.requiresAttunement ?? template.requires_attunement ?? localOfficial.attunement),
    damage: template.damage && Object.keys(template.damage).length ? template.damage : localOfficial.damage,
    armorClass,
    shieldBonus: template.shieldBonus ?? template.armor_class?.shieldBonus ?? localOfficial.shieldBonus,
    properties: template.properties || localOfficial.properties || [],
    modifiers: template.modifiers || localOfficial.modifiers || [],
    effects: template.effects || localOfficial.effects || [],
    slot: template.slot || localOfficial.slot || defaultSlotForType(template.type || localOfficial.type),
    range: template.range ?? localOfficial.range ?? '',
    ammunition: template.ammunition ?? localOfficial.ammunition ?? '',
  }
}

export const defaultSlotForType = (type) => {
  if (type === 'armor') return 'armor'
  if (type === 'shield') return 'shield'
  if (type === 'ammunition') return 'ammunition'
  if (type === 'consumable') return 'consumable'
  return 'mainHand'
}

export const createInventoryItem = (templateId = ITEM_TEMPLATES[0].id, templates = ITEM_TEMPLATES) => {
  const templateList = ensureTemplateArray(templates)
  const templatesById = templateMap(templates)
  const template = templatesById[templateId] || templateList[0] || ITEM_TEMPLATES[0]
  return {
    id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    itemTemplateId: template.id,
    quantity: 1,
    equipped: false,
    slot: template.slot || 'mainHand',
    attuned: false,
  }
}

export const normalizeInventoryItem = (item, templates = ITEM_TEMPLATES) => {
  const templateList = ensureTemplateArray(templates)
  const templatesById = templateMap(templates)
  if (item.itemTemplateId) {
    const template = templatesById[item.itemTemplateId] || ITEM_TEMPLATES[0]
    return {
      ...createInventoryItem(template.id, templates),
      ...item,
      quantity: Math.max(0, Number(item.quantity) || 0),
      slot: item.slot || template.slot || 'mainHand',
      attuned: Boolean(item.attuned),
      equipped: Boolean(item.equipped),
    }
  }

  const matchingTemplate = templateList.find((template) => template.name.toLowerCase() === String(item.name || '').toLowerCase())
  return {
    ...createInventoryItem(matchingTemplate?.id || ITEM_TEMPLATES[0].id, templates),
    quantity: Math.max(0, Number(item.quantity) || 0),
    equipped: Boolean(item.equipped),
    description: item.description,
  }
}

export const itemWeight = (inventoryItem, templates = ITEM_TEMPLATES) => {
  const template = templateMap(templates)[inventoryItem.itemTemplateId]
  return (Number(template?.weight) || 0) * (Number(inventoryItem.quantity) || 0)
}

export const equippedInventory = (items, templates = ITEM_TEMPLATES) => items
  .map((item) => ({ item, template: templateMap(templates)[item.itemTemplateId] }))
  .filter(({ item, template }) => item.equipped && template)

export const calculateArmorClass = ({ baseDexterityModifier, inventory, templates = ITEM_TEMPLATES }) => {
  const equipped = equippedInventory(inventory, templates)
  const armor = equipped.find(({ template }) => template.type === 'armor')?.template
  let armorClass = 10 + baseDexterityModifier

  if (armor?.armorClass) {
    const dexBonus = armor.armorClass.dexterity === 'none'
      ? 0
      : armor.armorClass.dexterity === 'max2'
        ? Math.min(2, baseDexterityModifier)
        : baseDexterityModifier
    armorClass = armor.armorClass.base + dexBonus
  }

  equipped.forEach(({ template, item }) => {
    if (template.attunement && !item.attuned) return
    if (template.type === 'shield' && template.shieldBonus) {
      armorClass += Number(template.shieldBonus) || 0
    }
    template.modifiers?.forEach((modifier) => {
      if (modifier.target === 'armorClass') armorClass += Number(modifier.value) || 0
    })
  })

  return armorClass
}

export const calculateEquipmentSummary = ({ inventory, abilities, proficiencyBonus, spellcastingAbility, baseSpeed, templates = ITEM_TEMPLATES }) => {
  const equipped = equippedInventory(inventory, templates)
  const dexterityModifier = Math.floor(((Number(abilities.dexterity?.score) || 10) - 10) / 2)
  const strengthModifier = Math.floor(((Number(abilities.strength?.score) || 10) - 10) / 2)
  const spellAbilityModifier = Math.floor(((Number(abilities[spellcastingAbility]?.score) || 10) - 10) / 2)

  const bonuses = {
    armorClass: 0,
    weaponAttack: 0,
    weaponDamage: 0,
    spellAttack: 0,
    spellSaveDc: 0,
    speed: 0,
    savingThrows: 0,
  }
  const resistances = []
  const immunities = []
  const conditions = []
  const effects = []

  equipped.forEach(({ template, item }) => {
    if (template.attunement && !item.attuned) return
    effects.push(...(template.effects || []))
    template.modifiers?.forEach((modifier) => {
      if (modifier.target in bonuses) bonuses[modifier.target] += Number(modifier.value) || 0
      if (modifier.target === 'resistance') resistances.push(modifier.value)
      if (modifier.target === 'immunity') immunities.push(modifier.value)
      if (modifier.target === 'condition') conditions.push(modifier.value)
    })
  })

  const finalArmorClass = calculateArmorClass({ baseDexterityModifier: dexterityModifier, inventory, templates })
  const speed = Math.max(0, (Number(baseSpeed) || 30) + bonuses.speed)
  const weaponAttackBonus = proficiencyBonus + Math.max(strengthModifier, dexterityModifier) + bonuses.weaponAttack
  const spellAttackBonus = proficiencyBonus + spellAbilityModifier + bonuses.spellAttack
  const spellSaveDc = 8 + proficiencyBonus + spellAbilityModifier + bonuses.spellSaveDc

  return {
    bonuses,
    effects: [...new Set(effects)],
    resistances: [...new Set(resistances)],
    immunities: [...new Set(immunities)],
    conditions: [...new Set(conditions)],
    finalArmorClass,
    speed,
    weaponAttackBonus,
    spellAttackBonus,
    spellSaveDc,
  }
}
