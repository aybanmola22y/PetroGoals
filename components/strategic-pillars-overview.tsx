"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { OKR } from "@/types/okr"
import { COMPANY_INFO } from "@/lib/store"
import { Target } from "lucide-react"

interface StrategicPillarsOverviewProps {
  okrs: OKR[]
}

export function StrategicPillarsOverview({ okrs }: StrategicPillarsOverviewProps) {
  const calculatePillarProgress = (pillarName: string): number => {
    const pillarOKRs = okrs.filter(o => o.strategicPillar === pillarName)
    if (pillarOKRs.length === 0) return 0
    
    let totalProgress = 0
    let totalKeyResults = 0
    
    for (const okr of pillarOKRs) {
      for (const kr of okr.keyResults) {
        totalProgress += (kr.current / kr.target) * 100
        totalKeyResults++
      }
    }
    
    if (totalKeyResults === 0) return 0
    return Math.round(totalProgress / totalKeyResults)
  }

  const getStatusColor = (progress: number): string => {
    if (progress >= 80) return "bg-emerald-500"
    if (progress >= 60) return "bg-amber-500"
    if (progress >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <div>
            <CardTitle>Strategic Pillars</CardTitle>
            <CardDescription>
              Organization progress across strategic initiatives
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {COMPANY_INFO.strategicPlan.map((pillar) => {
            const progress = calculatePillarProgress(pillar)
            const pillarOKRs = okrs.filter(o => o.strategicPillar === pillar)
            const totalKRs = pillarOKRs.reduce((sum, o) => sum + o.keyResults.length, 0)
            const onTrack = pillarOKRs.filter(o => o.status === 'on-track').length
            const atRisk = pillarOKRs.filter(o => o.status === 'at-risk').length
            const offTrack = pillarOKRs.filter(o => o.status === 'off-track').length

            return (
              <div key={pillar} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{pillar}</p>
                    <p className="text-xs text-muted-foreground">
                      {pillarOKRs.length} OKR{pillarOKRs.length !== 1 ? 's' : ''}, {totalKRs} key result{totalKRs !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(progress)} text-white`}>
                    {progress}%
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
