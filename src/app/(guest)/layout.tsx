import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      <Footer />
      <MobileBottomNav />
    </>
  )
}
