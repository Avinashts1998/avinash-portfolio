// 2D canvas artwork for the ID card faces and the lanyard strap.
// Everything is drawn in card units (u) scaled to pixels so it lines up
// exactly with the 3D geometry in HangingCard.ts.
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

const DISPLAY = '"Space Grotesk", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'
const CARD_BG = '#000000'
const CARD_SURFACE = '#0d0d10'
const MUTED = '#94a3b8'
const TEXT = '#ffffff'
const BORDER = 'rgba(255, 255, 255, 0.12)'

export interface CardSpec {
  width: number
  height: number
  depth: number
  bevel: number
  radius: number
  slot: { width: number; height: number; radius: number; fromTop: number }
}

export interface ProfileData {
  firstName: string
  lastName: string
  idNumber: string
  role: string
  available: boolean
  location: string
  experience: string
  site: string
  photo?: string
  photoFocus?: number
  photoStyle?: 'original' | 'mono' | 'duotone'
  contact: {
    email: string
    linkedin: string
    website: string
  }
  currently: string
}

export interface ThemeData {
  accent: string
  ink: string
}

export function createCardCanvas(spec: CardSpec): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = Math.round((1024 * spec.height) / spec.width)
  return canvas
}

function cardBase(ctx: CanvasRenderingContext2D, spec: CardSpec, accent: string) {
  const { width: W, height: H } = ctx.canvas
  const s = W / spec.width
  ctx.clearRect(0, 0, W, H)

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, spec.radius * s)
  ctx.clip()

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0a0a0c')
  bg.addColorStop(1, '#000000')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Faint micro-dot grid for security card texture
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)'
  for (let y = 24; y < H; y += 32) {
    for (let x = 24; x < W; x += 32) ctx.fillRect(x, y, 3, 3)
  }

  // Accent glow in the corner
  const glow = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.9)
  glow.addColorStop(0, hexA(accent, 0.16))
  glow.addColorStop(1, hexA(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Subtle border around the card edge
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()

  // Punch the lanyard slot out so the clip ring shows through.
  const sw = spec.slot.width * s
  const sh = spec.slot.height * s
  const sy = spec.slot.fromTop * s
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.roundRect(W / 2 - sw / 2, sy - sh / 2, sw, sh, spec.slot.radius * s)
  ctx.fill()
  ctx.restore()

  return { W, H, s }
}

export function drawCardFront(
  canvas: HTMLCanvasElement,
  spec: CardSpec,
  { profile, theme, photo }: { profile: ProfileData; theme: ThemeData; photo?: HTMLImageElement | null }
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { W, H } = cardBase(ctx, spec, theme.accent)
  const pad = 72

  ctx.textBaseline = 'alphabetic'
  label(ctx, 'PORTFOLIO PASS', pad, 190, MUTED)
  label(ctx, `№ ${profile.idNumber}`, W - pad, 190, MUTED, 'right')
  ctx.fillStyle = BORDER
  ctx.fillRect(pad, 214, W - pad * 2, 2)

  // Photo or initials.
  const px = pad
  const py = 254
  const ps = 400
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(px, py, ps, ps, 28)
  ctx.clip()
  ctx.fillStyle = CARD_SURFACE
  ctx.fillRect(px, py, ps, ps)
  if (photo) {
    ctx.drawImage(stylizePhoto(photo, ps, profile.photoFocus || 0.5, profile.photoStyle || 'original', theme), px, py, ps, ps)
  } else {
    ctx.fillStyle = theme.accent
    ctx.fillRect(px, py, ps, ps)
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 190px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(profile.firstName[0] + profile.lastName[0], px + ps / 2, py + ps / 2 + 8)
  }
  ctx.restore()

  // Clean border around photo
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(px, py, ps, ps, 28)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // Fields beside the photo.
  const fx = px + ps + 48
  const fw = W - pad - fx
  const fields: [string, string, boolean?][] = [
    ['BASED IN', profile.location],
    ['EXPERIENCE', profile.experience],
  ]
  ctx.textBaseline = 'alphabetic'
  fields.forEach(([k, v, dot], i) => {
    const y = py + 56 + i * 168
    label(ctx, k, fx, y, MUTED)
    let vx = fx
    if (dot) {
      ctx.fillStyle = theme.accent
      ctx.beginPath()
      ctx.arc(fx + 9, y + 47, 9, 0, Math.PI * 2)
      ctx.fill()
      vx += 30
    }
    ctx.fillStyle = TEXT
    fitText(ctx, v, vx, y + 60, fw - (vx - fx), 40, 600, DISPLAY)
  })

  // Name.
  ctx.fillStyle = TEXT
  fitText(ctx, profile.firstName.toUpperCase(), pad, 820, W - pad * 2, 140, 700, DISPLAY)
  ctx.fillStyle = theme.accent
  fitText(ctx, profile.lastName.toUpperCase(), pad, 950, W - pad * 2, 140, 700, DISPLAY)

  ctx.fillStyle = '#cbd5e1'
  fitText(ctx, `— ${profile.role.toUpperCase()}`, pad, 1030, W - pad * 2, 36, 500, MONO)

  // Access badge, beside the role line.
  const bw = 300
  const bh = 96
  const bx = W - pad - bw
  const bby = 1070
  ctx.fillStyle = theme.accent
  ctx.beginPath()
  ctx.roundRect(bx, bby, bw, bh, 18)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `500 26px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('ACCESS', bx + 24, bby + 36)
  fitText(ctx, 'ALL AREAS', bx + 24, bby + 80, bw - 48, 40, 700, DISPLAY)

  // Scannable Code 128 barcode of the site, on clean container
  const strip = { x: pad, y: H - 310, w: W - pad * 2, h: 170 }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(strip.x, strip.y, strip.w, strip.h, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#0f172a'
  code128(ctx, profile.site, strip.x, strip.y + 20, strip.w, strip.h - 40)
  label(ctx, profile.site.replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase(), pad, strip.y + strip.h + 44, MUTED)
}

export function drawCardBack(
  canvas: HTMLCanvasElement,
  spec: CardSpec,
  { profile, theme }: { profile: ProfileData; theme: ThemeData }
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { W, H } = cardBase(ctx, spec, theme.accent)
  const pad = 72

  label(ctx, '// HELLO THERE', pad, 200, MUTED)

  const lines = ["Let's build", 'something', 'great.']
  lines.forEach((t, i) => {
    ctx.fillStyle = i === lines.length - 1 ? theme.accent : TEXT
    fitText(ctx, t, pad, 330 + i * 116, W - pad * 2, 112, 700, DISPLAY)
  })

  const rows = [
    ['EMAIL', profile.contact.email],
    ['LINKEDIN', profile.contact.linkedin],
    ['WEB', profile.contact.website],
    ['CURRENTLY', profile.currently],
  ]
  ctx.fillStyle = BORDER
  ctx.fillRect(pad, 650, W - pad * 2, 2)
  rows.forEach(([k, v], i) => {
    const y = 730 + i * 112
    label(ctx, k, pad, y, MUTED)
    ctx.fillStyle = TEXT
    fitText(ctx, v, pad, y + 50, W - pad * 2, 38, 500, DISPLAY)
  })

  // Scannable QR code of the site
  try {
    const qr = QRCode.create(profile.site, { errorCorrectionLevel: 'M' }).modules
    const quiet = 2
    const cell = Math.floor(300 / (qr.size + quiet * 2))
    const tile = cell * (qr.size + quiet * 2)
    const gx = W - pad - tile
    const gy = H - pad - tile
    ctx.fillStyle = theme.accent
    ctx.beginPath()
    ctx.roundRect(gx, gy, tile, tile, 16)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.get(r, c)) ctx.fillRect(gx + (c + quiet) * cell, gy + (r + quiet) * cell, cell, cell)
      }
    }
    label(ctx, 'SCAN TO VISIT ↗', W - pad, gy - 18, MUTED, 'right')
  } catch (e) {
    // Fallback QR simulation box
    const tile = 260
    const gx = W - pad - tile
    const gy = H - pad - tile
    ctx.fillStyle = theme.accent
    ctx.beginPath()
    ctx.roundRect(gx, gy, tile, tile, 16)
    ctx.fill()
  }

  label(ctx, 'IF FOUND, PLEASE RETURN TO', pad, H - pad - 70, MUTED)
  ctx.fillStyle = TEXT
  fitText(ctx, `${profile.firstName} ${profile.lastName}`, pad, H - pad - 16, W - pad * 3 - 300, 40, 700, DISPLAY)
}

export function createStrapCanvas(text: string, { accent }: ThemeData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const w = 128
  const font = `700 52px ${DISPLAY}`
  ctx.font = font
  const segment = Math.ceil(ctx.measureText(text).width)
  canvas.width = w
  canvas.height = segment * 2

  ctx.fillStyle = accent
  ctx.fillRect(0, 0, w, canvas.height)
  // Stitching along the edges.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  for (let y = 0; y < canvas.height; y += 14) {
    ctx.fillRect(10, y, 3, 8)
    ctx.fillRect(w - 13, y, 3, 8)
  }

  ctx.save()
  ctx.translate(w / 2, 0)
  ctx.rotate(Math.PI / 2)
  ctx.font = font
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)
  ctx.fillText(text, segment, 0)
  ctx.restore()
  return canvas
}

// Tiling woven-rib pattern, used as a bump map on the strap.
export function createWeaveCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const rnd = seeded('weave')
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const rib = y % 4 < 2 ? 190 : 80
      const v = Math.round(rib + (rnd() - 0.5) * 40)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return canvas
}

// Roughness variation for the laminate: grain plus a few faint smudges.
export function createSmudgeCanvas(): HTMLCanvasElement {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const rnd = seeded('smudge')
  ctx.fillStyle = 'rgb(105,105,105)'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 16; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 20 + rnd() * 60
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(170,170,170,${0.1 + rnd() * 0.15})`)
    g.addColorStop(1, 'rgba(200,200,200,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 18
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

// Rays and rings that drive the hologram seal's iridescence thickness.
export function createHoloCanvas(): HTMLCanvasElement {
  const size = 256
  const c = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  for (let i = 0; i < 48; i++) {
    const a0 = (i / 48) * Math.PI * 2
    const a1 = ((i + 1) / 48) * Math.PI * 2
    const v = i % 2 ? 230 : 60
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.beginPath()
    ctx.moveTo(c, c)
    ctx.arc(c, c, c, a0, a1)
    ctx.fill()
  }
  ctx.lineWidth = 6
  for (let r = 20; r < c; r += 22) {
    ctx.strokeStyle = `rgba(255,255,255,${r % 44 ? 0.5 : 0.2})`
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 22 : 54
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r)
  }
  ctx.fill()
  return canvas
}

const photoCache = new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement }>()

