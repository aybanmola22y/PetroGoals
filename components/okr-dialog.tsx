"use client"

import * as React from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { OKR, KeyResult, Initiative, DEPARTMENTS, Department, TargetType, MilestoneStage, DEFAULT_MILESTONE_STAGES } from "@/types/okr"

interface OKRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  okr?: OKR | null
  onSubmit: (okr: Omit<OKR, "id" | "createdAt" | "updatedAt">) => void
}

const generateId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const defaultKeyResult: () => KeyResult = () => ({
  id: generateId(),
  title: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  target: 100,
  current: 0,
  unit: "%",
  targetType: "quantitative",
  milestoneStages: undefined,
  progressHistory: [],
})

const defaultInitiative: () => Initiative = () => ({
  id: generateId(),
  title: "",
  completed: false,
  assignee: "",
  comments: [],
})

const createMilestoneStages = (): MilestoneStage[] => {
  return DEFAULT_MILESTONE_STAGES.map((stage, index) => ({
    id: generateId(),
    ...stage,
  }))
}

const createCustomMilestoneStages = (): MilestoneStage[] => {
  return [
    { id: generateId(), name: "Stage 1", weight: 50, progress: 0 },
    { id: generateId(), name: "Stage 2", weight: 50, progress: 0 },
  ]
}

const recalculateWeights = (stages: MilestoneStage[]): MilestoneStage[] => {
  const weight = Math.floor(100 / stages.length)
  const remainder = 100 - (weight * stages.length)
  return stages.map((stage, index) => ({
    ...stage,
    weight: index === stages.length - 1 ? weight + remainder : weight
  }))
}

