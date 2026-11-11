import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { gsap } from 'gsap'
import {
  CardSpec,
  ProfileData,
  ThemeData,
  createCardCanvas,
  drawCardFront,
  drawCardBack,
  createStrapCanvas,
  createWeaveCanvas,
  createSmudgeCanvas,
  createHoloCanvas,
} from './cardTextures'
import { MotionInput } from './MotionInput'

// Card dimensions in world units (roughly a CR80 badge, scaled up).
const CARD: CardSpec = {
  width: 2.6,
  height: 3.8,
  depth: 0.03,
  bevel: 0.007,
  radius: 0.14,
  slot: { width: 0.5, height: 0.1, radius: 0.045, fromTop: 0.22 },
}
// Distance from the strap end (top of the crimp) down to the slot.
const CLIP_TO_SLOT = 0.5
// Pivot (crimp top) to card centre — the "stick" of the card's rigid body.
const PIVOT_TO_CENTER = CLIP_TO_SLOT + CARD.height / 2 - CARD.slot.fromTop
// Hologram seal, in card coordinates (sits on the photo's corner).
const SEAL = { x: -0.15, y: 0.3, radius: 0.13 }

// Lanyard: a loop seen as two strands meeting at the crimp.
const STRAP_WIDTH = 0.34
const STRAP_SPREAD = 0.3
const STRAP_LAYER = 0.014
const STRAP_SAMPLES = 56
const ROPE_SEGMENTS = 12
// Elastic strap: fraction of the stretch corrected per iteration, and a hard cap.
const STRAP_STIFFNESS = 0.06
const STRAP_MAX_STRETCH = 1.5
// Measured sag (world units, independent of strap length) under the card's
// weight at that stiffness; the rest length is shortened by this so the card
// still hangs where the layout puts it.
const STRAP_SAG = 0.33
// Pull-switch: how far below its resting height the card must be pulled.
const PULL_TRIGGER = 0.6
const FOV = 30

// Physics
const STEP = 1 / 120
const GRAVITY = -26
const DAMPING = 0.993
const ITERATIONS = 16
const YAW_STIFFNESS = 28
const YAW_DAMPING = 3.2
const YAW_TWIST = 0.9
const MAX_SPEED = 28
const LIGHT_OFFSET = new THREE.Vector3(4, 6, 8)
// Phone motion: how far tilt may swing "down" away from the screen's bottom,
// and how strongly shakes (m/s²) push the card. 2.65 ≈ GRAVITY / 9.81.
const MAX_TILT = THREE.MathUtils.degToRad(40)
const SHAKE_GAIN = 2.65 * 2.5
const SHAKE_MAX = 120
const SHAKE_SPIN = 0.6
// Idle drift at rest: the card sways gently towards/away from the viewer
// (pitch about the clip) and turns a little, with random-looking timing.
const IDLE_PITCH = THREE.MathUtils.degToRad(6)
const IDLE_YAW = 0.12

export interface Particle {
  x: number
  y: number
  px: number
  py: number
  w: number
}

export interface Constraint {
  a: Particle
  b: Particle
  rest: number
  stiffness?: number
  maxStretch?: number
}

export interface Strand {
  side: number
  mesh: THREE.Mesh
  curvePoints: THREE.Vector3[]
  curve: THREE.CatmullRomCurve3
  particles: Particle[]
}

export interface HangingCardOptions {
  profile: ProfileData
  theme: ThemeData
  mode?: string
  reducedMotion?: boolean
  onPull?: (progress: number) => void
  onToggle?: (origin: { x: number; y: number }) => void
}

export class HangingCard {
  container: HTMLElement
  profile: ProfileData
  theme: ThemeData
  reducedMotion: boolean
  onPull?: (progress: number) => void
  onToggle?: (origin: { x: number; y: number }) => void
  pullProgress = 0
  active = true
  accumulator = 0
  time = 0

