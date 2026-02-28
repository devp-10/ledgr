import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { setCategoryEmojiMap } from '../components/ui/Badge'

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.getCategories()
      const items = data.categories || []
      setCategories(items.map(c => c.name))
      setCategoryEmojiMap(Object.fromEntries(items.map(c => [c.name, c.emoji])))
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { categories, loading, refetch: load }
}
