/**
 * Product analytics event names — keep metadata-only (no prompt/content payloads).
 */
export const PRODUCT_EVENTS = {
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  MODE_SELECTED: 'mode_selected',
  ARTIFACT_SAVED: 'artifact_saved',
  SUBSCRIPTION_BLOCKED: 'subscription_blocked',
  TOOL_INVOKED: 'tool_invoked',
} as const

export type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS]
