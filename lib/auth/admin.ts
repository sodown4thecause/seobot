export const ADMIN_EMAIL = 'liam@flowintent.com'

export function isAdminEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL
}
