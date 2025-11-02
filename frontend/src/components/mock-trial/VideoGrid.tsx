import * as React from "react"
import { motion } from "framer-motion"
import { Mic, MicOff, Video, VideoOff, Crown, User } from "lucide-react"
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

interface VideoGridProps {
  participants: Participant[]
  onToggleMute?: (id: string) => void
  onToggleVideo?: (id: string) => void
  className?: string
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  participants, 
  onToggleMute,
  onToggleVideo,
  className 
}) => {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {participants.map((participant, index) => (
        <motion.div
          key={participant.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={cn(
            "relative rounded-xl overflow-hidden border-2 bg-background-panel",
            participant.isSpeaking 
              ? "border-accent-cyan-500 shadow-cyan-md" 
              : "border-border-subtle",
            participants.length === 1 && "sm:col-span-2 sm:row-span-2"
          )}
        >
          {/* Video placeholder */}
          <div className="aspect-video bg-gradient-to-br from-background-surface to-background-panel flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent-violet-500/20 flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-accent-violet-300" />
              </div>
              <p className="text-text-primary font-medium">{participant.name}</p>
              <p className="text-text-secondary text-sm mt-1">{participant.role}</p>
            </div>
          </div>
          
          {/* Participant overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-panel/80 to-transparent pointer-events-none" />
          
          {/* Status indicators */}
          <div className="absolute top-3 left-3 flex gap-2">
            {participant.isHost && (
              <div className="flex items-center gap-1 bg-accent-gold/20 text-accent-gold px-2 py-1 rounded-full text-xs">
                <Crown className="w-3 h-3" />
                Host
              </div>
            )}
            {participant.isMuted && (
              <div className="flex items-center gap-1 bg-accent-red/20 text-accent-red px-2 py-1 rounded-full text-xs">
                <MicOff className="w-3 h-3" />
                Muted
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <motion.button
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm",
                participant.isMuted 
                  ? "bg-accent-red/80 text-white" 
                  : "bg-background-overlay/80 text-text-primary"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleMute && onToggleMute(participant.id)}
            >
              {participant.isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </motion.button>
            
            <motion.button
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm",
                participant.isVideoOff 
                  ? "bg-accent-red/80 text-white" 
                  : "bg-background-overlay/80 text-text-primary"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleVideo && onToggleVideo(participant.id)}
            >
              {participant.isVideoOff ? (
                <VideoOff className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
            </motion.button>
          </div>
          
          {/* Speaking indicator */}
          {participant.isSpeaking && (
            <motion.div
              className="absolute inset-0 border-2 border-accent-cyan-500 rounded-xl pointer-events-none"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(24, 202, 254, 0.4)",
                  "0 0 0 8px rgba(24, 202, 254, 0)",
                  "0 0 0 0 rgba(24, 202, 254, 0.4)"
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}

export { VideoGrid }