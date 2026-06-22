import { useState, useEffect } from 'react'
import { onAuthChange, getSession } from '../lib/db.js'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = onAuthChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return { session, loading: session === undefined }
}