  anchor = { x: 0, y: 0 }
  rest?: { x: number; y: number }
  hangDepth = 0
  strandLength = 3
  strapRest = 2.5
  maxStretch = 1.5
  strapRepeat = 1
  yaw = 0
  yawVelocity = 0
  yawTarget = 0
  drag: {
    id: number
    s: number
    offset: { x: number; y: number }
    target: { x: number; y: number }
    startX: number
    startY: number
    startT: number
  } | null = null
  pointer = { x: 0, y: 0 }
  parallax = { x: 0, y: 0 }
  idle = 1
  pitchNoise: (t: number) => number
  yawNoise: (t: number) => number

  raycaster = new THREE.Raycaster()
  plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  tmpV = new THREE.Vector3()
  ndc = new THREE.Vector2()
  textures: THREE.Texture[] = []

  renderer!: THREE.WebGLRenderer
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  cameraZ = 10
  envTexture!: THREE.Texture
  key!: THREE.DirectionalLight
  wall!: THREE.Mesh
  cardGroup!: THREE.Group
  swivel!: THREE.Group
  body!: THREE.Mesh
  frontCanvas!: HTMLCanvasElement
  backCanvas!: HTMLCanvasElement
  frontTexture!: THREE.CanvasTexture
  backTexture!: THREE.CanvasTexture
  photo: HTMLImageElement | null = null
  crimp!: THREE.Mesh
  strands: Strand[] = []
  samples: THREE.Vector3[] = []
  clip!: Particle
  center!: Particle
  particles: Particle[] = []
  constraints: Constraint[] = []
  strandConstraints: Constraint[] = []
  motion?: MotionInput
  disposed = false
  introTimeline?: gsap.core.Timeline

  private onPointerDownHandler!: (e: PointerEvent) => void
  private onPointerMoveHandler!: (e: PointerEvent) => void
  private onPointerUpHandler!: (e: PointerEvent) => void
  private onTouchStartHandler!: (e: TouchEvent) => void
  private onTouchEndHandler!: () => void
  private onVisibilityHandler!: () => void

