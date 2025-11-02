import * as React from "react"
import { Dropzone } from "@/components/ui/dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "success" | "error"
  progress: number
  summary?: string
}

const EvidenceUploadZone: React.FC = () => {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = React.useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    setIsUploading(true)

    // Simulate file upload process
    newFiles.forEach(file => {
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                progress: Math.min(f.progress + Math.random() * 30, 100),
                status: f.progress >= 90 ? "success" : f.status
              } 
            : f
        ))
      }, 300)

      // After upload completes, add AI summary
      setTimeout(() => {
        clearInterval(interval)
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: "success",
                progress: 100,
                summary: "This document contains key evidence related to the case timeline. AI analysis identified 3 potential contradictions with witness statements."
              } 
            : f
        ))
        setIsUploading(false)
      }, 3000)
    })
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="bg-background-panel border-border-subtle shadow-cyan-sm rounded-2xl overflow-hidden mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-text-primary font-display text-xl">
            Evidence Upload
          </CardTitle>
          <p className="text-text-secondary text-sm mt-2">
            Drag and drop files for AI-powered analysis and summarization
          </p>
        </CardHeader>
        <CardContent>
          <Dropzone 
            onFileUpload={handleFileUpload}
            accept={{
              "application/pdf": [".pdf"],
              "application/msword": [".doc"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
              "text/plain": [".txt"],
              "image/*": [".png", ".jpg", ".jpeg"]
            }}
            className="min-h-[200px] flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{ 
                scale: isUploading ? [1, 1.1, 1] : 1,
                rotate: isUploading ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: 2, 
                repeat: isUploading ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Upload className="w-12 h-12 text-accent-cyan-500" />
            </motion.div>
            <div className="text-center">
              <h3 className="text-text-primary font-medium mb-1">
                {isUploading ? "Uploading files..." : "Drag & drop files here"}
              </h3>
              <p className="text-text-secondary text-sm">
                {isUploading 
                  ? "AI analysis in progress..." 
                  : "Supports PDF, DOC, DOCX, TXT, PNG, JPG"}
              </p>
            </div>
            <Button 
              variant="cinematic" 
              className="mt-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Browse Files"
              )}
            </Button>
          </Dropzone>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div 
                className="mt-6 space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-text-primary font-medium">Uploaded Files</h3>
                {files.map(file => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-3 bg-background-surface rounded-lg border border-border-subtle"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {file.status === "uploading" ? (
                          <Loader2 className="w-5 h-5 text-accent-cyan-500 animate-spin" />
                        ) : file.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-accent-green" />
                        ) : (
                          <XCircle className="w-5 h-5 text-accent-red" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-text-secondary text-xs">
                          {formatFileSize(file.size)}
                        </p>
                        
                        {/* Progress bar */}
                        {file.status === "uploading" && (
                          <div className="mt-2 w-full bg-background-panel rounded-full h-1.5">
                            <motion.div 
                              className="bg-gradient-to-r from-accent-cyan-500 to-accent-violet-500 h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${file.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                        
                        {/* AI Summary */}
                        {file.status === "success" && file.summary && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.5 }}
                            className="mt-2 p-2 bg-background-panel rounded border border-border-subtle"
                          >
                            <p className="text-text-secondary text-xs">
                              {file.summary}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { EvidenceUploadZone }