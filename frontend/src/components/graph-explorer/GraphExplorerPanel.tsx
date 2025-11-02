import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Graph3DScene } from "./Graph3DScene"
import { Search, Filter, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  z: number
  cluster: string
  connections: string[]
}

const GraphExplorerPanel: React.FC = () => {
  // Sample graph data - in a real app this would come from an API
  const [nodes, setNodes] = React.useState<GraphNode[]>([
    { id: "1", label: "Evidence A", x: -2, y: 0, z: 0, cluster: "evidence", connections: ["2", "3"] },
    { id: "2", label: "Person B", x: 2, y: 1, z: 1, cluster: "person", connections: ["1", "4"] },
    { id: "3", label: "Document C", x: 0, y: -1, z: -1, cluster: "document", connections: ["1", "4"] },
    { id: "4", label: "Event D", x: 1, y: 0, z: 2, cluster: "event", connections: ["2", "3"] },
  ])

  const handleNodeClick = (node: GraphNode) => {
    console.log("Node clicked:", node)
    // In a real app, this would open a detail view or highlight related nodes
  }

  const handleSearch = () => {
    // Implement search functionality
  }

  const handleFilter = () => {
    // Implement filter functionality
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="bg-background-panel border-border-subtle shadow-cyan-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-text-primary font-display text-xl">
              3D Graph Explorer
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="cinematic" 
                size="sm"
                onClick={handleSearch}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button 
                variant="cinematic" 
                size="sm"
                onClick={handleFilter}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-text-secondary text-sm mt-2">
            Interactive 3D visualization of evidence connections with neon-glass nodes
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full relative">
            <Graph3DScene 
              nodes={nodes} 
              onNodeClick={handleNodeClick}
              className="rounded-b-2xl"
            />
            
            {/* Floating legend */}
            <div className="absolute bottom-4 left-4 bg-background-overlay/80 backdrop-blur-sm border border-border-subtle rounded-lg p-3 shadow-cyan-xs">
              <h4 className="text-text-primary text-sm font-medium mb-2">Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-cyan-500"></div>
                  <span className="text-text-secondary text-xs">Evidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-violet-500"></div>
                  <span className="text-text-secondary text-xs">People</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-gold"></div>
                  <span className="text-text-secondary text-xs">Documents</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { GraphExplorerPanel }