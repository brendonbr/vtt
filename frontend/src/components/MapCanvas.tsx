import { useEffect, useRef, useState } from 'react'
import { API_BASE } from './vtt/vttConfig'
const DEFAULT_MAP_SIZE = { width: 800, height: 600 }

function MapCanvas({ campaignId, distanceUnit = 'ft', gridColor = '#ffffff', gridEnabled = true, gridSize = 50, onWorldSizeChange = () => {}, pan = { x: 0, y: 0 }, selectedMap, setPan, setZoom = () => {}, shapes = [], setShapes, tool, zoom = 1 }: any) {
  const canvasRef = useRef(null)
  const imageCacheRef = useRef(new Map())
  const imageRef = useRef(null)
  const panStartRef = useRef(null)

  const [canvasVersion, setCanvasVersion] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState(null)
  const [previewShape, setPreviewShape] = useState(null)
  const [measureShape, setMeasureShape] = useState(null)
  const [isPanning, setIsPanning] = useState(false)

  const getWorldSize = (image = imageRef.current) => ({
    width: image?.naturalWidth || image?.width || DEFAULT_MAP_SIZE.width,
    height: image?.naturalHeight || image?.height || DEFAULT_MAP_SIZE.height,
  })

  const fitWorldToCanvas = (image = imageRef.current) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const world = getWorldSize(image)
    onWorldSizeChange(world)
    const padding = 48
    const availableWidth = Math.max(canvas.width - padding, 1)
    const availableHeight = Math.max(canvas.height - padding, 1)
    const fitZoom = Math.min(2.5, Math.max(0.1, Math.min(availableWidth / world.width, availableHeight / world.height)))

    setZoom(fitZoom)
    setPan({
      x: (canvas.width - world.width * fitZoom) / 2,
      y: (canvas.height - world.height * fitZoom) / 2,
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return undefined

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        setCanvasVersion((version) => version + 1)
      }
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (selectedMap && campaignId) {
      drawMap(selectedMap)
    } else {
      imageRef.current = null
      fitWorldToCanvas(null)
      drawCanvas(null, previewShape)
    }
  }, [campaignId, selectedMap])

  useEffect(() => {
    fitWorldToCanvas(imageRef.current)
  }, [canvasVersion])

  useEffect(() => {
    drawCanvas(imageRef.current, previewShape)
  }, [canvasVersion, distanceUnit, gridColor, gridEnabled, gridSize, measureShape, shapes, previewShape, zoom, pan])

  useEffect(() => {
    if (tool !== 'ruler') {
      setMeasureShape(null)
    }
  }, [tool])

  const getCanvasCoords = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
  }

  const getMapCoords = (event) => {
    const point = getCanvasCoords(event)
    return {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    }
  }

  const drawCanvas = (image, preview = null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)
    const world = getWorldSize(image)
    if (image) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      drawVisibleImage(ctx, image, world)
      if (gridEnabled) drawGrid(ctx, world, gridSize, hexToRgba(gridColor, 0.42))
    } else {
      drawDefaultMap(ctx, world)
    }
    shapes.forEach((shape) => drawShape(ctx, shape, false))
    if (preview) {
      drawShape(ctx, preview, true)
    }
    if (measureShape) {
      drawMeasure(ctx, measureShape)
    }
    ctx.restore()
  }

  const getVisibleWorldBounds = (world, overscan = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return { left: 0, top: 0, right: world.width, bottom: world.height }

    return {
      left: Math.max(0, (-pan.x / zoom) - overscan),
      top: Math.max(0, (-pan.y / zoom) - overscan),
      right: Math.min(world.width, ((canvas.width - pan.x) / zoom) + overscan),
      bottom: Math.min(world.height, ((canvas.height - pan.y) / zoom) + overscan),
    }
  }

  const drawVisibleImage = (ctx, image, world) => {
    const visible = getVisibleWorldBounds(world, 2)
    const sourceWidth = visible.right - visible.left
    const sourceHeight = visible.bottom - visible.top
    if (sourceWidth <= 0 || sourceHeight <= 0) return

    ctx.drawImage(
      image,
      visible.left,
      visible.top,
      sourceWidth,
      sourceHeight,
      visible.left,
      visible.top,
      sourceWidth,
      sourceHeight,
    )
  }

  const drawDefaultMap = (ctx, world) => {
    const gradient = ctx.createLinearGradient(0, 0, world.width, world.height)
    gradient.addColorStop(0, '#20242d')
    gradient.addColorStop(0.52, '#242a30')
    gradient.addColorStop(1, '#18191e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, world.width, world.height)

    if (gridEnabled) drawGrid(ctx, world, gridSize, hexToRgba(gridColor, 0.32))
    drawTerrain(ctx)
    drawTokens(ctx)
  }

  const drawGrid = (ctx, world, size, color) => {
    if (size <= 0) return

    const visible = getVisibleWorldBounds(world, size)
    const startX = Math.max(0, Math.floor(visible.left / size) * size)
    const startY = Math.max(0, Math.floor(visible.top / size) * size)

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 1 / zoom
    ctx.beginPath()
    for (let x = startX; x <= visible.right; x += size) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, world.height)
    }
    for (let y = startY; y <= visible.bottom; y += size) {
      ctx.moveTo(0, y)
      ctx.lineTo(world.width, y)
    }
    ctx.stroke()
    ctx.restore()
  }

  const hexToRgba = (hex, alpha) => {
    const normalized = hex.replace('#', '')
    const value = normalized.length === 3
      ? normalized.split('').map((char) => char + char).join('')
      : normalized
    const numeric = Number.parseInt(value, 16)
    const red = (numeric >> 16) & 255
    const green = (numeric >> 8) & 255
    const blue = numeric & 255
    return `rgba(${red},${green},${blue},${alpha})`
  }

  const drawTerrain = (ctx) => {
    ctx.save()
    ctx.fillStyle = 'rgba(82, 104, 87, 0.35)'
    ctx.beginPath()
    ctx.ellipse(190, 180, 115, 70, -0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(99, 85, 68, 0.45)'
    ctx.fillRect(430, 120, 180, 105)
    ctx.fillRect(515, 225, 95, 155)

    ctx.strokeStyle = 'rgba(244, 223, 169, 0.35)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(20, 515)
    ctx.bezierCurveTo(185, 430, 320, 520, 485, 440)
    ctx.bezierCurveTo(600, 385, 670, 420, 800, 350)
    ctx.stroke()
    ctx.restore()
  }

  const drawTokens = (ctx) => {
    const tokens = [
      { x: 260, y: 320, color: '#7dd3fc', label: 'A' },
      { x: 325, y: 330, color: '#c4b5fd', label: 'M' },
      { x: 560, y: 260, color: '#fb7185', label: 'G' },
      { x: 610, y: 305, color: '#f59e0b', label: 'O' },
    ]

    tokens.forEach((token) => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(token.x, token.y, 19, 0, Math.PI * 2)
      ctx.fillStyle = token.color
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(12, 14, 20, 0.85)'
      ctx.stroke()
      ctx.fillStyle = '#101217'
      ctx.font = '700 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(token.label, token.x, token.y + 1)
      ctx.restore()
    })
  }

  const drawShape = (ctx, shape, preview) => {
    if (!shape) return
    ctx.save()
    ctx.strokeStyle = preview ? 'rgba(255,255,255,0.8)' : '#00ffff'
    ctx.fillStyle = preview ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,255,0.1)'
    ctx.lineWidth = preview ? 2 : 3
    if (shape.type === 'rect') {
      ctx.strokeRect(shape.x, shape.y, shape.w, shape.h)
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h)
    }
    if (shape.type === 'circle') {
      ctx.beginPath()
      ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    if (shape.type === 'draw') {
      ctx.beginPath()
      shape.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawMeasure = (ctx, shape) => {
    const dx = shape.end.x - shape.start.x
    const dy = shape.end.y - shape.start.y
    const pixels = Math.hypot(dx, dy)
    const squares = pixels / gridSize
    const distance = distanceUnit === 'm' ? squares * 1.5 : squares * 5
    const unitLabel = distanceUnit === 'm' ? 'm' : 'ft'
    const label = `${distance.toFixed(distance >= 10 ? 0 : 1)} ${unitLabel} (${squares.toFixed(1)} sq)`
    const midX = shape.start.x + dx / 2
    const midY = shape.start.y + dy / 2

    ctx.save()
    ctx.strokeStyle = '#f7df99'
    ctx.fillStyle = '#f7df99'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 7])
    ctx.beginPath()
    ctx.moveTo(shape.start.x, shape.start.y)
    ctx.lineTo(shape.end.x, shape.end.y)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.arc(shape.start.x, shape.start.y, 5, 0, Math.PI * 2)
    ctx.arc(shape.end.x, shape.end.y, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '700 14px Arial'
    const textWidth = ctx.measureText(label).width
    const labelX = midX - textWidth / 2 - 10
    const labelY = midY - 34
    ctx.fillStyle = 'rgba(12, 14, 20, 0.86)'
    ctx.strokeStyle = 'rgba(247, 223, 153, 0.65)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, textWidth + 20, 28, 7)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#f7df99'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, midX, labelY + 14)
    ctx.restore()
  }

  const startDrawing = (event) => {
    if (tool === 'pan') {
      const point = getCanvasCoords(event)
      panStartRef.current = { point, pan }
      setIsPanning(true)
      return
    }
    if (tool === 'select') return
    const point = getMapCoords(event)
    if (tool === 'ruler') {
      setIsDrawing(true)
      setStartPoint(point)
      setMeasureShape({ start: point, end: point })
      return
    }
    setIsDrawing(true)
    setStartPoint(point)
    if (tool === 'draw') {
      setPreviewShape({ type: 'draw', points: [point] })
    } else {
      setPreviewShape({ type: tool, x: point.x, y: point.y, w: 0, h: 0, r: 0 })
    }
  }

  const continueDrawing = (event) => {
    if (isPanning && panStartRef.current) {
      const point = getCanvasCoords(event)
      const { point: startPoint, pan: startPan } = panStartRef.current
      setPan({
        x: startPan.x + point.x - startPoint.x,
        y: startPan.y + point.y - startPoint.y,
      })
      return
    }
    if (!isDrawing || !startPoint) return
    const point = getMapCoords(event)
    if (tool === 'ruler') {
      setMeasureShape({ start: startPoint, end: point })
      return
    }
    if (tool === 'draw') {
      setPreviewShape((prev) => ({ ...prev, points: [...prev.points, point] }))
      return
    }
    const x = Math.min(startPoint.x, point.x)
    const y = Math.min(startPoint.y, point.y)
    const w = Math.abs(point.x - startPoint.x)
    const h = Math.abs(point.y - startPoint.y)
    const r = Math.hypot(point.x - startPoint.x, point.y - startPoint.y)
    setPreviewShape({ type: tool, x: tool === 'circle' ? startPoint.x : x, y: tool === 'circle' ? startPoint.y : y, w, h, r })
  }

  const finishDrawing = () => {
    if (isPanning) {
      panStartRef.current = null
      setIsPanning(false)
      return
    }
    if (!isDrawing || !previewShape) {
      if (tool === 'ruler') {
        setIsDrawing(false)
        return
      }
      setIsDrawing(false)
      return
    }
    if (tool === 'ruler') {
      setIsDrawing(false)
      return
    }
    setShapes((prev) => [...prev, previewShape])
    setPreviewShape(null)
    setIsDrawing(false)
  }

  const drawMap = async (filename) => {
    if (!campaignId) return

    try {
      const cacheKey = `${campaignId}:${filename}`
      const cachedImage = imageCacheRef.current.get(cacheKey)
      if (cachedImage) {
        imageRef.current = cachedImage
        fitWorldToCanvas(cachedImage)
        drawCanvas(cachedImage, previewShape)
        return
      }

      const img = new Image()
      img.crossOrigin = 'use-credentials'
      img.onload = async () => {
        if (img.decode) {
          try {
            await img.decode()
          } catch (error) {
            console.warn('Image decode fallback:', error)
          }
        }
        imageCacheRef.current.set(cacheKey, img)
        imageRef.current = img
        fitWorldToCanvas(img)
        drawCanvas(img, previewShape)
      }
      img.src = `${API_BASE}/api/campaigns/${campaignId}/maps/${encodeURIComponent(filename)}`
    } catch (error) {
      console.error('Error drawing map:', error)
    }
  }

  return (
    <article >
      <canvas
        ref={canvasRef}
        id="mapCanvas"
        width={DEFAULT_MAP_SIZE.width}
        height={DEFAULT_MAP_SIZE.height}
        onMouseDown={startDrawing}
        onMouseMove={continueDrawing}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      className={`battle-canvas ${tool === 'pan' ? 'pan-cursor' : ''} ${tool === 'ruler' ? 'ruler-cursor' : ''} ${isPanning ? 'is-panning' : ''}`}
      />
    </article>
  )
}

export default MapCanvas
