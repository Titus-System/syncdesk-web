function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesConversationSearch(conversation, rawSearch) {
  const search = normalizeText(rawSearch)

  if (!search) {
    return true
  }

  const tokens = search.split(/\s+/).filter(Boolean)

  const haystack = normalizeText([
    conversation?.client_name,
    conversation?.client_email,
    conversation?.product,
    conversation?.description,
    conversation?.last_message,
    ...(conversation?.notes || [])
  ].join(' '))

  return tokens.every((token) => haystack.includes(token))
}