/**
 * Sanity Studio layout - bypasses Clerk authentication entirely.
 * Sanity Studio has its own authentication system.
 */

export const metadata = {
  title: 'Sanity Studio | FlowIntent',
  description: 'Content management studio',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
