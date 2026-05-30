import { useQuery } from '@tanstack/react-query'
import {
  fetchAllQueueTickets,
  fetchAllTickets,
  getQueueTickets,
  getTickets
} from '@/features/ticket/api/ticket-service'

export function useTicketsQuery(params = {}, options = {}) {
  const {
    source = 'all',
    fetchAll = false,
    paginated = false,
    ...apiParams
  } = params ?? {}

  return useQuery({
    queryKey: ['tickets', source, fetchAll, paginated, apiParams],
    queryFn: async () => {
      let result

      if (source === 'queue') {
        result = fetchAll
          ? await fetchAllQueueTickets(apiParams)
          : await getQueueTickets(apiParams)
      } else {
        result = fetchAll
          ? await fetchAllTickets(apiParams)
          : await getTickets(apiParams)
      }

      return paginated ? result : result.items
    },
    ...options
  })
}