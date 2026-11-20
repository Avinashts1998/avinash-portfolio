export class MotionInput {
  static supported = typeof window !== 'undefined' && ('DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window)
  active = false
  down = { x: 0, y: -1 }
  shake = { x: 0, y: 0, z: 0 }
  private lastAccel = { x: 0, y: 0, z: 0 }
  private removeListeners?: () => void

  constructor() {
    this.init()
  }

  requestPermission() {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((res: string) => {
          if (res === 'granted') this.active = true
        })
        .catch(() => {})
    }
  }

  private init() {
    if (typeof window === 'undefined') return

    const onOrientation = (e: DeviceOrientationEvent) => {
      this.active = true
      if (e.gamma !== null && e.beta !== null) {
        const radGamma = (e.gamma * Math.PI) / 180
        const radBeta = (e.beta * Math.PI) / 180
        this.down.x = Math.sin(radGamma)
        this.down.y = -Math.cos(radBeta)
      }
    }

    const onMotion = (e: DeviceMotionEvent) => {
      this.active = true
      const a = e.accelerationIncludingGravity || e.acceleration
      if (a && a.x !== null && a.y !== null) {
        const dx = a.x - this.lastAccel.x
        const dy = a.y - this.lastAccel.y
        const dz = (a.z || 0) - this.lastAccel.z
        this.lastAccel = { x: a.x, y: a.y, z: a.z || 0 }
        this.shake.x = dx
        this.shake.y = dy
        this.shake.z = dz
      }
    }

    window.addEventListener('deviceorientation', onOrientation, { passive: true })
    window.addEventListener('devicemotion', onMotion, { passive: true })

    this.removeListeners = () => {
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('devicemotion', onMotion)
    }
  }

  dispose() {
    this.removeListeners?.()
  }
}
