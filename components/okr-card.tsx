"use client"

import * as React from "react"
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Edit,
  Trash2,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
  User,
  MessageCircle,
  Paperclip,
  Send,
  FileText,
  Image,
  X,
  Flag
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { OKR, KeyResult, Initiative, Comment, CommentAttachment, MilestoneStage } from "@/types/okr"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { calculateProgress, formatDate } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface OKRCardProps {
  okr: OKR
  onEdit?: (okr: OKR) => void
  onDelete?: (okrId: string) => void
  onCheckIn?: (okr: OKR) => void
  onInitiativeToggle?: (okrId: string, initiativeId: string, completed: boolean) => void
  onAddComment?: (okrId: string, initiativeId: string, comment: Omit<Comment, "id" | "createdAt">) => void
  onMilestoneUpdate?: (okrId: string, keyResultId: string, stageId: string, progress: number) => void
}

const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const FILE_EXTENSIONS: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <Image className="h-4 w-4" />
  }
  return <FileText className="h-4 w-4" />
}

function StatusIndicator({ status }: { status: "on-track" | "at-risk" | "off-track" }) {
  const config = {
    "on-track": { label: "On Track", variant: "success" as const, icon: CheckCircle, color: "bg-emerald-500" },
    "at-risk": { label: "At Risk", variant: "warning" as const, icon: AlertTriangle, color: "bg-amber-500" },
    "off-track": { label: "Off Track", variant: "danger" as const, icon: XCircle, color: "bg-red-500" },
  }
  
  const { label, variant, icon: Icon } = config[status]
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

function MilestoneStageRow({ 
  stage, 
  onProgressChange 
}: { 
  stage: MilestoneStage
  onProgressChange?: (progress: number) => void
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-sm flex-1 min-w-0 truncate">{stage.name}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-24">
          <Slider
            value={[stage.progress]}
            onValueChange={(value) => onProgressChange?.(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <span className="text-xs text-muted-foreground w-10 text-right">{stage.progress}%</span>
      </div>
    </div>
  )
}

function KeyResultRow({ 
  kr, 
  onMilestoneUpdate 
}: { 
  kr: KeyResult
  onMilestoneUpdate?: (stageId: string, progress: number) => void
}) {
  const progress = calculateProgress(kr.current, kr.target)
  const isAlmostComplete = progress >= 80
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {kr.targetType === "milestone" && <Flag className="h-4 w-4 text-primary shrink-0" />}
          <span className="text-sm font-medium truncate">{kr.title}</span>
        </div>
        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
          {progress}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress 
          value={progress} 
          className={`flex-1 ${isAlmostComplete ? '[&>div]:bg-emerald-500' : ''}`}
        />
      </div>
      
      {kr.targetType === "milestone" && kr.milestoneStages && kr.milestoneStages.length > 0 && (
        <div className="mt-3 pl-2 border-l-2 border-muted space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Milestone Stages</span>
          {kr.milestoneStages.map((stage) => (
            <MilestoneStageRow 
              key={stage.id} 
              stage={stage}
              onProgressChange={(progress) => onMilestoneUpdate?.(stage.id, progress)}
            />
          ))}
        </div>
      )}
      
      {kr.targetType !== "milestone" && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Target: {kr.target.toLocaleString()} {kr.unit}</span>
          <span>Current: {kr.current.toLocaleString()} {kr.unit}</span>
        </div>
      )}
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Start: {formatDate(kr.startDate)}</span>
        <span>End: {formatDate(kr.endDate)}</span>
      </div>
    </div>
  )
}

function InitiativeRow({ 
  initiative, 
  onToggle,
  onAddComment,
  currentUserName
}: { 
  initiative: Initiative
  onToggle?: (completed: boolean) => void
  onAddComment?: (comment: Omit<Comment, "id" | "createdAt">) => void
  currentUserName?: string
}) {
  const [showComments, setShowComments] = React.useState(false)
  const [newComment, setNewComment] = React.useState("")
  const [attachments, setAttachments] = React.useState<CommentAttachment[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: CommentAttachment[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`File type not allowed: ${file.name}. Only PNG, JPG, Word, and PDF files are accepted.`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`)
        continue
      }
      const url = URL.createObjectURL(file)
      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        fileName: file.name,
        fileType: file.type,
        fileUrl: url,
        fileSize: file.size
      })
    }
    setAttachments([...attachments, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  const handleSubmitComment = () => {
    if (!newComment.trim() && attachments.length === 0) return
    
    onAddComment?.({
      author: currentUserName || "Demo User",
      content: newComment.trim(),
      attachments: attachments.length > 0 ? attachments : undefined
    })
    
    setNewComment("")
    setAttachments([])
  }

  return (
    <div className="py-2 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={initiative.completed} 
          onCheckedChange={(checked) => onToggle?.(checked as boolean)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <span className={initiative.completed ? "line-through text-muted-foreground" : ""}>
            {initiative.title}
          </span>
          {initiative.assignee && (
            <div className="flex items-center gap-1 mt-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-muted">
                  {initiative.assignee.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{initiative.assignee}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 px-2"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">{initiative.comments?.length || 0}</span>
        </Button>
      </div>

      {showComments && (
        <div className="ml-7 mt-3 space-y-3">
          {initiative.comments && initiative.comments.length > 0 && (
            <div className="space-y-2">
              {initiative.comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {comment.author.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {comment.content && (
                    <p className="text-sm ml-7">{comment.content}</p>
                  )}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="ml-7 mt-2 flex flex-wrap gap-2">
                      {comment.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border text-xs hover:bg-muted transition-colors"
                        >
                          {getFileIcon(att.fileType)}
                          <span className="truncate max-w-[120px]">{att.fileName}</span>
                          <span className="text-muted-foreground">({formatFileSize(att.fileSize)})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-xs"
                  >
                    {getFileIcon(att.fileType)}
                    <span className="truncate max-w-[100px]">{att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                Attach
              </Button>
              <span className="text-xs text-muted-foreground">PNG, JPG, Word, PDF only</span>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() && attachments.length === 0}
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function OKRCard({ okr, onEdit, onDelete, onCheckIn, onInitiativeToggle, onAddComment, onMilestoneUpdate }: OKRCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showChart, setShowChart] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<string>("Demo User")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setCurrentUser(user.name || "Demo User")
        } catch {}
      }
    }
  }, [])

  const statusColors = {
    "on-track": "border-l-emerald-500",
    "at-risk": "border-l-amber-500",
    "off-track": "border-l-red-500",
  }

  const overallProgress = okr.keyResults.length > 0
    ? Math.round(
        okr.keyResults.reduce((acc, kr) => acc + calculateProgress(kr.current, kr.target), 0) / 
        okr.keyResults.length
      )
    : 0

  const isAlmostComplete = overallProgress >= 80

  const chartData = okr.keyResults[0]?.progressHistory.map(entry => ({
    date: formatDate(entry.date),
    value: entry.value,
  })) || []

  return (
    <Card className={`border-l-4 ${statusColors[okr.status]}`} data-testid={`card-okr-${okr.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline">{okr.department}</Badge>
              <StatusIndicator status={okr.status} />
            </div>
            <h3 className="text-lg font-medium leading-tight">{okr.goal}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCheckIn?.(okr)}
              title="Check In"
              data-testid={`button-checkin-${okr.id}`}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(okr)}
              title="Edit"
              data-testid={`button-edit-${okr.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(okr.id)}
              title="Delete"
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-${okr.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground dark:!text-white">Overall Progress</span>
            <span className={`text-sm font-medium ${isAlmostComplete ? 'text-emerald-500' : ''}`}>{overallProgress}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className={`${isAlmostComplete ? '[&>div]:bg-emerald-500' : ''}`}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-expand-${okr.id}`}
        >
          <span className="text-sm">
            {okr.keyResults.length} Key Results • {okr.initiatives.length} Initiatives
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Key Results</h4>
              <div className="space-y-4">
                {okr.keyResults.map((kr) => (
                  <KeyResultRow 
                    key={kr.id} 
                    kr={kr}
                    onMilestoneUpdate={(stageId, progress) => onMilestoneUpdate?.(okr.id, kr.id, stageId, progress)}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">Initiatives</h4>
              <div>
                {okr.initiatives.map((init) => (
                  <InitiativeRow 
                    key={init.id} 
                    initiative={init}
                    onToggle={(completed) => onInitiativeToggle?.(okr.id, init.id, completed)}
                    onAddComment={(comment) => onAddComment?.(okr.id, init.id, comment)}
                    currentUserName={currentUser}
                  />
                ))}
              </div>
            </div>

            {(chartData.length > 0 || okr.keyResults.some(kr => kr.targetType === "milestone")) && (
              <>
                <Separator />
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2"
                    onClick={() => setShowChart(!showChart)}
                  >
                    {showChart ? "Hide" : "Show"} Daily Progress Chart
                  </Button>
                  
                  {showChart && (
                    <div className="h-[200px] mt-2">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--popover))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "0.5rem"
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorValue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          No progress history available yet. Progress will be tracked as you update milestones.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
