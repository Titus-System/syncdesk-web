export const TICKET_STATUS_LABELS = {
  open: 'Aberto',
  awaiting_assignment: 'Aguardando atendimento',
  in_progress: 'Em andamento',
  waiting_for_provider: 'Aguardando fornecedor',
  waiting_for_validation: 'Aguardando validação',
  finished: 'Finalizado'
}

export const TICKET_STATUS_CLASSES = {
  open: 'bg-orange-50 text-orange-700',
  awaiting_assignment: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  waiting_for_provider: 'bg-yellow-50 text-yellow-700',
  waiting_for_validation: 'bg-purple-50 text-purple-700',
  finished: 'bg-green-50 text-green-700'
}

export function normalizeStatus(status) {
  return String(status ?? '').trim().toLowerCase()
}

export function getTicketStatusLabel(status) {
  const normalized = normalizeStatus(status)
  return TICKET_STATUS_LABELS[normalized] || status || 'Sem status'
}

export function getTicketStatusBadgeClass(status) {
  const normalized = normalizeStatus(status)
  return TICKET_STATUS_CLASSES[normalized] || 'bg-gray-100 text-gray-600'
}

export function isTicketFinishedStatus(status) {
  return normalizeStatus(status) === 'finished'
}