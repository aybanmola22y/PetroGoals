"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { OKR } from "@/types/okr"
import { COMPANY_INFO, STRATEGIC_PILLAR_SUBTITLES } from "@/lib/store"
import { useStrategicPillar } from "@/components/strategic-pillar-context"
import { Target, ChevronDown } from "lucide-react"

interface StrategicPillarsOverviewProps {
  okrs: OKR[]
}

export function StrategicPillarsOverview({ okrs }: StrategicPillarsOverviewProps) {
  const { selectedPillar, setSelectedPillar } = useStrategicPillar()

  const handlePillarSelect = (pillar: string) => {
    const newValue = selectedPillar === pillar ? null : pillar
    setSelectedPillar(newValue)
  }

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

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case "on-track": return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "at-risk": return "bg-amber-100 text-amber-800 border-amber-300"
      case "off-track": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
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
      <CardContent className="space-y-6">
        {/* Pillar Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COMPANY_INFO.strategicPlan.map((pillar) => {
            const progress = calculatePillarProgress(pillar)
            const pillarOKRs = okrs.filter(o => o.strategicPillar === pillar)
            const isSelected = selectedPillar === pillar

            return (
              <button
                key={pillar}
                onClick={() => handlePillarSelect(pillar)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-primary">{pillar}</p>
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    {STRATEGIC_PILLAR_SUBTITLES[pillar]}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">
                      {pillarOKRs.length} OKR{pillarOKRs.length !== 1 ? 's' : ''}
                    </span>
                    <Badge className={`${getStatusColor(progress)} text-white text-xs`}>
                      {progress}%
                    </Badge>
                  </div>
                  {isSelected && (
                    <ChevronDown className="h-4 w-4 text-primary mt-1" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Pillar Details */}
        {selectedPillar && (
          <div className="space-y-4 pt-6 border-t">
            <div>
              <h3 className="font-semibold text-lg mb-1">{selectedPillar}</h3>
              <p className="text-sm text-muted-foreground italic mb-4">
                {STRATEGIC_PILLAR_SUBTITLES[selectedPillar]}
              </p>
            </div>

            <div className="space-y-3">
              {okrs.filter(o => o.strategicPillar === selectedPillar).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No OKRs linked to this strategic pillar yet.
                </p>
              ) : (
                okrs
                  .filter(o => o.strategicPillar === selectedPillar)
                  .map((okr) => {
                    const krProgress = okr.keyResults.length > 0
                      ? Math.round(
                          okr.keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) /
                          okr.keyResults.length
                        )
                      : 0

                    return (
                      <div key={okr.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{okr.goal}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {okr.department}
                              </Badge>
                              <Badge className={`text-xs border ${getStatusBadgeColor(okr.status)}`}>
                                {okr.status === "on-track"
                                  ? "On Track"
                                  : okr.status === "at-risk"
                                  ? "At Risk"
                                  : "Off Track"}
                              </Badge>
                              {okr.createdBy && (
                                <Badge variant="secondary" className="text-xs">
                                  By: {okr.createdBy}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(krProgress)} text-white shrink-0`}>
                            {krProgress}%
                          </Badge>
                        </div>
                        <Progress value={krProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {okr.keyResults.length} key result{okr.keyResults.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
