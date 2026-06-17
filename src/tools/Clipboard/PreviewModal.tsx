import { useState, useEffect, useCallback } from "react"
import type { ClipboardRecord } from "./hooks"

interface Props {
  record: ClipboardRecord | null
  onClose: () => void
  onCopy: (record: ClipboardRecord) => void
  onPaste: (record: ClipboardRecord) => void
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString("zh-CN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function PreviewModal({ record, onClose, onCopy, onPaste }: Props) {
  const [fullImage, setFullImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (record?.type === "image" || record?.type === "file") {
      if (record.imagePath && !record.thumbnail?.startsWith('data:image/jpeg;base64,')) {
        setFullImage(null)
        const api = (window as any).electronAPI
        api?.clipboard?.readImageFull(record.imagePath).then((data: string | null) => {
          setFullImage(data)
        })
      }
    }
  }, [record])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const handleCopy = useCallback(() => {
    if (!record) return
    onCopy(record)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [record, onCopy])

  if (!record) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-[700px] max-h-[85vh] w-full mx-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">{record.type === "file" ? "📁" : record.type === "image" ? "🖼️" : "📄"}</span>
            <div>
              <span className="text-sm font-semibold text-text-primary">
                {record.type === "file" ? "文件预览" : record.type === "image" ? "图片预览" : "文本预览"}
              </span>
              <span className="text-[11px] text-text-muted ml-2">{formatTime(record.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="px-3 h-8 rounded-lg bg-accent/10 text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors"
            >
              {copied ? "已复制 ✓" : "复制"}
            </button>
            <button
              onClick={() => onPaste(record)}
              className="px-3 h-8 rounded-lg bg-accent text-white text-[12px] font-medium hover:opacity-90 transition-opacity"
            >
              粘贴
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {record.type === "file" ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
              {record.thumbnail && (
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-secondary/50 flex items-center justify-center">
                  <img src={record.thumbnail} alt={record.content} className="w-16 h-16 object-contain" />
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-medium text-text-primary">{record.content}</div>
                {record.filePath && (
                  <div className="text-[11px] text-text-muted mt-1.5 max-w-full break-all">{record.filePath}</div>
                )}
              </div>
            </div>
          ) : record.type === "image" ? (
            <div className="flex items-center justify-center min-h-[200px]">
              {fullImage ? (
                <img
                  src={fullImage}
                  alt="预览"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : record.thumbnail ? (
                <img src={record.thumbnail} alt="预览" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
              ) : (
                <div className="text-text-muted text-sm">加载中...</div>
              )}
            </div>
          ) : (
            <pre className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap break-all font-sans">
              {record.content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-border shrink-0 text-[11px] text-text-muted">
          {(record.type === "image" || record.type === "file") && record.imageWidth && record.imageHeight && (
            <span>{record.imageWidth} × {record.imageHeight}</span>
          )}
          <span>{record.type === "text" ? `${record.content.length} 个字符` : ""}</span>
          {record.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {record.category}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}