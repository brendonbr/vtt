import {
  BookOpen,
  Circle,
  Grid3X3,
  Hand,
  Images,
  MessageSquare,
  MousePointer2,
  PenLine,
  Ruler,
  Users,
} from 'lucide-react'

const PAGE_HOST = window.location.hostname
const API_HOST = PAGE_HOST === '127.0.0.1' ? '127.0.0.1' : 'localhost'

export const API_BASE = `http://${API_HOST}:8002`
export const WS_BASE = `ws://${API_HOST}:8002`

export const toolOptions = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pan', label: 'Move Map', icon: Hand },
  { id: 'ruler', label: 'Ruler', icon: Ruler },
  { id: 'draw', label: 'Draw', icon: PenLine },
  { id: 'rect', label: 'Area', icon: Grid3X3 },
  { id: 'circle', label: 'Aura', icon: Circle },
]

export const drawToolOptions = toolOptions.filter((option) => !['select', 'pan', 'ruler'].includes(option.id))

export const panelOptions = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'characters', label: 'Sheets', icon: BookOpen },
  { id: 'media', label: 'Media', icon: Images },
  { id: 'users', label: 'Party', icon: Users },
]

export const defaultScenes = [
  { name: 'Ashen Keep', subtitle: 'Ruined fortress gate', status: 'live' },
  { name: 'Moonwell Road', subtitle: 'Travel encounter', status: 'prepared' },
  { name: 'Glass Market', subtitle: 'Social scene', status: 'draft' },
]
