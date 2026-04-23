export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4

    if (padding) {
      base64 += '='.repeat(4 - padding)
    }

    const decoded = atob(base64)
    const normalized = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )

    return JSON.parse(normalized)
  } catch {
    try {
      return JSON.parse(atob(parts[1]))
    } catch {
      return null
    }
  }
}