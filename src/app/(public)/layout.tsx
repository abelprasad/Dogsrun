// REVIEW: passthrough; move Navbar + footer here from the root layout (the intended design) or delete it.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
