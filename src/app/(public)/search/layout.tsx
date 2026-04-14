export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Override the public layout to remove footer on search page
  // The search page uses full-height split view (list + map)
  return <>{children}</>
}
