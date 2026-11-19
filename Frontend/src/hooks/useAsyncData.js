import { useEffect, useState } from 'react'

export default function useAsyncData(load, key = '') {
  const [data, setData] = useState()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    load()
      .then((result) => {
        if (active) {
          setData(result)
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [key, revision])

  return {
    data,
    error,
    loading,
    refresh: () => setRevision((value) => value + 1),
  }
}

