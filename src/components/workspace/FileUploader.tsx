'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { clsx } from 'clsx'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { v4 as uuidv4 } from 'uuid'

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  supabaseId?: string
  storagePath?: string
}

interface FileUploaderProps {
  onUploadComplete: (files: UploadedFile[]) => void
  onProjectIdUpdate?: (projectId: string) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
  projectId: string
}

export function FileUploader({
  onUploadComplete,
  onProjectIdUpdate,
  maxFiles = 10,
  acceptedFileTypes = ['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg'],
  projectId
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const notifiedFilesRef = useRef<Set<string>>(new Set())

  // Effect to notify parent when files are uploaded successfully
  useEffect(() => {
    const successfulFiles = uploadedFiles.filter(f => f.status === 'success')
    const newSuccessfulFiles = successfulFiles.filter(f => !notifiedFilesRef.current.has(f.id))

    if (newSuccessfulFiles.length > 0 && !isUploading) {
      // Mark these files as notified
      newSuccessfulFiles.forEach(f => notifiedFilesRef.current.add(f.id))

      // Notify parent immediately (no setTimeout to prevent blinking)
      onUploadComplete(successfulFiles)
    }
  }, [uploadedFiles, isUploading, onUploadComplete])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('🎯 onDrop called with:', {
      filesCount: acceptedFiles.length,
      projectId,
      projectIdType: typeof projectId,
      projectIdValue: projectId
    })

    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsUploading(true)

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Use backend service for file uploads
    const BACKEND_URL = process.env.NEXT_PUBLIC_AUTOGEN_SERVICE_URL || 'https://adronaut-production.up.railway.app'
    console.log('🔧 Backend URL:', BACKEND_URL)

    // Upload files to backend service
    for (const fileData of newFiles) {
      try {
        // Validate projectId
        if (!projectId || projectId.trim() === '') {
          throw new Error('Project ID is missing or invalid')
        }

        const artifactId = uuidv4()
        const fileExtension = fileData.file.name.split('.').pop()
        const storagePath = `${projectId}/${artifactId}.${fileExtension}`

        // Upload to backend service
        console.log(`📤 Uploading file: ${fileData.file.name} (${(fileData.file.size / 1024).toFixed(2)} KB)`)

        // Update progress to 25%
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? { ...f, progress: 25 }
              : f
          )
        )

        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', fileData.file)

        // Build upload URL
        const uploadUrl = `${BACKEND_URL}/upload-direct?project_id=${encodeURIComponent(projectId)}&process_immediately=false`
        console.log(`🔗 Upload URL: ${uploadUrl}`)

        // Upload to backend using direct endpoint without immediate processing
        let uploadResponse
        try {
          console.log('⏳ Fetching...')
          uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          })
          console.log('✅ Fetch completed:', uploadResponse.status, uploadResponse.statusText)
        } catch (fetchError) {
          console.error('❌ Fetch failed:', fetchError)
          throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Could not reach backend server'}`)
        }

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()

        // Keep the project ID stable; backend should respect provided ID
        // Only update if explicitly different and callback provided
        if (uploadResult.project_id && uploadResult.project_id !== projectId && onProjectIdUpdate) {
          onProjectIdUpdate(uploadResult.project_id)
        }

        // Update progress to 100%
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  supabaseId: artifactId,
                  storagePath: uploadResult.file_path || `${projectId}/${fileData.file.name}`
                }
              : f
          )
        )

        continue

      } catch (error) {
        // Enhanced error logging for debugging
        const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error))
        const errorDetails = {
          errorStringified: errorString,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorToString: error?.toString(),
          fileName: fileData.file.name,
          projectId,
          backendUrl: BACKEND_URL,
          timestamp: new Date().toISOString()
        }

        console.error('❌ Upload error details:', errorDetails)
        console.error('❌ Raw error object:', error)
        console.error('❌ Error JSON:', errorString)

        // Get user-friendly error message
        let userMessage = 'Upload failed'
        if (error instanceof Error) {
          userMessage = error.message
        } else if (error instanceof TypeError) {
          userMessage = 'Network error - check backend connectivity'
        } else if (typeof error === 'string') {
          userMessage = error
        } else {
          userMessage = `Upload failed - see console for details (error type: ${typeof error})`
        }

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: userMessage
                }
              : f
          )
        )
      }
    }

    setIsUploading(false)

    // The useEffect will handle notifying the parent of successful uploads

  }, [uploadedFiles, maxFiles, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: isUploading
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return <File className="w-5 h-5" />
  }

  const getFileTypeColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'csv': return 'success'
      case 'json': return 'info'
      case 'pdf': return 'danger'
      case 'png':
      case 'jpg':
      case 'jpeg': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-8">
      {/* Drop Zone */}
      <div className="card-upload relative overflow-hidden">
        <div className="p-8">
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer',
              'hover:border-electric-500/70 hover:bg-electric-500/8 hover:shadow-glow-subtle',
              {
                'border-electric-500 bg-electric-500/15 shadow-glow-subtle': isDragActive,
                'border-space-300': !isDragActive,
                'opacity-50 cursor-not-allowed': isUploading,
              }
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-6">
              <div className={clsx(
                'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
                {
                  'bg-electric-500/25 text-electric-500 shadow-glow-subtle': isDragActive,
                  'bg-space-200 text-gray-400': !isDragActive,
                }
              )}>
                <Upload className="w-10 h-10" />
              </div>

              <div className="text-center max-w-md">
                <h3 className="heading-md mb-3" style={{ color: 'var(--foreground)' }}>
                  {isDragActive ? 'Drop files here' : 'Upload Data Artifacts'}
                </h3>
                <p className="body-md mb-6 leading-relaxed" style={{ color: 'var(--space-400)' }}>
                  Drag & drop your marketing data files or click to browse
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {acceptedFileTypes.map(type => (
                    <Badge key={type} variant="info" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                <div className="caption" style={{ color: 'var(--space-500)' }}>
                  Maximum {maxFiles} files • Up to 10MB each
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={isUploading}
                className="mt-2 btn-hover-lift"
                glow
              >
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="card-data">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 flex items-center justify-center">
                <File className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100">
                  Uploaded Artifacts ({uploadedFiles.length})
                </h4>
                <p className="text-sm text-slate-400">
                  Files ready for analysis
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {uploadedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(fileData.file.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-sm font-semibold text-white truncate">
                        {fileData.file.name}
                      </p>
                      <Badge
                        variant={getFileTypeColor(fileData.file.name) as any}
                        className="text-xs"
                      >
                        {fileData.file.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400 font-mono">
                        {(fileData.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    {fileData.status === 'uploading' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Uploading...</span>
                          <span className="text-electric-500 font-mono">{fileData.progress}%</span>
                        </div>
                        <Progress value={fileData.progress} variant="default" animated />
                      </div>
                    )}

                    {fileData.status === 'error' && fileData.error && (
                      <p className="text-xs text-neon-rose mt-1">{fileData.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {fileData.status === 'success' && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-neon-emerald" />
                        <span className="text-xs text-neon-emerald font-medium">Ready</span>
                      </div>
                    )}
                    {fileData.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-neon-rose" />
                        <span className="text-xs text-neon-rose font-medium">Failed</span>
                      </div>
                    )}
                    {fileData.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-electric-500 font-medium">Processing</span>
                      </div>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={fileData.status === 'uploading'}
                      className="ml-2 interactive-scale"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