function stylizePhoto(
  img: HTMLImageElement,
  size: number,
  focus = 0.5,
  style = 'original',
  { accent, ink }: ThemeData
): HTMLCanvasElement {
  const key = `${size}:${focus}:${style}`
  const cached = photoCache.get(img)
  if (cached?.key === key) return cached.canvas

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Pre-fill clean surface
  ctx.fillStyle = CARD_SURFACE
  ctx.fillRect(0, 0, size, size)

  // Proper headroom framing so the head is never cropped at the top
  const aspect = img.width / img.height
  const scale = 0.88
  let drawW: number
  let drawH: number
  let drawX: number
  let drawY: number

  if (aspect >= 1) {
    drawH = Math.round(size * scale)
    drawW = Math.round(drawH * aspect)
    drawX = Math.round((size - drawW) / 2)
    drawY = Math.round(size * 0.09)
  } else {
    drawW = Math.round(size * scale)
    drawH = Math.round(drawW / aspect)
    drawX = Math.round((size - drawW) / 2)
    // Breathing space above the head (~9% of frame, or roughly 36px)
    const focusShift = (focus - 0.5) * size * 0.3
    drawY = Math.round(size * 0.09 - focusShift)
  }

  ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH)
  if (style === 'mono') {
    const data = ctx.getImageData(0, 0, size, size)
    const px = data.data
    for (let i = 0; i < px.length; i += 4) {
      const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
      const lifted = Math.pow(clamp((l - 0.02) / 0.94, 0, 1), 0.82)
      const v = 255 * (lifted * 0.7 + smooth(0, 1, lifted) * 0.3)
      px[i] = px[i + 1] = px[i + 2] = v
    }
    ctx.putImageData(data, 0, 0)
  }
  if (style !== 'duotone') {
    photoCache.set(img, { key, canvas })
    return canvas
  }

  const inkRgb = rgb(ink)
  const accentRgb = rgb(accent)
  const stops = [
    inkRgb,
    mix(inkRgb, accentRgb, 0.1),
    mix(inkRgb, accentRgb, 0.65),
    mix(accentRgb, [255, 255, 255], 0.6),
  ]
  const data = ctx.getImageData(0, 0, size, size)
  const px = data.data
  const c = size / 2
  for (let i = 0; i < px.length; i += 4) {
    let l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255
    const p = i / 4
    const d = Math.hypot((p % size) - c, Math.floor(p / size) - c * 0.9) / (c * 1.25)
    l *= 1 - 0.55 * smooth(0.45, 1, d)
    const t = smooth(0.06, 0.94, l) * (stops.length - 1)
    const k = Math.min(stops.length - 2, Math.floor(t))
    const [r, g, b] = mix(stops[k], stops[k + 1], t - k)
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
  }
  ctx.putImageData(data, 0, 0)
  photoCache.set(img, { key, canvas })
  return canvas
}

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t)
}

