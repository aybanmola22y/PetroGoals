"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

// This is now just a fallback/redirect page
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Simply redirect to dashboard
    // The dashboard will handle session initialization
    console.log("🔄 Callback page hit, redirecting to dashboard...")
    router.push("/dashboard")
  }, [router])

  return <LoadingScreen />
}