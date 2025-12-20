export type OKRStatus = "on-track" | "at-risk" | "off-track"

export type TargetType = "quantitative" | "milestone" | "milestone-custom"

export type Department =
  | "Operations"
  | "Sales & Marketing"
  | "HR"
  | "Finance"
  | "Accounting"
  | "Consultant"
  | "Review"
  | "HSSEQ"
  | "HSSE"
  | "Digital Solutions"
  | "Information Security"
  | "Admin"

export const DEPARTMENTS: Department[] = [
  "Operations",
  "Sales & Marketing",
  "HR",
  "Finance",
  "Accounting",
  "Consultant",
  "Review",
  "HSSEQ",
  "HSSE",
  "Digital Solutions",
  "Information Security",
  "Admin",
]

export interface MilestoneStage {
  id: string
  name: string
  weight: number
  progress: number
}

export const DEFAULT_MILESTONE_STAGES: Omit<MilestoneStage, "id">[] = [
  { name: "Requirements Gathering", weight: 20, progress: 0 },
  { name: "Design", weight: 20, progress: 0 },
  { name: "Develop", weight: 20, progress: 0 },
  { name: "Testing", weight: 20, progress: 0 },
  { name: "Deployment", weight: 20, progress: 0 },
]

export interface Initiative {
  id: string
  title: string
  completed: boolean
  assignee?: string
  comments: Comment[]
}

export interface CommentAttachment {
  id: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize: number
}

export interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
  attachments?: CommentAttachment[]
}

export interface KeyResult {
  id: string
  title: string
  startDate: string
  endDate: string
  target: number
  current: number
  unit: string
  targetType: TargetType
  milestoneStages?: MilestoneStage[]
  progressHistory: ProgressEntry[]
}

export interface ProgressEntry {
  date: string
  value: number
}

export interface OKR {
  id: string
  department: Department
  goal: string
  status: OKRStatus
  keyResults: KeyResult[]
  initiatives: Initiative[]
  createdAt: string
  updatedAt: string
}

export interface CheckIn {
  id: string
  okrId: string
  okrGoal: string
  userId: string
  userName: string
  department: Department
  message: string
  keyResultUpdates?: {
    keyResultId: string
    keyResultTitle: string
    previousValue: number
    newValue: number
  }[]
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  password?: string
  profilePicture?: string
}

export interface CompanyInfo {
  mission: string
  vision: string
  strategicPlan: string[]
  values?: string[]
}

export interface Notification {
  id: string
  userId: string
  type: "deadline_reminder" | "okr_update" | "checkin_reminder"
  title: string
  message: string
  okrId?: string
  keyResultId?: string
  read: boolean
  createdAt: string
  deadline?: string
  department?: Department | "Other"
}
