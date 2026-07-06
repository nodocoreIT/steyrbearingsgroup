// Wati.io integration — FUTURE (not in MVP)
// Full implementation post-MVP after WhatsApp Business verification.
// Ready for post-MVP Wati.io integration
// This file provides typed stubs so the rest of the codebase can import
// without conditional checks; all methods throw NotImplementedError at runtime.

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`Wati.io not implemented in MVP: ${method}`)
    this.name = 'NotImplementedError'
  }
}

export type WatiTemplateParams = Record<string, string>

export type WatiResult = {
  success: boolean
  messageId?: string
  error?: string
}

export class WatiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'WatiError'
  }
}

export const watiClient = {
  sendTemplate: async (
    _to: string,
    _templateName: string,
    _params: WatiTemplateParams
  ): Promise<WatiResult> => {
    throw new NotImplementedError('sendTemplate')
  },

  sendMessage: async (_to: string, _message: string): Promise<WatiResult> => {
    throw new NotImplementedError('sendMessage')
  },

  getContacts: async (): Promise<unknown[]> => {
    throw new NotImplementedError('getContacts')
  },
}
