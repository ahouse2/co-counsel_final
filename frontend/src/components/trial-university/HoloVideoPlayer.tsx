import * as React from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

interface HoloVideoPlayerProps {
  src: string
  title: string
  description: string
  duration: string
  onPlay?: () => void
  onPause?: () => void
  className?: string
}

const HoloVideoPlayer: React.FC<HoloVideoPlayerProps> = ({ 
  src, 
  title, 
  description, 
  duration,
  onPlay,
  onPause,
  className 
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [currentTime, setCurrentTime] = React.useState("0:00")
  
  const videoRef = React.useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        onPause && onPause()
      } else {
        videoRef.current.play()
        onPlay && onPlay()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleProgress = () => {
    if (videoRef.current) {
      const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(percentage)
      
      // Format current time
      const minutes = Math.floor(videoRef.current.currentTime / 60)
      const seconds = Math.floor(videoRef.current.currentTime % 60)
      setCurrentTime(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * videoRef.current.duration
      setProgress(pos * 100)
    }
  }

  return (
    <motion.div 
      className={cn(
        "relative rounded-2xl overflow-hidden border border-accent-cyan-500/30 bg-background-panel shadow-cyan-md",
        className
      )}
      whileHover={{ 
        boxShadow: "0 0 30px rgba(24, 202, 254, 0.4)",
        borderColor: "rgba(24, 202, 254, 0.6)"
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Video container with holo effect */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          onTimeUpdate={handleProgress}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Holo overlay effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-background-panel/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,202,254,0.1)_0%,transparent_70%)]" />
        </div>
        
        {/* Play/Pause overlay */}
        <motion.button
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={togglePlay}
          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          {!isPlaying && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-accent-cyan-500/80 flex items-center justify-center backdrop-blur-sm"
            >
              <Play className="w-6 h-6 text-white ml-1" />
            </motion.div>
          )}
        </motion.button>
      </div>
      
      {/* Video controls */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-text-primary font-display text-lg">{title}</h3>
            <p className="text-text-secondary text-sm mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <span>{currentTime}</span>
            <span>/</span>
            <span>{duration}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div 
          className="w-full h-1.5 bg-background-surface rounded-full cursor-pointer mb-4"
          onClick={handleSeek}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-accent-cyan-500 to-accent-violet-500 rounded-full"
            style={{ width: `${progress}%` }}
            whileHover={{ height: "6px" }}
          />
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 rounded-full hover:bg-background-surface transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-text-primary" />
              ) : (
                <Play className="w-5 h-5 text-text-primary" />
              )}
            </motion.button>
            
            <motion.button
              className="p-2 rounded-full hover:bg-background-surface transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack className="w-5 h-5 text-text-primary" />
            </motion.button>
            
            <motion.button
              className="p-2 rounded-full hover:bg-background-surface transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-5 h-5 text-text-primary" />
            </motion.button>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              className="p-2 rounded-full hover:bg-background-surface transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-text-primary" />
              ) : (
                <Volume2 className="w-5 h-5 text-text-primary" />
              )}
            </motion.button>
            
            <motion.button
              className="p-2 rounded-full hover:bg-background-surface transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Maximize className="w-5 h-5 text-text-primary" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export { HoloVideoPlayer }