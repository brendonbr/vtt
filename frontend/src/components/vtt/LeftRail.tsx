import {
  Dices,
  Hand,
  MousePointer2,
  PenLine,
  Ruler,

  Trash2,
} from 'lucide-react'
import DiceRoller from '../mapToolsSidebar/diceRoller'
import InitiativeTracker from '../InitiativeTracker'
function LeftRail({
  activeDrawTool,
  drawToolOptions,
  leftFlyout,
  messages,
  setLeftFlyout,
  setMessages,
  setShapes,
  setTool,
  tool,
}) {
  return (
    <aside className="left-rail">
      <div className="rail-section">
        <button
          className={`tool-button ${tool === 'select' ? 'active' : ''}`}
          title="Select"
          type="button"
          onClick={() => {
            setTool('select')
            setLeftFlyout(null)
          }}
        >
          <MousePointer2 size={19} />
        </button>
        <button
          className={`tool-button ${tool === 'pan' ? 'active' : ''}`}
          title="Hold and move map"
          type="button"
          onClick={() => {
            setTool('pan')
            setLeftFlyout(null)
          }}
        >
          <Hand size={19} />
        </button>
        <button
          className={`tool-button ${tool === 'ruler' ? 'active' : ''}`}
          title="Ruler"
          type="button"
          onClick={() => {
            setTool('ruler')
            setLeftFlyout(null)
          }}
        >
          <Ruler size={19} />
        </button>
        <button
          className={`tool-button ${activeDrawTool || leftFlyout === 'draw' ? 'active' : ''}`}
          title="Draw tools"
          type="button"
          onClick={() => setLeftFlyout((open) => (open === 'draw' ? null : 'draw'))}
        >
          <PenLine size={19} />
        </button>
        <button className="tool-button danger" title="Clear drawings" type="button" onClick={() => setShapes([])}>
          <Trash2 size={19} />
        </button>

        <button
          className={`tool-button ${leftFlyout === 'dice' ? 'active' : ''}`}
          title="Dice"
          type="button"
          onClick={() => setLeftFlyout((open) => (open === 'dice' ? null : 'dice'))}
        >
          <Dices size={19} />
        </button>
      </div>


      <LeftRailFlyout
        drawToolOptions={drawToolOptions}
        leftFlyout={leftFlyout}
        messages={messages}
        setLeftFlyout={setLeftFlyout}
        setMessages={setMessages}
        setTool={setTool}
        tool={tool}
      />
    </aside>
  )
}

function LeftRailFlyout({
  drawToolOptions,
  leftFlyout,
  messages,
  setLeftFlyout,
  setMessages,
  setTool,
  tool,
}) {
  if (leftFlyout === 'draw') {
    return (
      <section className="rail-flyout draw-flyout" aria-label="Draw tools">
        <div className="panel-title">
          <PenLine size={18} />
          <span>Draw Tools</span>
        </div>
        <div className="draw-tool-list">
          {drawToolOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tool === id ? 'active' : ''}
              type="button"
              onClick={() => {
                setTool(id)
                setLeftFlyout(null)
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (leftFlyout === 'dice') {
    return (
      <section className="rail-flyout vtt-dice-dock" aria-label="Dice tray">
        <div className="panel-title">
          <Dices size={18} />
          <span>Dice Tray</span>
        </div>
        <DiceRoller messages={messages} setMessages={setMessages} />
        <div className="quick-rolls">
          {[4, 6, 8, 10, 12, 20].map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setMessages((prev) => [...prev, `Quick d${side}: ${Math.floor(Math.random() * side) + 1}`])}
            >
              d{side}
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (leftFlyout === 'initiative') {
    return (
      <section className="rail-flyout initiative-flyout" aria-label="Initiative tracker">
        <InitiativeTracker />
      </section>
    )
  }

  return null
}

export default LeftRail
