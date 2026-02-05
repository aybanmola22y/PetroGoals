"use client"

import { Target } from "lucide-react"
import { motion } from "framer-motion"

interface SavingOKRScreenProps {
  mode: "creating" | "updating" | "deleting"
}

export function SavingOKRScreen({ mode }: SavingOKRScreenProps) {
  const config = {
    creating: {
      title: "Creating OKR",
      message: "Setting up your new objective..."
    },
    updating: {
      title: "Updating OKR",
      message: "Saving your changes..."
    },
    deleting: {
      title: "Deleting OKR",
      message: "Removing the objective..."
    }
  }

  const { title, message } = config[mode]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
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
          <h2 className="text-xl font-semibold">{title}</h2>
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
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
