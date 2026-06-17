import { useState, useEffect, useCallback } from 'react'

export function useFileStorage<T>(filename: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.storage) {
      const item = localStorage.getItem(filename)
      if (item) {
        try {
          const parsed = JSON.parse(item)
          if (!(Array.isArray(parsed) && parsed.length === 0)) setValue(parsed)
        } catch { /* ignore */ }
      }
      setLoaded(true)
      return
    }
    api.storage.read(filename).then((data: T | null) => {
      if (data !== null && !(Array.isArray(data) && data.length === 0)) setValue(data)
      setLoaded(true)
    })
  }, [filename])

  const persist = useCallback(
    (next: T) => {
      const api = (window as any).electronAPI
      if (api?.storage) {
        api.storage.write(filename, next)
      } else {
        try { localStorage.setItem(filename, JSON.stringify(next)) } catch { /* ignore */ }
      }
    },
    [filename],
  )

  const setAndPersist = useCallback(
    (val: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = val instanceof Function ? val(prev) : val
        persist(next)
        return next
      })
    },
    [persist],
  )

  return [value, setAndPersist, loaded] as const
}