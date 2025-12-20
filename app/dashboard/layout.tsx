"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { LogoutScreen } from "@/components/logout-screen"
import { store } from "@/lib/store"
import { supabase } from "@/lib/supabase"
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
      // Check if we're in the middle of logging out
      const loggingOut = sessionStorage.getItem("logging_out")
      if (loggingOut) {
        console.log("🚪 Logout in progress, redirecting to login")
        sessionStorage.removeItem("logging_out")
        router.push("/login")
        return
      }

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
        // No user in localStorage, check Supabase session as fallback
        if (supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
              console.log("✅ Found Supabase session, creating user object")
              
              const user = {
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.user_metadata?.full_name ||
                      session.user.user_metadata?.name ||
                      `${session.user.user_metadata?.given_name || ''} ${session.user.user_metadata?.family_name || ''}`.trim() ||
                      session.user.email?.split("@")[0] || "User",
                profilePicture: session.user.user_metadata?.avatar_url || 
                               session.user.user_metadata?.picture || 
                               session.user.user_metadata?.photo ||
                               null,
              }

              localStorage.setItem("user", JSON.stringify(user))
              store.setCurrentUser(user)
              setIsAuthenticated(true)
              await store.initialize()
              setIsInitialized(true)
            } else {
              router.push("/login")
            }
          } catch (error) {
            console.error("Error checking Supabase session:", error)
            router.push("/login")
          }
        } else {
          router.push("/login")
        }
      }
      setIsLoading(false)
    }
    
    initializeApp()
  }, [router])

  const handleLogout = async () => {
    console.log("🚪 Logging out...")
    setIsLoggingOut(true)
    
    try {
      // Small delay to show the logout animation
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Set flag to prevent redirect loop
      sessionStorage.setItem("logging_out", "true")
      
      // Clear all user data
      store.logout()
      localStorage.removeItem("user")
      
      // Clear cookies
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
      
      // Sign out from Supabase if available
      if (supabase) {
        await supabase.auth.signOut()
      }
      
      // Hard redirect to clear all state
      window.location.href = "/login"
    } catch (error) {
      console.error("Error during logout:", error)
      // Force redirect even on error
      window.location.href = "/login"
    }
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