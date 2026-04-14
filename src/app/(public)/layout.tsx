import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
