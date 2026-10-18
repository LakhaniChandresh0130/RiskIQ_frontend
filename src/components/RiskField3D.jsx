// 3D "risk skyline": one tower per position, height = share of 1-day 99% VaR.
// Colour runs teal -> amber -> red as contribution grows. Orbit auto-rotates; hover a tower to read it.
import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const TEAL = new THREE.Color('#22d3ee'), AMBER = new THREE.Color('#f59e0b'), RED = new THREE.Color('#ef4444')
const colorFor = t => t < .5
  ? TEAL.clone().lerp(AMBER, t * 2)
  : AMBER.clone().lerp(RED, (t - .5) * 2)

function Tower({ d, x, z, top, hot, onHot }) {
  const m = useRef()
  const col = useMemo(() => colorFor(Math.min(d.pct / top, 1)), [d.pct, top])
  useFrame((s, dt) => {                                          // ease each tower up, then let it breathe
    const g = m.current; if (!g) return
    const target = 0.25 + (d.pct / top) * 3.6
    const wobble = 1 + Math.sin(s.clock.elapsedTime * 1.1 + x * z) * .015
    g.scale.y += ((hot ? target * 1.15 : target * wobble) - g.scale.y) * Math.min(dt * 3.5, 1)
    g.position.y = g.scale.y / 2
    const mat = g.material, e = hot ? 1.0 : .28
    mat.emissiveIntensity += (e - mat.emissiveIntensity) * Math.min(dt * 7, 1)
  })
  return <mesh ref={m} position={[x, 0, z]}
    onPointerOver={e => { e.stopPropagation(); onHot(d) }} onPointerOut={() => onHot(null)}>
    <boxGeometry args={[.6, 1, .6]} />
    <meshStandardMaterial color={col} emissive={col} emissiveIntensity={.28} roughness={.32} metalness={.55} />
  </mesh>
}

export default function RiskField3D({ data }) {
  const [hot, setHot] = useState(null)
  const items = useMemo(() => data.slice(0, 49), [data])
  const n = Math.ceil(Math.sqrt(items.length)), gap = 1.06, off = (n - 1) * gap / 2
  const top = Math.max(...items.map(d => d.pct), 1e-9)
  return <div className="scene3d">
    <Canvas
      camera={{ position: [5.6, 5.2, 7.8], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ powerPreference: 'default', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
        }, false)
      }}
    >
      <fog attach="fog" args={['#04070f', 15, 27]} />
      <ambientLight intensity={.4} />
      <directionalLight position={[6, 9, 4]} intensity={.9} />
      <pointLight position={[-6, 4, -6]} intensity={24} color="#22d3ee" />
      <gridHelper args={[n * gap + .8, n + 1, '#1e3a4a', '#0d1b2a']} position={[0, -.01, 0]} />
      {items.map((d, i) => <Tower key={d.key} d={d} top={top}
        x={(i % n) * gap - off} z={Math.floor(i / n) * gap - off}
        hot={hot?.key === d.key} onHot={setHot} />)}
      <Sparkles count={160} scale={[12, 5.5, 12]} position={[0, 2.8, 0]} size={2.2} speed={.35} color="#22d3ee" opacity={.55} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={.8}
        minPolarAngle={Math.PI / 4.6} maxPolarAngle={Math.PI / 2.55} />
    </Canvas>
    <div className="scene3d-tip">{hot
      ? <><b>{hot.key}</b> · {(hot.pct * 100).toFixed(1)}% of VaR</>
      : 'Drag to orbit · tower height = share of 1-day 99% VaR'}</div>
  </div>
}
