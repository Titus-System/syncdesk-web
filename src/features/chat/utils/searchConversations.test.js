import { describe, expect, it } from 'vitest'
import { matchesConversationSearch } from './searchConversations'

describe('matchesConversationSearch', () => {
  const conversation = {
    client_name: 'Maria Souza',
    client_email: 'maria@empresa.com',
    product: 'Produto A',
    description: 'Erro ao emitir boleto no financeiro',
    last_message: 'Sistema travou ao salvar',
    notes: ['Cliente informou urgência alta', 'Financeiro parado']
  }

  it('retorna true quando busca vazia', () => {
    expect(matchesConversationSearch(conversation, '')).toBe(true)
  })

  it('encontra por cliente', () => {
    expect(matchesConversationSearch(conversation, 'maria')).toBe(true)
  })

  it('encontra por produto', () => {
    expect(matchesConversationSearch(conversation, 'produto a')).toBe(true)
  })

  it('encontra por descricao', () => {
    expect(matchesConversationSearch(conversation, 'emitir boleto')).toBe(true)
  })

  it('encontra por notas', () => {
    expect(matchesConversationSearch(conversation, 'financeiro parado')).toBe(true)
  })

  it('retorna false quando nao encontra', () => {
    expect(matchesConversationSearch(conversation, 'cadastro fornecedor')).toBe(false)
  })

  it('aceita multiplos tokens', () => {
    expect(matchesConversationSearch(conversation, 'maria boleto')).toBe(true)
  })
})