import { redirect } from 'next/navigation'

/** @deprecated Content Zone removed — use dashboard chat in Content Mode */
export default function ContentZoneRedirectPage() {
  redirect('/dashboard?mode=content')
}
