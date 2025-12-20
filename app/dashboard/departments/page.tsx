"use client"

import * as React from "react"
import { Plus, Building2, Target, CheckCircle, AlertTriangle, XCircle, ChevronDown, Edit, Trash2, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OKRCard } from "@/components/okr-card"
import { OKRDialog } from "@/components/okr-dialog"
import { CheckInDialog } from "@/components/checkin-dialog"
import { SavingOKRScreen } from "@/components/saving-okr-screen"
import { store } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { OKR, DEPARTMENTS, Department, Comment } from "@/types/okr"
import { calculateProgress } from "@/lib/utils"

function CompactOKRCard({ 
  okr, 
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onCheckIn
}: { 
  okr: OKR
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onCheckIn: () => void
}) {
  const statusConfig = {
    "on-track": { color: "bg-emerald-500", icon: CheckCircle, label: "On Track" },
    "at-risk": { color: "bg-amber-500", icon: AlertTriangle, label: "At Risk" },
    "off-track": { color: "bg-red-500", icon: XCircle, label: "Off Track" },
  }

  const { color, icon: StatusIcon } = statusConfig[okr.status]

  const overallProgress = okr.keyResults.length > 0
    ? Math.round(
        okr.keyResults.reduce((acc, kr) => acc + calculateProgress(kr.current, kr.target), 0) / 
        okr.keyResults.length
      )
    : 0

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-[80px]">
            {okr.department.split(' ')[0]}
          </Badge>
          <div className={`w-2 h-2 rounded-full ${color} shrink-0`} title={statusConfig[okr.status].label} />
        </div>
        
        <h4 className="text-xs font-medium line-clamp-2 mb-2 min-h-[32px]" title={okr.goal}>
          {okr.goal}
        </h4>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:!text-white">
            <span>Progress</span>
            <span className={overallProgress >= 80 ? 'text-emerald-500 font-medium' : ''}>{overallProgress}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className={`h-1.5 ${overallProgress >= 80 ? '[&>div]:bg-emerald-500' : ''}`}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground dark:!text-white">
            <Target className="h-3 w-3" />
            <span>{okr.keyResults.length} KR</span>
          </div>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCheckIn} title="Check In">
              <MessageSquarePlus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit} title="Edit">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete} title="Delete">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DepartmentsPage() {
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all")
  const [okrs, setOkrs] = React.useState<OKR[]>([])
  const [isOKRDialogOpen, setIsOKRDialogOpen] = React.useState(false)
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [selectedOKR, setSelectedOKR] = React.useState<OKR | null>(null)
  const [okrToDelete, setOkrToDelete] = React.useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = React.useState("")
  const [expandedOkrId, setExpandedOkrId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingMode, setLoadingMode] = React.useState<"creating" | "updating" | "deleting">("creating")
  const [pendingInitiativeUpdates, setPendingInitiativeUpdates] = React.useState<Set<string>>(new Set())

  const isOKRCompleted = (okr: OKR): boolean => {
    if (okr.keyResults.length === 0) return false
    return okr.keyResults.every(kr => kr.current >= kr.target)
  }

  const filteredOkrs = React.useMemo(() => {
    return okrs.filter(okr => {
      if (selectedStatus === "completed") return isOKRCompleted(okr)
      if (selectedStatus === "in-progress") return !isOKRCompleted(okr)
      return true
    })
  }, [okrs, selectedStatus])

  const expandedOkr = React.useMemo(() => {
    return expandedOkrId ? okrs.find(o => o.id === expandedOkrId) : null
  }, [expandedOkrId, okrs])

  const loadOKRs = React.useCallback(() => {
    if (selectedDepartment === "all") {
      setOkrs(store.getOKRs())
    } else {
      setOkrs(store.getOKRsByDepartment(selectedDepartment as Department))
    }
  }, [selectedDepartment])

  React.useEffect(() => {
    loadOKRs()
    const interval = setInterval(loadOKRs, 5000)
    return () => clearInterval(interval)
  }, [loadOKRs])

  const handleCreateOKR = () => {
    setSelectedOKR(null)
    setIsOKRDialogOpen(true)
  }

  const handleEditOKR = (okr: OKR) => {
    setSelectedOKR(okr)
    setIsOKRDialogOpen(true)
  }

  const handleDeleteClick = (okrId: string) => {
    setOkrToDelete(okrId)
    setDeleteConfirmText("")
    setDeleteConfirmPhrase("")
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    const okrToDeleteObj = okrs.find(o => o.id === okrToDelete)
    if (okrToDelete && okrToDeleteObj && deleteConfirmText === okrToDeleteObj.goal && deleteConfirmPhrase === "delete this okr") {
      setIsDeleteDialogOpen(false)
      setLoadingMode("deleting")
      setIsLoading(true)
      await store.deleteOKR(okrToDelete)
      await new Promise(resolve => setTimeout(resolve, 1000))
      loadOKRs()
      setIsLoading(false)
    }
    setOkrToDelete(null)
    setDeleteConfirmText("")
    setDeleteConfirmPhrase("")
  }

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteConfirmText("")
      setDeleteConfirmPhrase("")
      setOkrToDelete(null)
    }
    setIsDeleteDialogOpen(open)
  }

  const handleCheckIn = (okr: OKR) => {
    setSelectedOKR(okr)
    setIsCheckInDialogOpen(true)
  }

  const handleOKRSubmit = async (okrData: Omit<OKR, "id" | "createdAt" | "updatedAt">) => {
    setLoadingMode(selectedOKR ? "updating" : "creating")
    setIsLoading(true)
    if (selectedOKR) {
      await store.updateOKR(selectedOKR.id, okrData)
    } else {
      await store.createOKR(okrData)
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
    loadOKRs()
    setIsLoading(false)
  }

  const handleCheckInSubmit = async (checkInData: Parameters<typeof store.createCheckIn>[0]) => {
    setIsLoading(true)
    await store.createCheckIn(checkInData)
    
    if (selectedOKR && checkInData.keyResultUpdates) {
      const updatedKeyResults = selectedOKR.keyResults.map(kr => {
        const update = checkInData.keyResultUpdates?.find(u => u.keyResultId === kr.id)
        if (update) {
          return {
            ...kr,
            current: update.newValue,
            progressHistory: [
              ...kr.progressHistory,
              { date: new Date().toISOString().split("T")[0], value: update.newValue }
            ]
          }
        }
        return kr
      })
      await store.updateOKR(selectedOKR.id, { keyResults: updatedKeyResults })
    }
    
    loadOKRs()
    setIsLoading(false)
  }

  const handleInitiativeToggle = async (okrId: string, initiativeId: string, completed: boolean) => {
    const updateKey = `${okrId}-${initiativeId}`
    
    // Prevent duplicate calls
    if (pendingInitiativeUpdates.has(updateKey)) {
      return
    }
    
    setPendingInitiativeUpdates(prev => new Set(prev).add(updateKey))
    
    try {
      const okr = store.getOKRById(okrId)
      if (okr) {
        const updatedInitiatives = okr.initiatives.map(init =>
          init.id === initiativeId ? { ...init, completed } : init
        )
        await store.updateOKR(okrId, { initiatives: updatedInitiatives })
        loadOKRs()
      }
    } finally {
      setPendingInitiativeUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(updateKey)
        return newSet
      })
    }
  }

  const handleAddComment = async (okrId: string, initiativeId: string, comment: Omit<Comment, "id" | "createdAt">) => {
    await store.addComment(okrId, initiativeId, comment)
    loadOKRs()
  }

  const handleMilestoneUpdate = async (okrId: string, keyResultId: string, stageId: string, progress: number) => {
    await store.updateMilestoneStage(okrId, keyResultId, stageId, progress)
    loadOKRs()
  }

  const currentUser = store.getCurrentUser()

  if (isLoading) {
    return <SavingOKRScreen mode={loadingMode} />
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold" data-testid="text-page-title">Departments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage OKRs across departments</p>
        </div>
        <Button onClick={handleCreateOKR} disabled={isLoading} data-testid="button-create-okr" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New OKR
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3 flex-1">
            <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-department">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {filteredOkrs.length} OKR{filteredOkrs.length !== 1 ? "s" : ""} found
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3 flex-1">
            <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OKRs</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredOkrs.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-card rounded-lg border">
          <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No OKRs found</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
            {selectedDepartment === "all" 
              ? "Create your first OKR to get started"
              : `No OKRs in ${selectedDepartment} department`}
          </p>
          <Button onClick={handleCreateOKR} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create OKR
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredOkrs.map(okr => (
              <CompactOKRCard
                key={okr.id}
                okr={okr}
                isSelected={expandedOkrId === okr.id}
                onClick={() => setExpandedOkrId(expandedOkrId === okr.id ? null : okr.id)}
                onEdit={() => handleEditOKR(okr)}
                onDelete={() => handleDeleteClick(okr.id)}
                onCheckIn={() => handleCheckIn(okr)}
              />
            ))}
          </div>

          {expandedOkr && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Expanded View</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setExpandedOkrId(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
              <OKRCard
                okr={expandedOkr}
                onEdit={handleEditOKR}
                onDelete={handleDeleteClick}
                onCheckIn={handleCheckIn}
                onInitiativeToggle={handleInitiativeToggle}
                onAddComment={handleAddComment}
                onMilestoneUpdate={handleMilestoneUpdate}
              />
            </div>
          )}
        </div>
      )}

      <OKRDialog
        open={isOKRDialogOpen}
        onOpenChange={setIsOKRDialogOpen}
        okr={selectedOKR}
        onSubmit={handleOKRSubmit}
      />

      <CheckInDialog
        open={isCheckInDialogOpen}
        onOpenChange={setIsCheckInDialogOpen}
        okr={selectedOKR}
        onSubmit={handleCheckInSubmit}
        userName={currentUser?.name || "Unknown User"}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete OKR</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Are you sure you want to delete this OKR? This action cannot be undone and will permanently remove all associated key results, initiatives, and check-ins.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {okrs.find(o => o.id === okrToDelete) && (
              <>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    To confirm, type <span className="font-bold text-destructive">"{okrs.find(o => o.id === okrToDelete)?.goal}"</span>
                  </span>
                  <Input
                    placeholder={okrs.find(o => o.id === okrToDelete)?.goal || "OKR name"}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-destructive/50 focus-visible:ring-destructive"
                    data-testid="input-delete-confirm-okr-name"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    To confirm, type <span className="font-bold text-destructive">"delete this okr"</span>
                  </span>
                  <Input
                    placeholder="delete this okr"
                    value={deleteConfirmPhrase}
                    onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                    className="border-destructive/50 focus-visible:ring-destructive"
                    data-testid="input-delete-confirm-phrase"
                  />
                </div>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading || deleteConfirmText !== okrs.find(o => o.id === okrToDelete)?.goal || deleteConfirmPhrase !== "delete this okr"}
            >
              Delete OKR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
