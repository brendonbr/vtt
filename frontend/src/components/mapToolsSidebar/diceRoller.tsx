import { useState } from 'react'

import { Dices } from 'lucide-react'
import { API_BASE } from '../vtt/vttConfig'

function DiceRoller({ messages, setMessages }) {
  const [diceCount, setDiceCount] = useState(1)
  const [diceSides, setDiceSides] = useState(20)
  const [rollMenu, setRollMenu] = useState(false)

  const rollDice = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dice/roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dice_type: `d${parseInt(diceSides)}`,
          num_rolls: parseInt(diceCount),
        }),
      })
      const data = await response.json()
      if (data.error) {
        setMessages(prev => [...prev, `Error: ${data.error}`])
      } else {
        const rollsStr = data.rolls.join(', ')
        setMessages(prev => [...prev, `Rolled ${diceCount}d${diceSides}: [${rollsStr}] = ${data.total}`])
        setRollMenu(false)
      }
    } catch (error) {
      setMessages(prev => [...prev, `Error rolling dice: ${error.message}`])
    }
  }

  return (
    <div className="grid gap-4">
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => setRollMenu((open) => !open)}
          className="rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:border-accent hover:bg-[#222] flex items-center"
        >
          <Dices className="w-5 h-5" />
        </button>

        {rollMenu && (
          <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-3xl border border-[#444] bg-secondary p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-text">
                <span>Number of dice</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={diceCount}
                  onChange={(e) => setDiceCount(e.target.value)}
                  className="w-full rounded-2xl border border-[#444] bg-background px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-text">
                <span>Dice sides</span>
                <input
                  type="number"
                  min="2"
                  max="1000"
                  value={diceSides}
                  onChange={(e) => setDiceSides(e.target.value)}
                  className="w-full rounded-2xl border border-[#444] bg-background px-4 py-3 text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>

              <button
                type="button"
                onClick={rollDice}
                className="rounded-2xl bg-primary px-4 py-3 text-background font-semibold transition hover:bg-accent"
              >
                Roll {diceCount}d{diceSides}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiceRoller
