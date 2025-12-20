"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { LogoutScreen } from "@/components/logout-screen"
import { store } from "@/lib/store"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  React.useEffect(() => {
    const initializeApp = async () => {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          store.setCurrentUser(user)
          setIsAuthenticated(true)
          await store.initialize()
          setIsInitialized(true)
        } catch {
          localStorage.removeItem("user")
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
      setIsLoading(false)
    }
    
    initializeApp()
  }, [router])

  const handleLogout = () => {
    setIsLoggingOut(true)
    setTimeout(() => {
      store.logout()
      localStorage.removeItem("user")
      router.push("/login")
    }, 1500)
  }

  if (isLoggingOut) {
    return <LogoutScreen />
  }

  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onLogout={handleLogout} />
      <main className={isMobile ? "pb-6" : "ml-64"}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
