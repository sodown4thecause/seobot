import type { AnchorHTMLAttributes, ReactNode } from 'react'

export const CONTACT_EMAIL = 'liam@flowintent.com'
export const CONTACT_EMAIL_MAILTO = `mailto:${CONTACT_EMAIL}`

type EmailLinkProps = {
  children?: ReactNode
} & AnchorHTMLAttributes<HTMLAnchorElement>

export function EmailLink({ children, ...props }: EmailLinkProps) {
  return (
    <a href={CONTACT_EMAIL_MAILTO} {...props}>
      {children ?? 'Send an Email'}
    </a>
  )
}
