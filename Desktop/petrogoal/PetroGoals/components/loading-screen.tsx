"use client"

import { Target } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function LoadingScreen() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(2)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Countdown from 2 seconds
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Auto-redirect after 2 seconds
      handleRedirect()
    }
  }, [countdown])

  useEffect(() => {
    // Show manual button after 5 seconds total
    const timeout = setTimeout(() => {
      console.warn("⚠️ Loading timeout reached, showing manual option")
      setShowButton(true)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  const handleRedirect = () => {
    console.log("🔄 Auto-redirecting to dashboard...")
    const user = localStorage.getItem("user")
    if (user) {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/login"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
          />
          <div className="p-4 rounded-full bg-primary/10">
            <Target className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">PetroGoals</h2>
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {countdown > 0 ? `Redirecting in ${countdown}...` : "Loading your dashboard..."}
          </p>
          
          {showButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleRedirect}
              className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Click here if stuck
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}