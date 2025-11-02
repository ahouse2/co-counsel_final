import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere, Line, Text } from "@react-three/drei"
import * as THREE from "three"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interfaceGraphNode {
  id: string
  label: string
  x: number
  y: number
  z: number
  cluster: string
  connections: string[]
}

interface Graph3DSceneProps {
  nodes: GraphNode[]
  onNodeClick?: (node: GraphNode) => void
  className?: string
}

const Node: React.FC<{
  node: GraphNode
  onClick: (node: GraphNode) => void
}> = ({ node, onClick }) => {
  const meshRef = React.useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Add subtle floating animation
      meshRef.current.position.y = node.y + Math.sin(state.clock.elapsedTime + node.x) * 0.1
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <Sphere
        ref={meshRef}
        args={[0.2, 16, 16]}
        onClick={() => onClick(node)}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <meshStandardMaterial 
          color={node.cluster === 'evidence' ? '#18cafe' : node.cluster === 'person' ? '#946aff' : '#ffd65a'} 
          emissive={node.cluster === 'evidence' ? '#18cafe' : node.cluster === 'person' ? '#946aff' : '#ffd65a'}
          emissiveIntensity={0.2}
        />
      </Sphere>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.15}
        maxWidth={2}
        lineHeight={1}
        letterSpacing={0.02}
        textAlign="center"
        color="#ececf0"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  )
}

const Connection: React.FC<{
  start: GraphNode
  end: GraphNode
}> = ({ start, end }) => {
  const points = React.useMemo(() => [
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(end.x, end.y, end.z)
  ], [start, end])

  return (
    <Line
      points={points}
      color="#383b44"
      lineWidth={1}
    />
  )
}

const Graph3DScene: React.FC<Graph3DSceneProps> = ({ 
  nodes, 
  onNodeClick = () => {},
  className 
}) => {
  // Create connections between nodes
  const connections = React.useMemo(() => {
    const connections: { start: GraphNode; end: GraphNode }[] = []
    nodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const connectedNode = nodes.find(n => n.id === connectionId)
        if (connectedNode) {
          connections.push({ start: node, end: connectedNode })
        }
      })
    })
    return connections
  }, [nodes])

  return (
    <motion.div 
      className={cn("w-full h-full rounded-xl overflow-hidden", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        className="bg-background-canvas"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#18cafe" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#946aff" />
        
        {/* Render connections first so they appear behind nodes */}
        {connections.map((conn, index) => (
          <Connection key={index} start={conn.start} end={conn.end} />
        ))}
        
        {/* Render nodes */}
        {nodes.map(node => (
          <Node 
            key={node.id} 
            node={node} 
            onClick={onNodeClick} 
          />
        ))}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </motion.div>
  )
}

export { Graph3DScene }