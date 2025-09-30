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
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card variant="holo" className="relative overflow-hidden">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer',
              'hover:border-electric-500/50 hover:bg-electric-500/5',
              {
                'border-electric-500 bg-electric-500/10': isDragActive,
                'border-space-300': !isDragActive,
                'opacity-50 cursor-not-allowed': isUploading,
              }
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              <div className={clsx(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                {
                  'bg-electric-500/20 text-electric-500': isDragActive,
                  'bg-space-200 text-gray-400': !isDragActive,
                }
              )}>
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload data artifacts'}
                </h3>
                <p className="text-gray-400 mb-4">
                  Drag & drop files or click to browse
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {acceptedFileTypes.map(type => (
                    <Badge key={type} variant="info" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={isUploading}
                className="mt-4"
              >
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card variant="default">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <File className="w-5 h-5" />
              Uploaded Artifacts ({uploadedFiles.length})
            </h4>

            <div className="space-y-3">
              {uploadedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-space-200/50 border border-space-300"
                >
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(fileData.file.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-medium text-white truncate">
                        {fileData.file.name}
                      </p>
                      <Badge
                        variant={getFileTypeColor(fileData.file.name) as any}
                        className="text-xs"
                      >
                        {fileData.file.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {(fileData.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    {fileData.status === 'uploading' && (
                      <Progress value={fileData.progress} variant="default" animated />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {fileData.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-neon-emerald" />
                    )}
                    {fileData.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-neon-rose" />
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={fileData.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}