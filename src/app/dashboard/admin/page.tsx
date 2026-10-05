// REVIEW: redirect stub; use redirects() in next.config.ts or delete.
import { redirect } from 'next/navigation'

export default function OldAdminPage() {
  redirect('/admin')
}
