import { useEffect, useRef } from 'react'

export function useNotificationTitle(unreadCount) {
  const originalTitleRef = useRef(null)

  useEffect(() => {
    if (originalTitleRef.current == null) {
      originalTitleRef.current = document.title || 'SyncDesk'
    }

    const originalTitle = originalTitleRef.current

    document.title = unreadCount > 0
      ? `(${unreadCount}) ${originalTitle}`
      : originalTitle

    return () => {
      document.title = originalTitle
    }
  }, [unreadCount])
}