  constructor(container: HTMLElement, { profile, theme, mode = 'dark', reducedMotion = false, onPull, onToggle }: HangingCardOptions) {
    this.container = container
    this.profile = profile
    this.theme = theme
    this.reducedMotion = reducedMotion
    this.onPull = onPull
    this.onToggle = onToggle
    this.idle = reducedMotion ? 0 : 1
    this.pitchNoise = smoothNoise()
    this.yawNoise = smoothNoise()

    this.initRenderer()
    this.initScene()
    this.initCard()
    this.initStrap()
    this.initParticles()
    this.bindEvents()

    if (MotionInput.supported) this.motion = new MotionInput()

    this.setMode(mode)
    this.resize()
    this.intro()

    this.tick = this.tick.bind(this)
    gsap.ticker.add(this.tick)
  }

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.className = 'idcard-canvas'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.touchAction = 'pan-y'
    this.container.appendChild(renderer.domElement)
    this.renderer = renderer
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 1, 200)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    this.scene.environment = this.envTexture
    this.scene.environmentIntensity = 0.3

    // Key light follows the card so its shadow map stays tight around it.
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = key.shadow.camera.bottom = -4
    key.shadow.camera.right = key.shadow.camera.top = 4
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    key.shadow.radius = 6
    key.shadow.normalBias = 0.02
    this.scene.add(key, key.target)
    this.key = key

    const rim = new THREE.DirectionalLight(this.theme.accent, 0.8)
    rim.position.set(-6, 2, -4)
    this.scene.add(rim, new THREE.AmbientLight('#ffffff', 0.25))

    this.wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.3 }))
    this.wall.position.z = -(CARD.width / 2 + 0.4)
    this.wall.receiveShadow = true
    this.scene.add(this.wall)
  }

  setMode(mode: string) {
    const light = mode === 'light'
    this.scene.environmentIntensity = light ? 0.28 : 0.3
    this.key.intensity = light ? 1.4 : 1.6
    ;(this.wall.material as THREE.ShadowMaterial).opacity = light ? 0.1 : 0.3
  }

  initCard() {
    this.cardGroup = new THREE.Group()
    this.swivel = new THREE.Group()
    this.cardGroup.add(this.swivel)
    this.scene.add(this.cardGroup)

    const card = new THREE.Group()
    card.position.y = -PIVOT_TO_CENTER
    this.swivel.add(card)

    // Body: white PVC core, bevelled, with the slot cut through it.
    const b = CARD.bevel
    const shape = roundedRect(new THREE.Shape(), CARD.width - b * 2, CARD.height - b * 2, CARD.radius - b, 0, 0)
    const s = CARD.slot
    shape.holes.push(
      roundedRect(new THREE.Path(), s.width + b * 2, s.height + b * 2, s.radius + b, 0, CARD.height / 2 - s.fromTop)
    )
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: CARD.depth,
      bevelEnabled: true,
      bevelSize: b,
      bevelThickness: b,
      bevelSegments: 3,
      curveSegments: 12,
    })
    bodyGeo.translate(0, 0, -CARD.depth / 2)
    const coreMat = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.55 })
    this.body = new THREE.Mesh(bodyGeo, coreMat)
    this.body.castShadow = true
    card.add(this.body)

    // Printed faces, laminated: smudgy roughness + a thin clearcoat.
    this.frontCanvas = createCardCanvas(CARD)
    this.backCanvas = createCardCanvas(CARD)
    this.frontTexture = this.makeTexture(this.frontCanvas)
    this.backTexture = this.makeTexture(this.backCanvas)
    this.drawFaces()

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => !this.disposed && this.drawFaces())
    }

    const smudge = this.makeTexture(createSmudgeCanvas(), false)
    const faceGeo = new THREE.PlaneGeometry(CARD.width, CARD.height)
    const faceMat = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        alphaTest: 0.5,
        roughness: 1,
        roughnessMap: smudge,
        clearcoat: 0.45,
        clearcoatRoughness: 0.45,
        clearcoatRoughnessMap: smudge,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    const faceZ = CARD.depth / 2 + b + 0.0005
    const front = new THREE.Mesh(faceGeo, faceMat(this.frontTexture))
    front.position.z = faceZ
    const back = new THREE.Mesh(faceGeo, faceMat(this.backTexture))
    back.rotation.y = Math.PI
    back.position.z = -faceZ
    card.add(front, back)

    this.buildHardware()

    if (this.profile.photo) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (this.disposed) return
        this.photo = img
        this.drawFaces()
      }
      img.src = this.profile.photo
    }
  }

  buildHardware() {
    const metal = new THREE.MeshStandardMaterial({ color: '#d4d7dd', metalness: 1, roughness: 0.25 })
    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, { x = 0, y = 0, z = 0, rx = 0, ry = 0 } = {}) => {
      const m = new THREE.Mesh(geo, metal)
      m.position.set(x, y, z)
      m.rotation.set(rx, ry, 0)
      m.castShadow = true
      parent.add(m)
      return m
    }

    this.crimp = add(this.cardGroup, new RoundedBoxGeometry(0.42, 0.17, 0.075, 3, 0.025), { y: -0.07 })
    add(this.cardGroup, new THREE.TorusGeometry(0.045, 0.014, 10, 24), { y: -0.17, ry: Math.PI / 2 })

    add(this.swivel, new THREE.CylinderGeometry(0.028, 0.028, 0.06, 16), { y: -0.22 })
    const claw = add(this.swivel, new THREE.TorusGeometry(0.1, 0.02, 12, 48), { y: -0.37, ry: Math.PI / 2 })
    claw.scale.set(1, 1.5, 1)
    add(this.swivel, new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), { y: -0.36, z: 0.085 })
    add(this.swivel, new RoundedBoxGeometry(0.03, 0.05, 0.04, 2, 0.01), { y: -0.31, z: 0.12 })
  }

  makeTexture(canvas: HTMLCanvasElement, color = true): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas)
    if (color) tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    this.textures.push(tex)
    return tex
  }

  drawFaces() {
    const data = { profile: this.profile, theme: this.theme, photo: this.photo }
    drawCardFront(this.frontCanvas, CARD, data)
    drawCardBack(this.backCanvas, CARD, data)
    this.frontTexture.needsUpdate = true
    this.backTexture.needsUpdate = true
  }

  initStrap() {
    const name = `${this.profile.firstName} ${this.profile.lastName}`.toUpperCase()
    const canvas = createStrapCanvas(`${name}  ✦  `, this.theme)
    const map = this.makeTexture(canvas)
    map.wrapT = THREE.RepeatWrapping
    this.strapRepeat = STRAP_WIDTH * (canvas.height / canvas.width)

    const weave = this.makeTexture(createWeaveCanvas(), false)
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping
    weave.repeat.set(6, this.strapRepeat / 0.03)

    const material = new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.9,
      bumpMap: weave,
      bumpScale: 0.6,
      sheen: 0.6,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#ffffff'),
      side: THREE.DoubleSide,
    })

    const count = (STRAP_SAMPLES + 1) * 2
    const index: number[] = []
    for (let i = 0; i < STRAP_SAMPLES; i++) {
      const a = i * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const dynamic = (size: number) =>
      new THREE.BufferAttribute(new Float32Array(count * size), size).setUsage(THREE.DynamicDrawUsage)

    this.strands = [-1, 1].map((side) => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', dynamic(3))
      geo.setAttribute('normal', dynamic(3))
      geo.setAttribute('uv', dynamic(2))
      geo.setIndex(index)
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.castShadow = true
      this.scene.add(mesh)
      const curvePoints = Array.from({ length: ROPE_SEGMENTS + 1 }, () => new THREE.Vector3())
      const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal')
      return {
        side,
        mesh,
        curvePoints,
        curve,
        particles: [],
      }
    })
    this.samples = Array.from({ length: STRAP_SAMPLES + 1 }, () => new THREE.Vector3())
  }

  initParticles() {
    const particle = (w: number): Particle => ({ x: 0, y: 0, px: 0, py: 0, w })
    this.clip = particle(0.6)
    this.center = particle(0.25)
    this.particles = [this.clip, this.center]
    this.constraints = [{ a: this.clip, b: this.center, rest: PIVOT_TO_CENTER }]
    this.strandConstraints = []

    for (const strand of this.strands) {
      strand.particles = Array.from({ length: ROPE_SEGMENTS }, (_, i) => particle(i === 0 ? 0 : 1))
      this.particles.push(...strand.particles)
      const chain = [...strand.particles, this.clip]
      for (let i = 0; i < ROPE_SEGMENTS; i++) {
        const c: Constraint = { a: chain[i], b: chain[i + 1], rest: 0, stiffness: STRAP_STIFFNESS, maxStretch: Infinity }
        this.constraints.push(c)
        this.strandConstraints.push(c)
      }
    }
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) {
      if (!this.disposed) {
        requestAnimationFrame(() => {
          if (!this.disposed && this.container.clientWidth > 0 && this.container.clientHeight > 0) {
            this.resize()
          }
        })
      }
      return
    }
    this.renderer.setSize(w, h, true)
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.camera.aspect = w / h

    const refH = Math.min(h, window.innerHeight)
    // Scale card up to feel prominent, readable, and bold on mobile screens
    const cardPx = clamp(refH * 0.56, 315, 450)
    const unitsPerPx = CARD.height / cardPx
    const visH = h * unitsPerPx
    this.cameraZ = visH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    this.camera.position.set(0, 0, this.cameraZ)
    this.camera.updateProjectionMatrix()

    const anchorX = 0
    const anchorY = visH / 2
    // Position clip with balanced drop: connects directly under header Ask AI element and sits close to hero section
    const clipTopPx = clamp(refH * 0.13, 64, 85)
    const clipY = visH / 2 - clipTopPx * unitsPerPx
    this.hangDepth = anchorY - clipY
    this.strandLength = Math.hypot(STRAP_SPREAD, this.hangDepth)
    this.strapRest = Math.max(this.strandLength - STRAP_SAG, this.strandLength * 0.5)
    this.maxStretch = Math.max(STRAP_MAX_STRETCH, (this.strandLength + PULL_TRIGGER * 1.5) / this.strapRest)
    for (const c of this.strandConstraints) {
      c.rest = this.strapRest / ROPE_SEGMENTS
      c.maxStretch = this.maxStretch
    }

    const first = !this.rest
    this.rest = { x: anchorX, y: anchorY }
    if (first) {
      this.anchor.x = anchorX
      this.anchor.y = anchorY
      this.layChain()
    } else if (!this.introTimeline?.isActive()) {
      const dx = anchorX - this.anchor.x
      const dy = anchorY - this.anchor.y
      this.anchor.x = anchorX
      this.anchor.y = anchorY
      for (const p of this.particles) {
        p.x += dx
        p.px += dx
        p.y += dy
        p.py += dy
      }
    }
  }

  layChain() {
    const { x, y } = this.anchor
    const clipY = y - Math.sqrt(this.strandLength ** 2 - STRAP_SPREAD ** 2)
    setAt(this.clip, x, clipY)
    setAt(this.center, x, clipY - PIVOT_TO_CENTER)
    for (const strand of this.strands) {
      strand.particles.forEach((p, i) => {
        const t = i / ROPE_SEGMENTS
        setAt(p, x + strand.side * STRAP_SPREAD * (1 - t), y + (clipY - y) * t)
      })
    }
  }

  intro() {
    if (this.reducedMotion || !this.rest) return
    const drop = this.strandLength + PIVOT_TO_CENTER + CARD.height
    this.anchor.y += drop
    this.anchor.x = 0
    this.layChain()
    this.yawTarget = -Math.PI * 2
    this.yaw = this.yawTarget

    this.introTimeline = gsap
      .timeline({ delay: 0.25, onComplete: () => this.resize() })
      .to(this.anchor, { y: () => this.rest!.y, duration: 1.2, ease: 'power3.out' }, 0)
      .to(this.anchor, { x: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(this, { yawTarget: 0, duration: 1.8, ease: 'power3.out' }, 0.15)
      .call(() => this.push(-0.4), undefined, 0.85)
  }

  push(vx: number) {
    const d = vx * STEP
    this.center.px -= d
    this.clip.px -= d * 0.4
  }

  bindEvents() {
    const el = this.renderer.domElement
    this.onPointerDownHandler = (e: PointerEvent) => {
      const hit = this.hitTest(e.clientX, e.clientY)
      if (!hit) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
      const local = this.cardGroup.worldToLocal(hit.point.clone())
      const s = clamp(-local.y / PIVOT_TO_CENTER, 0, 1.9)
      const px = this.clip.x + (this.center.x - this.clip.x) * s
      const py = this.clip.y + (this.center.y - this.clip.y) * s
      this.drag = {
        id: e.pointerId,
        s,
        offset: { x: px - hit.point.x, y: py - hit.point.y },
        target: { x: px, y: py },
        startX: e.clientX,
        startY: e.clientY,
        startT: performance.now(),
      }
      el.style.cursor = 'grabbing'
    }

    this.onPointerMoveHandler = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      if (this.drag && e.pointerId === this.drag.id) {
        const p = this.pointerToWorld(e.clientX, e.clientY)
        if (p) {
          this.drag.target.x = p.x + this.drag.offset.x
          this.drag.target.y = p.y + this.drag.offset.y
        }
      } else if (e.pointerType === 'mouse') {
        el.style.cursor = this.hitTest(e.clientX, e.clientY) ? 'grab' : ''
      }
    }

    this.onPointerUpHandler = (e: PointerEvent) => {
      if (!this.drag || e.pointerId !== this.drag.id) return
      if (e.type === 'pointerup') this.motion?.requestPermission()
      const moved = Math.hypot(e.clientX - this.drag.startX, e.clientY - this.drag.startY)
      if (e.type === 'pointerup' && moved < 6 && performance.now() - this.drag.startT < 350) this.flip()
      if (this.pullProgress >= 1 && e.type === 'pointerup') this.onToggle?.({ x: e.clientX, y: e.clientY })
      this.setPull(0)
      this.drag = null
      this.limitSpeed()
      el.style.cursor = e.pointerType === 'mouse' ? 'grab' : ''
    }

    this.onTouchStartHandler = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t && this.hitTest(t.clientX, t.clientY)) e.preventDefault()
    }

    this.onTouchEndHandler = () => this.motion?.requestPermission()

    this.onVisibilityHandler = () => {
      this.accumulator = 0
    }

    el.addEventListener('pointerdown', this.onPointerDownHandler)
    el.addEventListener('touchstart', this.onTouchStartHandler, { passive: false })
    window.addEventListener('touchend', this.onTouchEndHandler)
    window.addEventListener('pointermove', this.onPointerMoveHandler)
    window.addEventListener('pointerup', this.onPointerUpHandler)
    window.addEventListener('pointercancel', this.onPointerUpHandler)
    document.addEventListener('visibilitychange', this.onVisibilityHandler)
  }

  setNdc(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.ndc, this.camera)
  }

  hitTest(clientX: number, clientY: number) {
    this.setNdc(clientX, clientY)
    return this.raycaster.intersectObject(this.body, false)[0] || null
  }

  pointerToWorld(clientX: number, clientY: number) {
    this.setNdc(clientX, clientY)
    return this.raycaster.ray.intersectPlane(this.plane, this.tmpV)
  }

  setPull(progress: number) {
    const p = Math.round(clamp(progress, 0, 1) * 20) / 20
    if (p === this.pullProgress) return
    this.pullProgress = p
    this.onPull?.(p)
  }

  flip() {
    this.yawTarget = Math.round(this.yawTarget / Math.PI) * Math.PI + Math.PI
  }

  limitSpeed() {
    const max = MAX_SPEED * STEP
    for (const p of this.particles) {
      const vx = p.x - p.px
      const vy = p.y - p.py
      const v = Math.hypot(vx, vy)
      if (v > max) {
        p.px = p.x - (vx / v) * max
        p.py = p.y - (vy / v) * max
      }
    }
  }

  step(dt: number) {
    for (const strand of this.strands) {
      setAt(strand.particles[0], this.anchor.x + strand.side * STRAP_SPREAD, this.anchor.y)
    }

    let ax = 0
    let ay = GRAVITY
    let spin = 0
    if (this.motion?.active) {
      const { down, shake } = this.motion
      const tilt = clamp(Math.atan2(down.x, -down.y), -MAX_TILT, MAX_TILT)
      ax = -GRAVITY * Math.sin(tilt)
      ay = GRAVITY * Math.cos(tilt)
      let sx = -shake.x * SHAKE_GAIN
      let sy = -shake.y * SHAKE_GAIN
      const sl = Math.hypot(sx, sy)
      if (sl > SHAKE_MAX) {
        sx *= SHAKE_MAX / sl
        sy *= SHAKE_MAX / sl
      }
      ax += sx
      ay += sy
      spin = shake.z * SHAKE_SPIN
    }
    const gx = ax * dt * dt
    const gy = ay * dt * dt

    const wind = this.drag || this.reducedMotion ? 0 : Math.sin(this.time * 0.8) * 0.35 + Math.sin(this.time * 2.3) * 0.12

    for (const p of this.particles) {
      if (p.w === 0) continue
      const vx = (p.x - p.px) * DAMPING
      const vy = (p.y - p.py) * DAMPING
      p.px = p.x
      p.py = p.y
      p.x += vx + gx + (p === this.center ? wind * dt * dt : 0)
      p.y += vy + gy
    }

    if (this.drag) this.clampDragTarget()

    for (let k = 0; k < ITERATIONS; k++) {
      for (const c of this.constraints) solveDistance(c)
      if (this.drag) this.solveGrab()
    }

    const vx = (this.center.x - this.center.px) / dt
    const acc =
      -YAW_STIFFNESS * (this.yaw - this.yawTarget) - YAW_DAMPING * this.yawVelocity + YAW_TWIST * vx + spin
    this.yawVelocity += acc * dt
    this.yaw += this.yawVelocity * dt
  }

  clampDragTarget() {
    if (!this.drag) return
    const t = this.drag.target
    const reach = this.strapRest * this.maxStretch + this.drag.s * PIVOT_TO_CENTER
    const dx = t.x - this.anchor.x
    const dy = t.y - this.anchor.y
    const d = Math.hypot(dx, dy)
    if (d > reach) {
      t.x = this.anchor.x + (dx / d) * reach
      t.y = this.anchor.y + (dy / d) * reach
    }
  }

  solveGrab() {
    if (!this.drag) return
    const { s, target } = this.drag
    const a = this.clip
    const b = this.center
    const ga = 1 - s
    const gb = s
    const denom = ga * ga * a.w + gb * gb * b.w
    if (denom < 1e-6) return
    const ex = a.x * ga + b.x * gb - target.x
    const ey = a.y * ga + b.y * gb - target.y
    a.x -= (ex * ga * a.w) / denom
    a.y -= (ey * ga * a.w) / denom
    b.x -= (ex * gb * b.w) / denom
    b.y -= (ey * gb * b.w) / denom
  }

  tick(_time: number, deltaMs: number) {
    if (!this.active) return
    const dt = Math.min(deltaMs / 1000, 1 / 20)
    this.accumulator += dt
    while (this.accumulator >= STEP) {
      this.time += STEP
      this.step(STEP)
      this.accumulator -= STEP
    }
    if (this.drag) this.setPull((this.anchor.y - this.clip.y - this.hangDepth) / PULL_TRIGGER)
    this.syncScene(dt)
    this.renderer.render(this.scene, this.camera)
  }

  syncScene(dt: number) {
    const { clip, center } = this
    this.cardGroup.position.set(clip.x, clip.y, 0)
    this.cardGroup.rotation.z = Math.atan2(center.x - clip.x, -(center.y - clip.y))

    this.idle += ((this.drag || this.reducedMotion ? 0 : 1) - this.idle) * (1 - Math.exp(-dt * 2))
    this.cardGroup.rotation.x = this.pitchNoise(this.time) * IDLE_PITCH * this.idle
    this.swivel.rotation.y = this.yaw + this.yawNoise(this.time) * IDLE_YAW * this.idle
    const twist = Math.sin(this.yaw) * 0.35
    this.crimp.rotation.y = twist
    for (const strand of this.strands) this.updateStrand(strand, twist)

    this.key.target.position.set(center.x, center.y, 0)
    this.key.position.copy(this.key.target.position).add(LIGHT_OFFSET)

    const k = 1 - Math.exp(-dt * 4)
    this.parallax.x += (this.pointer.x * 0.35 - this.parallax.x) * k
    this.parallax.y += (this.pointer.y * 0.2 - this.parallax.y) * k
    this.camera.position.set(this.parallax.x, this.parallax.y, this.cameraZ)
    this.camera.lookAt(0, 0, 0)
  }

  updateStrand(strand: Strand, twist: number) {
    const pts = strand.curvePoints
    strand.particles.forEach((p, i) => pts[i].set(p.x, p.y, 0))
    pts[ROPE_SEGMENTS].set(this.clip.x, this.clip.y, 0)
    strand.curve.updateArcLengths()
    for (let i = 0; i <= STRAP_SAMPLES; i++) strand.curve.getPoint(i / STRAP_SAMPLES, this.samples[i])

    const pos = strand.mesh.geometry.attributes.position as THREE.BufferAttribute
    const nrm = strand.mesh.geometry.attributes.normal as THREE.BufferAttribute
    const uv = strand.mesh.geometry.attributes.uv as THREE.BufferAttribute
    const hw = STRAP_WIDTH / 2
    const z = -strand.side * STRAP_LAYER
    let total = 0
    for (let i = 1; i <= STRAP_SAMPLES; i++) total += this.samples[i].distanceTo(this.samples[i - 1])
    const uvScale = this.strapRest / (total || 1) / this.strapRepeat
    let length = 0
    for (let i = 0; i <= STRAP_SAMPLES; i++) {
      const p = this.samples[i]
      const prev = this.samples[Math.max(i - 1, 0)]
      const next = this.samples[Math.min(i + 1, STRAP_SAMPLES)]
      let tx = next.x - prev.x
      let ty = next.y - prev.y
      const tl = Math.hypot(tx, ty) || 1
      tx /= tl
      ty /= tl
      if (i > 0) length += p.distanceTo(prev)

      const t = i / STRAP_SAMPLES
      const a = twist * smoothstep(0.6, 1, t)
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const sx = -ty * ca
      const sy = tx * ca
      const sz = sa
      pos.setXYZ(i * 2, p.x + sx * hw, p.y + sy * hw, z + sz * hw)
      pos.setXYZ(i * 2 + 1, p.x - sx * hw, p.y - sy * hw, z - sz * hw)
      const nx = ty * sa
      const ny = -tx * sa
      const nz = ca
      nrm.setXYZ(i * 2, nx, ny, nz)
      nrm.setXYZ(i * 2 + 1, nx, ny, nz)
      const v = length * uvScale
      uv.setXY(i * 2, 0, v)
      uv.setXY(i * 2 + 1, 1, v)
    }
    pos.needsUpdate = true
    nrm.needsUpdate = true
    uv.needsUpdate = true
  }

  setActive(active: boolean) {
    this.active = active
    this.accumulator = 0
  }

  wakeUp() {
    if (this.disposed) return
    this.active = true
    this.accumulator = 0
    this.resetPhysicsIfCorrupt()

    const doRefresh = () => {
      if (this.disposed) return
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      if (w > 0 && h > 0) {
        this.resize()
        try {
          this.syncScene(0.016)
          this.renderer.render(this.scene, this.camera)
        } catch {}
      }
    }

    doRefresh()
    requestAnimationFrame(() => {
      doRefresh()
      setTimeout(doRefresh, 60)
      setTimeout(doRefresh, 180)
    })
  }

  resetPhysicsIfCorrupt() {
    let hasInvalid = !isFinite(this.center.x) || !isFinite(this.center.y) || !isFinite(this.clip.x) || !isFinite(this.clip.y)
    if (!hasInvalid) {
      for (const p of this.particles) {
        if (!isFinite(p.x) || !isFinite(p.y)) {
          hasInvalid = true
          break
        }
      }
    }
    if (hasInvalid) {
      this.layChain()
    }
  }

  dispose() {
    this.disposed = true
    this.motion?.dispose()
    gsap.ticker.remove(this.tick)
    this.introTimeline?.kill()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onPointerDownHandler)
    el.removeEventListener('touchstart', this.onTouchStartHandler)
    window.removeEventListener('touchend', this.onTouchEndHandler)
    window.removeEventListener('pointermove', this.onPointerMoveHandler)
    window.removeEventListener('pointerup', this.onPointerUpHandler)
    window.removeEventListener('pointercancel', this.onPointerUpHandler)
    document.removeEventListener('visibilitychange', this.onVisibilityHandler)

    this.scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material?.dispose()
      }
    })
    for (const tex of this.textures) tex.dispose()
    this.envTexture.dispose()
    this.renderer.dispose()
    el.remove()
  }
}

