import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { VideoGrid } from "./VideoGrid"
import { DraggableExhibits } from "./DraggableExhibits"
import { Play, Pause, Mic, MicOff, Video, VideoOff, PhoneOff, Timer, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  name: string
  role: string
  isMuted: boolean
  isVideoOff: boolean
  isSpeaking: boolean
  isHost: boolean
}

interface Exhibit {
  id: string
  title: string
  type: "document" | "image" | "link"
  description: string
  spotlighted: boolean
}

const MockTrialArenaPanel: React.FC = () => {
  const [isRecording, setIsRecording] = React.useState(false)
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [participants, setParticipants] = React.useState<Participant[]>([
    {
      id: "1",
      name: "Alex Johnson",
      role: "Attorney",
      isMuted: false,
      isVideoOff: false,
      isSpeaking: true,
      isHost: true
    },
    {
      id: "2",
      name: "Sarah Williams",
      role: "Witness",
      isMuted: false,
      isVideoOff: false,
      isSpeaking: false,
      isHost: false
    },
    {
      id: "3",
      name: "Michael Chen",
      role: "Judge",
      isMuted: true,
      isVideoOff: false,
      isSpeaking: false,
      isHost: false
    },
    {
      id: "4",
      name: "Robert Davis",
      role: "Defense",
      isMuted: false,
      isVideoOff: true,
      isSpeaking: false,
      isHost: false
    }
  ])
  
  const [exhibits, setExhibits] = React.useState<Exhibit[]>([
    {
      id: "1",
      title: "Contract Agreement",
      type: "document",
      description: "Signed contract between parties",
      spotlighted: true
    },
    {
      id: "2",
      title: "Crime Scene Photo",
      type: "image",
      description: "Photograph of the incident location",
      spotlighted: false
    },
    {
      id: "3",
      title: "Witness Statement",
      type: "document",
      description: "Statement from key witness",
      spotlighted: false
    },
    {
      id: "4",
      title: "Evidence Database",
      type: "link",
      description: "Link to external evidence repository",
      spotlighted: false
    }
  ])
  
  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])
  
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const toggleParticipantMute = (id: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, isMuted: !p.isMuted } : p
    ))
  }
  
  const toggleParticipantVideo = (id: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, isVideoOff: !p.isVideoOff } : p
    ))
  }
  
  const spotlightExhibit = (id: string) => {
    setExhibits(prev => prev.map(e => 
      e.id === id ? { ...e, spotlighted: !e.spotlighted } : { ...e, spotlighted: false }
    ))
  }
  
  const removeExhibit = (id: string) => {
    setExhibits(prev => prev.filter(e => e.id !== id))
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
              Mock Trial Arena
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="cinematic" 
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "flex items-center gap-2",
                  isRecording && "bg-accent-red hover:bg-accent-red/90"
                )}
              >
                {isRecording ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Session
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <Users className="w-4 h-4" />
                Invite
              </Button>
            </div>
          </div>
          <p className="text-text-secondary text-sm mt-2">
            Live video conferencing with draggable exhibits and real-time transcription
          </p>
        </CardHeader>
        <CardContent>
          {/* Session controls and timer */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-background-surface rounded-xl border border-border-subtle">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-accent-cyan-500" />
                <span className="text-text-primary font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-violet-500" />
                <span className="text-text-primary">{participants.length} Participants</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <Mic className="w-4 h-4" />
                Mute All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 border-border-subtle text-text-secondary"
              >
                <Video className="w-4 h-4" />
                Video Off
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="flex items-center gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Session
              </Button>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video grid - spans 2 columns on large screens */}
            <div className="lg:col-span-2">
              <VideoGrid 
                participants={participants}
                onToggleMute={toggleParticipantMute}
                onToggleVideo={toggleParticipantVideo}
              />
            </div>
            
            {/* Exhibits panel - spans 1 column on large screens */}
            <div>
              <DraggableExhibits 
                exhibits={exhibits}
                onSpotlight={spotlightExhibit}
                onRemove={removeExhibit}
              />
            </div>
          </div>
          
          {/* Transcript panel */}
          <div className="mt-6 p-4 bg-background-surface rounded-xl border border-border-subtle">
            <h3 className="text-text-primary font-display text-lg mb-3">Live Transcript</h3>
            <div className="h-32 overflow-y-auto">
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-accent-cyan-500">Alex Johnson:</span>
                  <span className="text-text-primary">Your Honor, I'd like to present Exhibit A, the contract agreement.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-accent-violet-500">Sarah Williams:</span>
                  <span className="text-text-primary">Yes, I signed that document on March 15th, 2023.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-accent-gold">Michael Chen:</span>
                  <span className="text-text-primary">Please approach the witness with the document.</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { MockTrialArenaPanel }