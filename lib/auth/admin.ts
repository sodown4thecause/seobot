export const ADMIN_EMAIL = 'liam@flowintent.com'

const ADMIN_EMAILS = new Set([
  ADMIN_EMAIL,
  'liam.wilson1990@gmail.com',
])

export function isAdminEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase()
  return normalized ? ADMIN_EMAILS.has(normalized) : false
}
