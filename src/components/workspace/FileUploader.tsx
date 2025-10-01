'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { clsx } from 'clsx'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
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
  maxFiles?: number
  acceptedFileTypes?: string[]
  projectId: string
}

export function FileUploader({
  onUploadComplete,
  maxFiles = 10,
  acceptedFileTypes = ['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg'],
  projectId
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Effect to notify parent when files are uploaded successfully
  useEffect(() => {
    const successfulFiles = uploadedFiles.filter(f => f.status === 'success')
    if (successfulFiles.length > 0 && !isUploading) {
      onUploadComplete(successfulFiles)
    }
  }, [uploadedFiles, isUploading, onUploadComplete])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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

    // Check if we're in development mode (force dev mode for now until Supabase is properly set up)
    const isDevelopmentMode = true // TODO: Set to false when Supabase tables and storage are ready

    // Upload files to Supabase (or simulate in dev mode)
    for (const fileData of newFiles) {
      try {
        const artifactId = uuidv4()
        const fileExtension = fileData.file.name.split('.').pop()
        const storagePath = `${projectId}/${artifactId}.${fileExtension}`

        if (isDevelopmentMode) {
          // Simulate upload for development
          console.log('Development mode: Simulating file upload for', fileData.file.name)

          // Simulate progress
          for (let progress = 25; progress <= 100; progress += 25) {
            await new Promise(resolve => setTimeout(resolve, 300))
            setUploadedFiles(prev =>
              prev.map(f =>
                f.id === fileData.id
                  ? { ...f, progress }
                  : f
              )
            )
          }

          // Mark as complete
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileData.id
                ? {
                    ...f,
                    status: 'success' as const,
                    progress: 100,
                    supabaseId: artifactId,
                    storagePath: storagePath
                  }
                : f
            )
          )

          continue
        }

        // Update progress to 25%
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? { ...f, progress: 25 }
              : f
          )
        )

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('artifacts')
          .upload(storagePath, fileData.file)

        if (storageError) {
          console.error('Storage error:', storageError)
          // Check for common errors and provide helpful messages
          if (storageError.message?.includes('bucket')) {
            throw new Error('Storage bucket "artifacts" not found. Please create it in Supabase Dashboard.')
          } else if (storageError.message?.includes('policy')) {
            throw new Error('Storage policy not configured. Please set up storage policies in Supabase.')
          } else {
            throw new Error(`Storage upload failed: ${storageError.message || 'Unknown storage error'}`)
          }
        }

        // Update progress to 75%
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? { ...f, progress: 75 }
              : f
          )
        )

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('artifacts')
          .getPublicUrl(storagePath)

        // Save metadata to database
        const dbPayload = {
          artifact_id: artifactId,
          project_id: projectId,
          filename: fileData.file.name,
          mime: fileData.file.type || 'application/octet-stream',
          storage_url: publicUrl,
          created_at: new Date().toISOString()
        }

        const { data: dbData, error: dbError } = await supabase
          .from('artifacts')
          .insert(dbPayload)
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          // Check for common database errors
          if (dbError.message?.includes('relation') && dbError.message?.includes('does not exist')) {
            throw new Error('Database table "artifacts" not found. Please run the database schema setup.')
          } else if (dbError.message?.includes('policy')) {
            throw new Error('Database policy not configured. Please set up RLS policies in Supabase.')
          } else {
            throw new Error(`Database insert failed: ${dbError.message || 'Unknown database error'}`)
          }
        }

        // Mark as complete
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'success' as const,
                  progress: 100,
                  supabaseId: artifactId,
                  storagePath: storagePath
                }
              : f
          )
        )

      } catch (error) {
        console.error('Upload error details:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          fileName: fileData.file.name,
          projectId
        })

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : `Upload failed: ${JSON.stringify(error)}`
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-emerald to-electric-500 flex items-center justify-center">
                <File className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="heading-md" style={{ color: 'var(--foreground)' }}>
                  Uploaded Artifacts ({uploadedFiles.length})
                </h4>
                <p className="body-sm" style={{ color: 'var(--space-400)' }}>
                  Files ready for analysis
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {uploadedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center gap-4 p-5 rounded-xl bg-space-200/50 border border-space-300 hover:border-space-400 transition-colors"
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