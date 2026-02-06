import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

function ReceiptUpload({ onUpload, uploading = false, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useState({}) // { filename: 'uploading' | 'success' | 'error' }
  const fileInputRef = useRef(null)

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Ungültiger Dateityp' }
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'Datei zu groß (max. 10MB)' }
    }
    return { valid: true }
  }

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }, [disabled, uploading])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled, uploading])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleFiles = async (files) => {
    const validFiles = []

    for (const file of files) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: { status: 'error', message: validation.error }
        }))
      }
    }

    if (validFiles.length === 0) return

    setSelectedFiles(validFiles)

    // Upload each file
    for (const file of validFiles) {
      setUploadStatus(prev => ({
        ...prev,
        [file.name]: { status: 'uploading' }
      }))

      try {
        if (onUpload) {
          const result = await onUpload(file)
          setUploadStatus(prev => ({
            ...prev,
            [file.name]: {
              status: result.success ? 'success' : 'error',
              message: result.error?.message
            }
          }))
        }
      } catch (err) {
        setUploadStatus(prev => ({
          ...prev,
          [file.name]: { status: 'error', message: err.message }
        }))
      }
    }

    // Clear selected files after a delay
    setTimeout(() => {
      setSelectedFiles([])
      setUploadStatus({})
    }, 3000)
  }

  const removeFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName))
    setUploadStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[fileName]
      return newStatus
    })
  }

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />
    }
    return <Image className="w-5 h-5 text-blue-500" />
  }

  const getStatusIcon = (status) => {
    switch (status?.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
            : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500'
          }
          ${disabled || uploading
            ? 'opacity-50 cursor-not-allowed'
            : ''
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${isDragging
              ? 'bg-purple-100 dark:bg-purple-500/20'
              : 'bg-slate-100 dark:bg-slate-800'
            }
          `}>
            {uploading ? (
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            ) : (
              <Upload className={`w-8 h-8 ${isDragging ? 'text-purple-500' : 'text-slate-400'}`} />
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {uploading
                ? 'Wird hochgeladen...'
                : isDragging
                  ? 'Datei hier ablegen'
                  : 'Rechnung hochladen'
              }
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              PDF, JPG, PNG oder WEBP - max. 10MB
            </p>
          </div>

          {!uploading && !isDragging && (
            <button
              type="button"
              className="mt-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              Datei auswählen
            </button>
          )}
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
            >
              {getFileIcon(file)}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {uploadStatus[file.name]?.message && (
                    <span className="text-red-500 ml-2">
                      - {uploadStatus[file.name].message}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(uploadStatus[file.name])}

                {!uploadStatus[file.name] || uploadStatus[file.name].status === 'error' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.name)
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
        Rechnungen werden automatisch analysiert und als Abo-Vorschlag gespeichert
      </p>
    </div>
  )
}

export default ReceiptUpload
