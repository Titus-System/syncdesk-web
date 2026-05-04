import { http } from '@/lib/http'

function normalizeResponse(data) {
  return data?.data ?? data
}

function cleanParams(params = {}) {
  const ignoredKeys = new Set(['source', 'fetchAll', 'paginated'])
  const result = {}

  Object.entries(params).forEach(([key, value]) => {
    if (ignoredKeys.has(key)) {
      return
    }

    if (value === undefined || value === null || value === '') {
      return
    }

    result[key] = value
  })

  return result
}

function normalizeTicketPage(payload, fallbackParams = {}) {
  const data = normalizeResponse(payload)

  if (Array.isArray(data)) {
    return {
      items: data,
      page: Number(fallbackParams.page ?? 1),
      page_size: Number(fallbackParams.page_size ?? data.length ?? 20),
      total: data.length
    }
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const page = Number(data?.page ?? fallbackParams.page ?? 1)
  const pageSize = Number(data?.page_size ?? fallbackParams.page_size ?? items.length ?? 20)
  const rawTotal = Number(data?.total ?? items.length)
  const minimumTotal = Math.max((page - 1) * pageSize + items.length, items.length)
  const total = Math.max(Number.isFinite(rawTotal) ? rawTotal : 0, minimumTotal)

  return {
    items,
    page,
    page_size: pageSize,
    total
  }
}

function dedupeTickets(tickets) {
  const map = new Map()

  tickets.forEach((ticket) => {
    if (!ticket?.id) {
      return
    }

    map.set(String(ticket.id), ticket)
  })

  return Array.from(map.values())
}

export async function getTickets(params = {}) {
  const { data } = await http.get('/tickets/', {
    params: cleanParams(params)
  })

  return normalizeTicketPage(data, params)
}

export async function getQueueTickets(params = {}) {
  const { data } = await http.get('/tickets/queue', {
    params: cleanParams(params)
  })

  return normalizeTicketPage(data, params)
}

export async function fetchAllTickets(params = {}) {
  return fetchAllTicketPages({
    source: 'all',
    params
  })
}

export async function fetchAllQueueTickets(params = {}) {
  return fetchAllTicketPages({
    source: 'queue',
    params
  })
}

async function fetchAllTicketPages({ source, params = {} }) {
  const pageSize = Math.min(Number(params.page_size ?? 100), 100)
  const allItems = []
  let page = 1
  let total = null

  for (let index = 0; index < 50; index += 1) {
    const pageParams = {
      ...params,
      page,
      page_size: pageSize
    }

    const pageData = source === 'queue'
      ? await getQueueTickets(pageParams)
      : await getTickets(pageParams)

    allItems.push(...pageData.items)

    if (Number.isFinite(Number(pageData.total))) {
      total = Number(pageData.total)
    }

    if (pageData.items.length < pageSize) {
      break
    }

    if (total && total > 0 && allItems.length >= total) {
      break
    }

    page += 1
  }

  const items = dedupeTickets(allItems)

  return {
    items,
    page: 1,
    page_size: pageSize,
    total: items.length
  }
}

export async function createTicket(payload) {
  const { data } = await http.post('/tickets/', payload)
  return normalizeResponse(data)
}

export async function getTicketById(ticketId) {
  const { data } = await http.get(`/tickets/${ticketId}`)
  return normalizeResponse(data)
}

export async function updateTicket(ticketId, payload) {
  const { data } = await http.patch(`/tickets/${ticketId}`, payload)
  return normalizeResponse(data)
}

export async function updateTicketStatus({ ticketId, payload }) {
  const { data } = await http.patch(`/tickets/${ticketId}`, payload)
  return normalizeResponse(data)
}

export async function takeTicket(ticketId) {
  const { data } = await http.post(`/tickets/${ticketId}/take`)
  return normalizeResponse(data)
}

export async function assignTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/assign`, payload)
  return normalizeResponse(data)
}

export async function escalateTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/escalate`, payload)
  return normalizeResponse(data)
}

export async function transferTicket({ ticketId, payload }) {
  const { data } = await http.post(`/tickets/${ticketId}/transfer`, payload)
  return normalizeResponse(data)
}

export async function getTicketHistory(ticketId) {
  const { data } = await http.get(`/tickets/${ticketId}/history`)
  return normalizeResponse(data)
}