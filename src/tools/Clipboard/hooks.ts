import { useEffect, useCallback, useRef } from "react"
import { useFileStorage } from "../../hooks/useFileStorage"

export interface ClipboardRecord {
  id: string
  content: string
  type: "text" | "image" | "file"
  filePath?: string
  imagePath?: string
  thumbnail?: string
  imageWidth?: number
  imageHeight?: number
  category: string
  favorite: boolean
  createdAt: number
}

const MAX_RECORDS = 500

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useClipboardRecords() {
  const [records, setRecords, loaded] = useFileStorage<ClipboardRecord[]>("clipboard-items", [])

  const addRecord = useCallback(
    (data: ClipboardChangeData) => {
      setRecords((prev) => {
        if (data.type === "text") {
          const filtered = prev.filter((r) => r.type === "image" || r.content !== data.content)
          const record: ClipboardRecord = {
            id: generateId(),
            content: data.content || "",
            type: "text",
            category: "",
            favorite: false,
            createdAt: Date.now(),
          }
          const next = [record, ...filtered]
          return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next
        }
        const record: ClipboardRecord = {
          id: data.id || generateId(),
          content: data.type === "file" ? data.content || "" : "",
          type: data.type,
          filePath: data.filePath,
          imagePath: data.imagePath,
          thumbnail: data.thumbnail,
          imageWidth: data.width,
          imageHeight: data.height,
          category: "",
          favorite: false,
          createdAt: Date.now(),
        }
        const next = [record, ...prev]
        return next.length > MAX_RECORDS ? next.slice(0, MAX_RECORDS) : next
      })
    },
    [setRecords],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)))
    },
    [setRecords],
  )

  const setCategory = useCallback(
    (id: string, category: string) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)))
    },
    [setRecords],
  )

  const deleteRecord = useCallback(
    (id: string) => {
      setRecords((prev) => {
        const record = prev.find((r) => r.id === id)
        if (record?.imagePath) {
          const api = (window as any).electronAPI
          api?.clipboard?.deleteImage(record.imagePath)
        }
        return prev.filter((r) => r.id !== id)
      })
    },
    [setRecords],
  )

  const clearAll = useCallback(() => {
    setRecords((prev) => {
      for (const r of prev) {
        if (r.imagePath) {
          const api = (window as any).electronAPI
          api?.clipboard?.deleteImage(r.imagePath)
        }
      }
      return []
    })
  }, [setRecords])

  return { records, addRecord, toggleFavorite, setCategory, deleteRecord, clearAll, loaded }
}

export function useCategories(records: ClipboardRecord[]) {
  const [categories, setCategories] = useFileStorage<string[]>("clipboard-categories", [])

  const used = new Set(records.map((r) => r.category).filter(Boolean))
  const merged = Array.from(new Set([...categories, ...used])).sort()

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || categories.includes(trimmed)) return
      setCategories([...categories, trimmed])
    },
    [categories, setCategories],
  )

  const removeCategory = useCallback(
    (name: string) => {
      setCategories(categories.filter((c) => c !== name))
    },
    [categories, setCategories],
  )

  return { categories: merged, addCategory, removeCategory }
}

export function useClipboardWatcher(addRecord: (data: ClipboardChangeData) => void) {
  const addRef = useRef(addRecord)
  addRef.current = addRecord

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.clipboard) return

    api.clipboard.startWatch()
    api.clipboard.onChanged((data: ClipboardChangeData) => {
      addRef.current(data)
    })

    return () => {
      api.clipboard.stopWatch()
      api.clipboard.removeChanged()
    }
  }, [])
}