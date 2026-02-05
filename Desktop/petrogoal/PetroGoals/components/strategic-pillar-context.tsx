"use client"

import React, { createContext, useContext, useState } from "react"

interface StrategicPillarContextType {
  selectedPillar: string | null
  setSelectedPillar: (pillar: string | null) => void
}

const StrategicPillarContext = createContext<StrategicPillarContextType | undefined>(undefined)

export function StrategicPillarProvider({ children }: { children: React.ReactNode }) {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)

  return (
    <StrategicPillarContext.Provider value={{ selectedPillar, setSelectedPillar }}>
      {children}
    </StrategicPillarContext.Provider>
  )
}

export function useStrategicPillar() {
  const context = useContext(StrategicPillarContext)
  if (!context) {
    throw new Error("useStrategicPillar must be used within StrategicPillarProvider")
  }
  return context
}
