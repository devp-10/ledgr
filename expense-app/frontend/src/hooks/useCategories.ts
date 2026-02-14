import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.getCategories()
      const all = [...(data.categories || []), ...(data.custom || [])]
      setCategories([...new Set(all)])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addCategory = useCallback(async (name: string) => {
    await api.addCategory(name)
    await load()
  }, [load])

  return { categories, loading, refetch: load, addCategory }
}
