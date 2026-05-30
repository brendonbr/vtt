



import { useState } from 'react'

import { MousePointer, Square, Circle, Pen, Trash2, Upload, X } from 'lucide-react'




function PenOptions({ tool, setTool, clearShapes}) {
  const [penMenu, setPenMenu] = useState(false)
  
    return (

      <div className="grid gap-3">
        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => setPenMenu(!penMenu)}
            className="rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:border-accent hover:bg-[#222] flex items-center"
          >
            <Pen className="w-5 h-5" />
          </button>

          <div className="absolute left-0 top-full z-10 mt-2 hidden min-w-[12rem] rounded-3xl border border-[#444] bg-secondary p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)]" style={{ display: penMenu ? 'block' : 'none' }}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setTool('select')}
                className={tool === 'select' ? 'rounded-2xl bg-primary px-4 py-2 text-background font-semibold transition hover:bg-accent flex items-center justify-start' : 'rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:bg-primary flex items-center justify-start'}
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Select
              </button>
              <button
                type="button"
                onClick={() => setTool('rect')}
                className={tool === 'rect' ? 'rounded-2xl bg-primary px-4 py-2 text-background font-semibold transition hover:bg-accent flex items-center justify-start' : 'rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:bg-primary flex items-center justify-start'}
              >
                <Square className="w-4 h-4 mr-2" />
                Rectangle
              </button>
              <button
                type="button"
                onClick={() => setTool('circle')}
                className={tool === 'circle' ? 'rounded-2xl bg-primary px-4 py-2 text-background font-semibold transition hover:bg-accent flex items-center justify-start' : 'rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:bg-primary flex items-center justify-start'}
              >
                <Circle className="w-4 h-4 mr-2" />
                Circle
              </button>
              <button
                type="button"
                onClick={() => setTool('draw')}
                className={tool === 'draw' ? 'rounded-2xl bg-primary px-4 py-2 text-background font-semibold transition hover:bg-accent flex items-center justify-start' : 'rounded-2xl border border-[#444] bg-background px-4 py-2 text-text font-semibold transition hover:bg-primary flex items-center justify-start'}
              >
                <Pen className="w-4 h-4 mr-2" />
                Draw
              </button>
              <button
                type="button"
                onClick={clearShapes}
                className="rounded-2xl bg-red-600 px-4 py-2 text-background font-semibold transition hover:bg-red-500 flex items-center justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Shapes
              </button>
            </div>
          </div>
        </div>


      </div>

  )
}

export default PenOptions