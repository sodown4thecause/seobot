import { redirect } from 'next/navigation'

/** @deprecated Content Zone removed — use dashboard chat in Content Mode */
export default function ContentZoneLegacyRedirectPage() {
  redirect('/dashboard?mode=content')
}