function smooth(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = `500 28px ${MONO}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, maxSize: number, weight: number, family: string) {
  let size = maxSize
  ctx.font = `${weight} ${size}px ${family}`
  const w = ctx.measureText(text).width
  if (w > maxWidth) {
    size = Math.floor((maxSize * maxWidth) / w)
    ctx.font = `${weight} ${size}px ${family}`
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

function code128(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  try {
    const encoded: any = {}
    JsBarcode(encoded, text, { format: 'CODE128' })
    if (encoded.encodings && encoded.encodings.length > 0) {
      const bits = encoded.encodings.map((e: any) => e.data).join('')
      const module = Math.max(1, Math.floor(w / (bits.length + 20)))
      let cx = x + Math.round((w - bits.length * module) / 2)
      for (const bit of bits) {
        if (bit === '1') ctx.fillRect(cx, y, module, h)
        cx += module
      }
      return
    }
  } catch (e) {
    // fallback if barcode encoding encountered unusual characters
  }

  // Robust procedural code128 fallback stripes
  const pattern = [3, 2, 4, 1, 2, 5, 2, 1, 3, 4, 2, 3, 1, 4, 2, 5, 1, 2, 4, 3, 2, 1, 5, 2, 3, 4, 1, 2, 3, 5]
  let cx = x + 20
  for (let i = 0; i < pattern.length && cx < x + w - 20; i++) {
    const mw = pattern[i] * 2
    if (i % 2 === 0) ctx.fillRect(cx, y, mw, h)
    cx += mw + 3
  }
}

function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