function setAt(p: Particle, x: number, y: number) {
  p.x = p.px = x
  p.y = p.py = y
}

function solveDistance({ a, b, rest, stiffness = 1, maxStretch = Infinity }: Constraint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  const wsum = a.w + b.w
  if (d < 1e-6 || wsum === 0) return
  let correction = (d - rest) * (d > rest ? stiffness : 1)
  const limit = rest * maxStretch
  if (d - correction > limit) correction = d - limit
  const diff = correction / (d * wsum)
  a.x += dx * diff * a.w
  a.y += dy * diff * a.w
  b.x -= dx * diff * b.w
  b.y -= dy * diff * b.w
}

function roundedRect<T extends THREE.Path>(path: T, w: number, h: number, r: number, cx: number, cy: number): T {
  const x = cx - w / 2
  const y = cy - h / 2
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  path.lineTo(x + w, y + h - r)
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  path.lineTo(x + r, y + h)
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  path.lineTo(x, y + r)
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return path
}

function smoothNoise() {
  const waves = [1, 0.5, 0.25].map((amp, i) => ({
    amp,
    freq: (0.08 + Math.random() * 0.07) * (i * 1.7 + 1),
    phase: Math.random() * Math.PI * 2,
  }))
  const total = waves.reduce((sum, w) => sum + w.amp, 0)
  return (t: number) => waves.reduce((sum, w) => sum + w.amp * Math.sin(t * w.freq * Math.PI * 2 + w.phase), 0) / total
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