export function OKRDialog({ open, onOpenChange, okr, onSubmit }: OKRDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [department, setDepartment] = React.useState<Department>("Operations")
  const [goal, setGoal] = React.useState("")
  const [keyResults, setKeyResults] = React.useState<KeyResult[]>([defaultKeyResult()])
  const [initiatives, setInitiatives] = React.useState<Initiative[]>([defaultInitiative()])

  React.useEffect(() => {
    if (okr) {
      setDepartment(okr.department)
      setGoal(okr.goal)
      setKeyResults(okr.keyResults.length > 0 ? okr.keyResults : [defaultKeyResult()])
      setInitiatives(okr.initiatives.length > 0 ? okr.initiatives : [defaultInitiative()])
    } else {
      setDepartment("Operations")
      setGoal("")
      setKeyResults([defaultKeyResult()])
      setInitiatives([defaultInitiative()])
    }
  }, [okr, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const validKeyResults = keyResults.filter(kr => kr.title.trim())
    const validInitiatives = initiatives.filter(init => init.title.trim())

    await new Promise(resolve => setTimeout(resolve, 300))

    onSubmit({
      department,
      goal,
      status: "on-track",
      keyResults: validKeyResults,
      initiatives: validInitiatives,
    })

    setIsLoading(false)
    onOpenChange(false)
  }

  const addKeyResult = () => {
    setKeyResults([...keyResults, defaultKeyResult()])
  }

  const removeKeyResult = (id: string) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter(kr => kr.id !== id))
    }
  }

  const updateKeyResult = (id: string, updates: Partial<KeyResult>) => {
    setKeyResults(keyResults.map(kr => kr.id === id ? { ...kr, ...updates } : kr))
  }

  const handleTargetTypeChange = (id: string, targetType: TargetType) => {
    if (targetType === "milestone") {
      updateKeyResult(id, {
        targetType,
        milestoneStages: createMilestoneStages(),
        target: 100,
        unit: "%"
      })
    } else if (targetType === "milestone-custom") {
      updateKeyResult(id, {
        targetType,
        milestoneStages: createCustomMilestoneStages(),
        target: 100,
        unit: "%"
      })
    } else {
      updateKeyResult(id, {
        targetType,
        milestoneStages: undefined
      })
    }
  }

  const addCustomStage = (krId: string) => {
    const kr = keyResults.find(k => k.id === krId)
    if (!kr || !kr.milestoneStages) return
    
    const newStages = [...kr.milestoneStages, { 
      id: generateId(), 
      name: `Stage ${kr.milestoneStages.length + 1}`, 
      weight: 0, 
      progress: 0 
    }]
    const recalculatedStages = recalculateWeights(newStages)
    
    updateKeyResult(krId, { milestoneStages: recalculatedStages })
  }

  const removeCustomStage = (krId: string, stageId: string) => {
    const kr = keyResults.find(k => k.id === krId)
    if (!kr || !kr.milestoneStages || kr.milestoneStages.length <= 2) return
    
    const newStages = kr.milestoneStages.filter(s => s.id !== stageId)
    const recalculatedStages = recalculateWeights(newStages)
    
    const totalProgress = recalculatedStages.reduce((acc, stage) => {
      return acc + (stage.progress * stage.weight / 100)
    }, 0)
    
    updateKeyResult(krId, { 
      milestoneStages: recalculatedStages,
      current: Math.round(totalProgress)
    })
  }

  const updateCustomStageName = (krId: string, stageId: string, name: string) => {
    const kr = keyResults.find(k => k.id === krId)
    if (!kr || !kr.milestoneStages) return
    
    const updatedStages = kr.milestoneStages.map(stage =>
      stage.id === stageId ? { ...stage, name } : stage
    )
    
    updateKeyResult(krId, { milestoneStages: updatedStages })
  }

  const updateCustomStageWeight = (krId: string, stageId: string, weight: number) => {
    const kr = keyResults.find(k => k.id === krId)
    if (!kr || !kr.milestoneStages) return
    
    const updatedStages = kr.milestoneStages.map(stage =>
      stage.id === stageId ? { ...stage, weight: Math.min(100, Math.max(0, weight)) } : stage
    )
    
    const totalProgress = updatedStages.reduce((acc, stage) => {
      return acc + (stage.progress * stage.weight / 100)
    }, 0)
    
    updateKeyResult(krId, { 
      milestoneStages: updatedStages,
      current: Math.round(totalProgress)
    })
  }

  const getTotalWeight = (stages: MilestoneStage[]): number => {
    return stages.reduce((acc, stage) => acc + stage.weight, 0)
  }

  const updateMilestoneStage = (krId: string, stageId: string, progress: number) => {
    const kr = keyResults.find(k => k.id === krId)
    if (!kr || !kr.milestoneStages) return

    const updatedStages = kr.milestoneStages.map(stage =>
      stage.id === stageId ? { ...stage, progress: Math.min(100, Math.max(0, progress)) } : stage
    )

    const totalProgress = updatedStages.reduce((acc, stage) => {
      return acc + (stage.progress * stage.weight / 100)
    }, 0)

    updateKeyResult(krId, {
      milestoneStages: updatedStages,
      current: Math.round(totalProgress)
    })
  }

  const addInitiative = () => {
    setInitiatives([...initiatives, defaultInitiative()])
  }

  const removeInitiative = (id: string) => {
    if (initiatives.length > 1) {
      setInitiatives(initiatives.filter(init => init.id !== id))
    }
  }

  const updateInitiative = (id: string, updates: Partial<Initiative>) => {
    setInitiatives(initiatives.map(init => init.id === id ? { ...init, ...updates } : init))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{okr ? "Edit OKR" : "Create New OKR"}</DialogTitle>
          <DialogDescription>
            {okr ? "Update your objective and key results" : "Define a new objective with measurable key results"}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                    <SelectTrigger data-testid="select-okr-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Status</strong> is calculated automatically based on:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                    <li><span className="text-emerald-600 font-medium">On Track</span>: Regular updates and deadline is not near</li>
                    <li><span className="text-amber-600 font-medium">At Risk</span>: No updates for 7+ days with deadline within 2 weeks, or no updates for 30+ days</li>
                    <li><span className="text-red-600 font-medium">Off Track</span>: Deadline passed and OKR not completed</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Goal / Objective</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Reach 1M sales before 2026"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  className="min-h-[80px]"
                  data-testid="input-okr-goal"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Key Results</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addKeyResult}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Key Result
                  </Button>
                </div>

                {keyResults.map((kr, index) => (
                  <div key={kr.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Key Result {index + 1}</span>
                      {keyResults.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeKeyResult(kr.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        placeholder="e.g., Close 50 enterprise deals"
                        value={kr.title}
                        onChange={(e) => updateKeyResult(kr.id, { title: e.target.value })}
                        data-testid={`input-kr-title-${index}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          type="date"
                          value={kr.startDate}
                          onChange={(e) => updateKeyResult(kr.id, { startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date</Label>
                        <Input
                          type="date"
                          value={kr.endDate}
                          onChange={(e) => updateKeyResult(kr.id, { endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Target Type</Label>
                      <Select 
                        value={kr.targetType || "quantitative"} 
                        onValueChange={(v) => handleTargetTypeChange(kr.id, v as TargetType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quantitative">Target Value (Quantitative)</SelectItem>
                          <SelectItem value="milestone">Milestone (System Development)</SelectItem>
                          <SelectItem value="milestone-custom">Milestone (Custom Stages)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {kr.targetType === "milestone" && kr.milestoneStages ? (
                      <div className="space-y-3 p-3 bg-background/50 rounded-md border">
                        <div>
                          <Label className="text-xs font-medium">System Development Template (5 Stages)</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Progress will be calculated based on these 5 stages (20% each):
                          </p>
                        </div>
                        {kr.milestoneStages.map((stage) => (
                          <div key={stage.id} className="flex items-center justify-between gap-3">
                            <span className="text-sm flex-1">{stage.name}</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={stage.progress === 0 ? "" : stage.progress}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                                  updateMilestoneStage(kr.id, stage.id, Math.min(100, Math.max(0, val)))
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "") updateMilestoneStage(kr.id, stage.id, 0)
                                }}
                                placeholder="0"
                                className="w-20 h-8 text-sm"
                              />
                              <span className="text-xs text-muted-foreground w-8">{stage.weight}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : kr.targetType === "milestone-custom" && kr.milestoneStages ? (
                      <div className="space-y-3 p-3 bg-background/50 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs font-medium">Custom Milestone Stages</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Define your own stages with custom weights.
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addCustomStage(kr.id)}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Stage
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1 border-b">
                          <span className="flex-1">Stage Name</span>
                          <span className="w-16 text-center">Progress</span>
                          <span className="w-16 text-center">Weight</span>
                          <span className="w-7"></span>
                        </div>
                        {kr.milestoneStages.map((stage, stageIndex) => (
                          <div key={stage.id} className="flex items-center gap-2">
                            <Input
                              placeholder="Stage name"
                              value={stage.name}
                              onChange={(e) => updateCustomStageName(kr.id, stage.id, e.target.value)}
                              className="flex-1 h-8 text-sm"
                            />
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={stage.progress === 0 ? "" : stage.progress}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                                updateMilestoneStage(kr.id, stage.id, Math.min(100, Math.max(0, val)))
                              }}
                              onBlur={(e) => {
                                if (e.target.value === "") updateMilestoneStage(kr.id, stage.id, 0)
                              }}
                              placeholder="0"
                              className="w-16 h-8 text-sm text-center"
                            />
                            <div className="flex items-center w-16">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={stage.weight === 0 ? "" : stage.weight}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                                  updateCustomStageWeight(kr.id, stage.id, Math.min(100, Math.max(0, val)))
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "") updateCustomStageWeight(kr.id, stage.id, 0)
                                }}
                                placeholder="0"
                                className="w-12 h-8 text-sm text-center"
                              />
                              <span className="text-xs text-muted-foreground ml-0.5">%</span>
                            </div>
                            {kr.milestoneStages!.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive shrink-0"
                                onClick={() => removeCustomStage(kr.id, stage.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="flex items-center justify-end pt-2 border-t">
                          <span className={`text-xs font-medium ${getTotalWeight(kr.milestoneStages) === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            Total Weight: {getTotalWeight(kr.milestoneStages)}%
                            {getTotalWeight(kr.milestoneStages) !== 100 && ' (should be 100%)'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Target Value</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={kr.target === 0 ? "" : kr.target}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value) || 0
                              updateKeyResult(kr.id, { target: val })
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input
                            placeholder="e.g., deals, USD, %"
                            value={kr.unit}
                            onChange={(e) => updateKeyResult(kr.id, { unit: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Initiatives</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInitiative}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Initiative
                  </Button>
                </div>

                {initiatives.map((init, index) => (
                  <div key={init.id} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Initiative title"
                        value={init.title}
                        onChange={(e) => updateInitiative(init.id, { title: e.target.value })}
                        data-testid={`input-initiative-title-${index}`}
                      />
                      <Input
                        placeholder="Assignee"
                        value={init.assignee || ""}
                        onChange={(e) => updateInitiative(init.id, { assignee: e.target.value })}
                      />
                    </div>
                    {initiatives.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => removeInitiative(init.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t gap-3 flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !goal.trim()} data-testid="button-submit-okr">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                okr ? "Update OKR" : "Create OKR"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
