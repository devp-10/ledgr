import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import clsx from 'clsx'

interface Props {
  onFile: (file: File) => void
  loading: boolean
}

export function FileUpload({ onFile, loading }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={clsx(
        'border-2 border-dashed rounded-2xl p-20 text-center transition-colors select-none',
        loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Parsing file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Drag & drop your bank statement here
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              or click to browse — CSV, XLS, XLSX supported
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
