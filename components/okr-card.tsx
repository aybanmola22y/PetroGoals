"use client";

import * as React from "react";
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
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  OKR,
  KeyResult,
  Initiative,
  Comment,
  CommentAttachment,
  MilestoneStage,
} from "@/types/okr";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { calculateProgress, formatDate } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OKRCardProps {
  okr: OKR;
  onEdit?: (okr: OKR) => void;
  onDelete?: (okrId: string) => void;
  onCheckIn?: (okr: OKR) => void;
  onInitiativeToggle?: (
    okrId: string,
    initiativeId: string,
    completed: boolean,
  ) => void;
  onAddComment?: (
    okrId: string,
    initiativeId: string,
    comment: Omit<Comment, "id" | "createdAt">,
  ) => void;
  onMilestoneUpdate?: (
    okrId: string,
    keyResultId: string,
    stageId: string,
    progress: number,
  ) => void;
}

const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const FILE_EXTENSIONS: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
}

function StatusIndicator({
  status,
}: {
  status: "on-track" | "at-risk" | "off-track";
}) {
  const config = {
    "on-track": {
      label: "On Track",
      variant: "success" as const,
      icon: CheckCircle,
      color: "bg-emerald-500",
    },
    "at-risk": {
      label: "At Risk",
      variant: "warning" as const,
      icon: AlertTriangle,
      color: "bg-amber-500",
    },
    "off-track": {
      label: "Off Track",
      variant: "danger" as const,
      icon: XCircle,
      color: "bg-red-500",
    },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge
      variant={variant}
      className="gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] shadow-sm ring-1 ring-inset ring-foreground/10"
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// Memoize sub-components for better performance
const MilestoneStageRow = React.memo(
  ({
    stage,
    onProgressChange,
  }: {
    stage: MilestoneStage;
    onProgressChange?: (progress: number) => void;
  }) => {
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
          <span className="text-xs text-muted-foreground w-10 text-right">
            {stage.progress}%
          </span>
        </div>
      </div>
    );
  },
);
MilestoneStageRow.displayName = "MilestoneStageRow";

const KeyResultRow = React.memo(
  ({
    kr,
    onMilestoneUpdate,
  }: {
    kr: KeyResult;
    onMilestoneUpdate?: (stageId: string, progress: number) => void;
  }) => {
    const progress = calculateProgress(kr.current, kr.target);
    const isAlmostComplete = progress >= 80;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {kr.targetType === "milestone" && (
              <Flag className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="text-sm font-medium whitespace-normal break-words">{kr.title}</span>
          </div>
          <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
            {progress}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress
            value={progress}
            className={`flex-1 ${isAlmostComplete ? "[&>div]:bg-emerald-500" : ""}`}
          />
        </div>

        {kr.targetType === "milestone" &&
          kr.milestoneStages &&
          kr.milestoneStages.length > 0 && (
            <div className="mt-3 pl-2 border-l-2 border-muted space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                Milestone Stages
              </span>
              {kr.milestoneStages.map((stage) => (
                <MilestoneStageRow
                  key={stage.id}
                  stage={stage}
                  onProgressChange={(progress) =>
                    onMilestoneUpdate?.(stage.id, progress)
                  }
                />
              ))}
            </div>
          )}

        {kr.targetType !== "milestone" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span>
              Target: {kr.target.toLocaleString()}
              {kr.unit}
            </span>
            <span>
              Current: {kr.current.toLocaleString()}
              {kr.unit}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
          <span>Start: {formatDate(kr.startDate)}</span>
          <span>End: {formatDate(kr.endDate)}</span>
        </div>
      </div>
    );
  },
);
KeyResultRow.displayName = "KeyResultRow";

const InitiativeRow = React.memo(
  ({
    initiative,
    onToggle,
    onAddComment,
    currentUserName,
  }: {
    initiative: Initiative;
    onToggle?: (completed: boolean) => void;
    onAddComment?: (comment: Omit<Comment, "id" | "createdAt">) => void;
    currentUserName?: string;
  }) => {
    const [showComments, setShowComments] = React.useState(false);
    const [newComment, setNewComment] = React.useState("");
    const [attachments, setAttachments] = React.useState<CommentAttachment[]>(
      [],
    );
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: CommentAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          alert(
            `File type not allowed: ${file.name}. Only PNG, JPG, Word, and PDF files are accepted.`,
          );
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`File too large: ${file.name}. Maximum size is 10MB.`);
          continue;
        }
        const url = URL.createObjectURL(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          fileName: file.name,
          fileType: file.type,
          fileUrl: url,
          fileSize: file.size,
        });
      }
      setAttachments([...attachments, ...newAttachments]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const removeAttachment = (id: string) => {
      setAttachments(attachments.filter((a) => a.id !== id));
    };

    const handleSubmitComment = () => {
      if (!newComment.trim() && attachments.length === 0) return;

      onAddComment?.({
        author: currentUserName || "Demo User",
        content: newComment.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setNewComment("");
      setAttachments([]);
    };

    return (
      <div className="py-2 border-b border-border/50 last:border-0">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={initiative.completed}
            onCheckedChange={(checked) => onToggle?.(checked as boolean)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <span
              className={`whitespace-normal break-words ${initiative.completed ? "line-through text-muted-foreground" : ""
                }`}
            >
              {initiative.title}
            </span>
            {initiative.deadline && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Due: {formatDate(initiative.deadline)}
              </div>
            )}
            {initiative.assignee && (
              <div className="flex items-center gap-1 mt-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {initiative.assignee
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {initiative.assignee}
                </span>
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
                          {comment.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {comment.author}
                      </span>
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
                            <span className="truncate max-w-[120px]">
                              {att.fileName}
                            </span>
                            <span className="text-muted-foreground">
                              ({formatFileSize(att.fileSize)})
                            </span>
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
                      <span className="truncate max-w-[100px]">
                        {att.fileName}
                      </span>
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
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, Word, PDF only
                </span>
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
    );
  },
);
InitiativeRow.displayName = "InitiativeRow";

export function OKRCard({
  okr,
  onEdit,
  onDelete,
  onCheckIn,
  onInitiativeToggle,
  onAddComment,
  onMilestoneUpdate,
}: OKRCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showChart, setShowChart] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<string>("Demo User");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user.name || "Demo User");
        } catch { }
      }
    }
  }, []);

  const statusColors = {
    "on-track": "border-l-emerald-500",
    "at-risk": "border-l-amber-500",
    "off-track": "border-l-red-500",
  };

  const overallProgress =
    okr.keyResults.length > 0
      ? Math.round(
        okr.keyResults.reduce(
          (acc, kr) => acc + calculateProgress(kr.current, kr.target),
          0,
        ) / okr.keyResults.length,
      )
      : 0;

  const isAlmostComplete = overallProgress >= 80;

  const chartData =
    okr.keyResults[0]?.progressHistory.map((entry) => ({
      date: formatDate(entry.date),
      value: entry.value,
    })) || [];


  // Add this function at the top of your component file or in a utils file
  const getDepartmentColor = (department: string): string => {
    const colorMap: Record<string, string> = {
      "Core Business Unit (Operations)": "bg-blue-500 text-white border-blue-600",
      "Sales & Marketing": "bg-purple-500 text-white border-purple-600",
      "HR & Admin Department": "bg-pink-500 text-white border-pink-600",
      "Training Division": "bg-orange-500 text-white border-orange-600",
      "Accounting & Finance": "bg-emerald-500 text-white border-emerald-600",
      "Consultancy Division": "bg-cyan-500 text-white border-cyan-600",
      "Review Division": "bg-indigo-500 text-white border-indigo-600",
      "HSSEQ Department": "bg-red-500 text-white border-red-600",
      "Management Team": "bg-amber-500 text-white border-amber-600",
      "Digital Solutions Division": "bg-teal-500 text-white border-teal-600",
      "Information Security Department": "bg-slate-700 text-white border-slate-800",
      "Executive Team": "bg-violet-500 text-white border-violet-600",
    }

    return colorMap[department] || "bg-gray-500 text-white border-gray-600"
  }

  return (
    <Card
      className={`group relative border-none bg-background/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:${statusColors[okr.status]} before:rounded-full`}
      data-testid={`card-okr-${okr.id}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
      <CardHeader className="pb-4 pt-6 sm:pt-8 px-4 sm:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`${getDepartmentColor(okr.department)} backdrop-blur-md font-bold tracking-tight px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border-2 text-[9px] sm:text-xs whitespace-normal break-words text-left max-w-full`}
              >
                {okr.department}
              </Badge>
              <StatusIndicator status={okr.status} />
              {okr.createdBy && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-muted/30 rounded-lg border border-border/40">
                  <User className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-muted-foreground" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    {okr.createdBy}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors break-words">
              {okr.goal}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 p-1 bg-muted/20 backdrop-blur-md rounded-xl sm:rounded-2xl border border-border/40 shadow-inner w-full sm:w-auto justify-around sm:justify-start">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-background hover:text-primary hover:shadow-md transition-all"
              onClick={() => onCheckIn?.(okr)}
              title="Check In"
              data-testid={`button-checkin-${okr.id}`}
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-background hover:text-primary hover:shadow-md transition-all"
              onClick={() => onEdit?.(okr)}
              title="Edit"
              data-testid={`button-edit-${okr.id}`}
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={() => onDelete?.(okr.id)}
              title="Delete"
              data-testid={`button-delete-${okr.id}`}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Execution Health
              </span>
              <p className="text-sm font-bold text-foreground/80">
                Overall Progress
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-3xl font-italic tracking-tighter ${isAlmostComplete ? "text-emerald-500" : "text-primary"}`}
              >
                {overallProgress}
                <span className="text-sm ml-0.5">%</span>
              </span>
            </div>
          </div>
          <Progress
            value={overallProgress}
            className={`h-3 rounded-full bg-muted/30 border border-border/20 shadow-inner overflow-hidden ${isAlmostComplete ? "[&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600" : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"}`}
          />
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 relative z-10">
        <Button
          variant="ghost"
          className="w-full h-12 sm:h-14 justify-between px-4 sm:px-6 bg-muted/10 hover:bg-muted/30 rounded-xl sm:rounded-2xl border border-border/20 transition-all group/expand"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-expand-${okr.id}`}
        >
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-start">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                Milestones
              </span>
              <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 hidden sm:block" />
                {okr.keyResults.length} Key Result{okr.keyResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-6 w-px bg-border/40" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                Execution
              </span>
              <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2">
                <Flag className="h-3 w-3 sm:h-4 sm:w-4 text-primary hidden sm:block" />
                {okr.initiatives.length} Initiative{okr.initiatives.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-background shadow-sm group-hover/expand:scale-110 transition-transform">
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 w-4" />
            )}
          </div>
        </Button>

        {isExpanded && (
          <div className="mt-6 sm:mt-8 space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 bg-emerald-500 rounded-full" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground/80">
                  Key Results
                </h4>
              </div>
              <div className="grid gap-4 sm:gap-6">
                {okr.keyResults.map((kr, index) => (
                  <div
                    key={kr.id}
                    className="relative p-4 sm:p-6 bg-background/40 backdrop-blur-md border border-border/40 rounded-xl sm:rounded-2xl hover:border-primary/30 transition-all group/kr"
                  >
                    <KeyResultRow
                      kr={kr}
                      onMilestoneUpdate={(stageId, progress) =>
                        onMilestoneUpdate?.(okr.id, kr.id, stageId, progress)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 bg-blue-500 rounded-full" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground/80">
                  Initiatives
                </h4>
              </div>
              <div className="bg-background/40 backdrop-blur-md border border-border/40 rounded-xl sm:rounded-2xl divide-y divide-border/20 overflow-hidden">
                {okr.initiatives.map((init) => (
                  <div
                    key={init.id}
                    className="p-3 sm:p-4 hover:bg-muted/20 transition-colors"
                  >
                    <InitiativeRow
                      initiative={init}
                      onToggle={(completed) =>
                        onInitiativeToggle?.(okr.id, init.id, completed)
                      }
                      onAddComment={(comment) =>
                        onAddComment?.(okr.id, init.id, comment)
                      }
                      currentUserName={currentUser}
                    />
                  </div>
                ))}
              </div>
            </div>

            {(chartData.length > 0 ||
              okr.keyResults.some((kr) => kr.targetType === "milestone")) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-1.5 bg-purple-500 rounded-full" />
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground/80">
                        Show Progress Chart
                      </h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest bg-background/50"
                      onClick={() => setShowChart(!showChart)}
                    >
                      {showChart ? "Hide" : "Show"} Progress
                    </Button>
                  </div>

                  {showChart && (
                    <div className="p-6 bg-background/40 backdrop-blur-md border border-border/40 rounded-3xl h-[300px] animate-in zoom-in-95 duration-500">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient
                                id="colorValue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="hsl(var(--border))"
                              opacity={0.3}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fontWeight: 700,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fontWeight: 700,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "none",
                                borderRadius: "1rem",
                                boxShadow:
                                  "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                              }}
                              itemStyle={{
                                fontWeight: 800,
                                color: "hsl(var(--primary))",
                              }}
                              labelStyle={{
                                fontWeight: 800,
                                marginBottom: "0.25rem",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name="Value"
                              stroke="hsl(var(--primary))"
                              strokeWidth={4}
                              fillOpacity={1}
                              fill="url(#colorValue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                          <div className="p-4 rounded-full bg-muted/20">
                            <AreaChart className="h-8 w-8 opacity-20" />
                          </div>
                          <p className="text-xs font-bold uppercase tracking-widest opacity-40">
                            Intelligence Gathering In Progress
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
