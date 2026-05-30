
import { useState } from 'react'

import { MousePointer, Square, Circle, Pen, Trash2, Upload, X } from 'lucide-react'

import PenOptions from './penOptions'
import DiceRoller from './diceRoller'
function MapSidebar({ tool, setTool, clearShapes, messages, setMessages }) {

  return (
    <section className="rounded-2xl h-full border border-[#333] bg-secondary p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] space-y-4">
      <PenOptions tool={tool} setTool={setTool} clearShapes={clearShapes} />

      <DiceRoller messages={messages} setMessages={setMessages} />


    </section>
  )
}

export default MapSidebar
