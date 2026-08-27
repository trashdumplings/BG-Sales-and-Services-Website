import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import {
  AdditiveBlending,
  BufferGeometry,
  Clock,
  Color,
  EllipseCurve,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'

const HeroGeometry = ({ scrollProgress }) => {
  const canvasRef = useRef(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)

    const scene = new Scene()
    const camera = new PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 7)

    const group = new Group()
    group.position.set(0.9, 0.05, 0)
    scene.add(group)

    const blue = new Color('#0466c8')
    const paleBlue = new Color('#979dac')
    const lineMaterial = new LineBasicMaterial({
      color: blue,
      transparent: true,
      opacity: 0.46,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const quietMaterial = new LineBasicMaterial({
      color: paleBlue,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false,
    })

    const globeGeometry = new IcosahedronGeometry(1.72, 2)
    const globe = new LineSegments(
      new WireframeGeometry(globeGeometry),
      lineMaterial,
    )
    globe.scale.set(1, 1.16, 1)
    group.add(globe)

    const rings = []
    ;[2.05, 2.38, 2.72].forEach((radius, index) => {
      const geometry = new EllipseCurve(
        0,
        0,
        radius,
        radius * (0.46 + index * 0.035),
        0,
        Math.PI * 2,
        false,
        0,
      )
      const points = geometry.getPoints(180)
      const ring = new Line(
        new BufferGeometry().setFromPoints(points),
        index === 1 ? lineMaterial : quietMaterial,
      )
      ring.rotation.x = 0.34 + index * 0.26
      ring.rotation.z = -0.2 + index * 0.2
      rings.push(ring)
      group.add(ring)
    })

    const mountainLines = []
    for (let layer = 0; layer < 5; layer += 1) {
      const points = []
      for (let point = 0; point <= 70; point += 1) {
        const x = (point / 70 - 0.5) * 5.6
        const peak =
          Math.sin(point * 0.22 + layer * 0.8) * 0.17 +
          Math.sin(point * 0.075 + layer) * 0.3
        const y = -1.9 + layer * 0.18 + peak
        points.push(new Vector3(x, y, -0.3 + layer * 0.08))
      }
      const mountain = new Line(
        new BufferGeometry().setFromPoints(points),
        layer === 4 ? lineMaterial : quietMaterial,
      )
      mountainLines.push(mountain)
      group.add(mountain)
    }

    const pointer = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let scroll = 0
    let frame

    const unsubscribe = scrollProgress.on('change', (value) => {
      scroll = value
    })

    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / Math.max(clientHeight, 1)
      camera.updateProjectionMatrix()
    }

    const onPointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.26
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.18
    }

    const clock = new Clock()
    const render = () => {
      const elapsed = clock.getElapsedTime()
      current.x += (pointer.x - current.x) * 0.025
      current.y += (pointer.y - current.y) * 0.025

      if (!reduceMotion) {
        group.rotation.y = elapsed * 0.035 + current.x + scroll * 0.5
        group.rotation.x = -0.1 + current.y + scroll * 0.12
        globe.rotation.z = elapsed * 0.018
        rings.forEach((ring, index) => {
          ring.rotation.z += 0.00045 * (index % 2 === 0 ? 1 : -1)
        })
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    render()

    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      globeGeometry.dispose()
      globe.geometry.dispose()
      rings.forEach((ring) => ring.geometry.dispose())
      mountainLines.forEach((line) => line.geometry.dispose())
      lineMaterial.dispose()
      quietMaterial.dispose()
      renderer.dispose()
    }
  }, [reduceMotion, scrollProgress])

  return (
    <canvas
      ref={canvasRef}
      className='cinematic-hero__geometry'
      aria-hidden='true'
    />
  )
}

export default HeroGeometry
