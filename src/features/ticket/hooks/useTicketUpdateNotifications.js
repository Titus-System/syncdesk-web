import { useEffect, useMemo, useRef } from 'react'
import { useTicketsQuery } from '@/features/ticket/hooks/useTicketsQuery'
import { useNotificationStore } from '@/stores/notification-store'

const TICKET_ALERT_POLLING_INTERVAL = 4000

function getTicketId(ticket) {
  return ticket?.id ?? ticket?.ticket_id ?? ticket?.ticketId ?? null
}

function getAssigneeId(ticket) {
  return (
    ticket?.assigned_agent_id ??
    ticket?.assignedAgentId ??
    ticket?.current_agent_id ??
    ticket?.currentAgentId ??
    ticket?.agent_id ??
    ticket?.agentId ??
    ticket?.assignee_id ??
    ticket?.assigneeId ??
    ticket?.assigned_to ??
    ticket?.assignedTo ??
    ticket?.responsible_id ??
    ticket?.responsibleId ??
    ticket?.assigned_agent?.id ??
    ticket?.assignedAgent?.id ??
    ticket?.agent?.id ??
    ticket?.assignee?.id ??
    null
  )
}

function getUpdatedAt(ticket) {
  return (
    ticket?.updated_at ??
    ticket?.updatedAt ??
    ticket?.update_date ??
    ticket?.updateDate ??
    ticket?.last_update ??
    ticket?.lastUpdate ??
    ticket?.modified_at ??
    ticket?.modifiedAt ??
    null
  )
}

function buildTicketSnapshot(tickets) {
  const snapshot = new Map()

  tickets.forEach((ticket) => {
    const id = getTicketId(ticket)

    if (!id) {
      return
    }

    snapshot.set(String(id), JSON.stringify({
      status: ticket?.status ?? null,
      assigneeId: getAssigneeId(ticket),
      level: ticket?.level ?? null,
      criticality: ticket?.criticality ?? null,
      updatedAt: getUpdatedAt(ticket)
    }))
  })

  return snapshot
}

function hasRelevantTicketUpdate(previousSnapshot, nextSnapshot) {
  for (const [ticketId, nextSignature] of nextSnapshot) {
    const previousSignature = previousSnapshot.get(ticketId)

    if (!previousSignature || previousSignature !== nextSignature) {
      return true
    }
  }

  return false
}

export function useTicketUpdateNotifications({ enabled }) {
  const previousSnapshotRef = useRef(null)
  const incrementTicketUpdates = useNotificationStore((state) => state.incrementTicketUpdates)

  const ticketsQuery = useTicketsQuery(
    {
      source: 'all',
      fetchAll: true
    },
    {
      enabled,
      refetchInterval: enabled ? TICKET_ALERT_POLLING_INTERVAL : false,
      refetchIntervalInBackground: true,
      staleTime: 0,
      retry: false
    }
  )

  const tickets = useMemo(() => {
    return Array.isArray(ticketsQuery.data) ? ticketsQuery.data : []
  }, [ticketsQuery.data])

  useEffect(() => {
    if (!enabled) {
      previousSnapshotRef.current = null
      return
    }

    if (!ticketsQuery.isSuccess) {
      return
    }

    const nextSnapshot = buildTicketSnapshot(tickets)
    const previousSnapshot = previousSnapshotRef.current

    if (!previousSnapshot) {
      previousSnapshotRef.current = nextSnapshot
      return
    }

    if (hasRelevantTicketUpdate(previousSnapshot, nextSnapshot)) {
      incrementTicketUpdates()
    }

    previousSnapshotRef.current = nextSnapshot
  }, [enabled, incrementTicketUpdates, tickets, ticketsQuery.isSuccess])
}
