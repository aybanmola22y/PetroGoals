//app\dashboard\page.tsx
"use client"

import * as React from "react"
import { 
  Target, 
  Pin,
  TrendingUp, 
  AlertTriangle, 
  XCircle,
  CheckCircle,
  Clock,
  Calendar,
  Building2,
  Shield,
  Users,
  Award,
  Eye,
  Handshake,
  Zap,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { store, COMPANY_INFO } from "@/lib/store"
import { DEPARTMENTS, type Department, type CheckIn, type Notification } from "@/types/okr"
import { formatDateTime } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { StrategicPillarsOverview } from "@/components/strategic-pillars-overview"
import { StrategicPillarProvider } from "@/components/strategic-pillar-context"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, startOfWeek, isAfter, isEqual } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

function useTheme() {
  const [isDark, setIsDark] = React.useState(false)
  
  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  
  return isDark
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    const isStatusChart = ["On Track", "At Risk", "Off Track"].includes(payload[0]?.name)
    
    return (
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`,
        borderRadius: '6px',
        padding: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {payload[0]?.name && (
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#ffffff' : '#000000' }}>
            {payload[0].name}
          </div>
        )}
        <div style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#000000' }}>
          {typeof payload[0]?.value === "number" 
            ? `${payload[0].value}${isStatusChart ? '' : '%'}` 
            : payload[0]?.value}
        </div>
      </div>
    )
  }
  return null
}

function StatusBadge({ status }: { status: "on-track" | "at-risk" | "off-track" }) {
  const config = {
    "on-track": { label: "On Track", variant: "success" as const, icon: CheckCircle },
    "at-risk": { label: "At Risk", variant: "warning" as const, icon: AlertTriangle },
    "off-track": { label: "Off Track", variant: "danger" as const, icon: XCircle },
  }
  
  const { label, variant, icon: Icon } = config[status]
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

function CheckInItem({ checkIn }: { checkIn: CheckIn }) {
  const initials = checkIn.userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()


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
    <div className="group py-6 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all duration-200 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex gap-4">
        {/* Simple, Professional Avatar */}
        <Avatar className="h-10 w-10 shrink-0 rounded-full border border-slate-200 dark:border-slate-700">
          <AvatarFallback className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Clean Content Layout */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[14px] text-slate-900 dark:text-slate-100">
                {checkIn.userName}
              </span>
             <Badge
                variant="secondary"
                className={`${getDepartmentColor(checkIn.department)} text-[10px] px-2 py-0 h-auto font-semibold uppercase tracking-wider border-2 rounded inline-flex whitespace-normal break-words max-w-[150px] text-left`}
              >
                {checkIn.department}
              </Badge>
            </div>
            <time className="text-[10px] text-slate-400 font-medium">
              {formatDateTime(checkIn.createdAt)}
            </time>
          </div>

          {/* Activity Section */}
          <div className="mt-1.5 space-y-1.5">
            <div className="flex items-start gap-2">
              <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200 leading-snug">
                {checkIn.okrGoal}
              </p>
            </div>
            {checkIn.message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal pl-0">
                {checkIn.message}
              </p>
            )}
          </div>

          {/* Refined Progress Update */}
          {checkIn.keyResultUpdates && checkIn.keyResultUpdates.length > 0 && (
            <div className="mt-4 space-y-3">
              {checkIn.keyResultUpdates.map((update, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 break-words leading-tight uppercase tracking-tight">
                        {update.keyResultTitle}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(100, Math.max(0, update.newValue))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        {update.milestoneUpdates && update.milestoneUpdates.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {update.milestoneUpdates.map((ms, msIdx) => (
                              <div key={msIdx} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{ms.stageName}:</span>
                                <span className="text-[10px] font-bold text-slate-400">{ms.previousProgress}%</span>
                                <ChevronRight className="h-2 w-2 text-slate-300" />
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{ms.newProgress}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-[10px] font-medium text-slate-400">{update.previousValue}%</span>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{update.newValue}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function generateMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i)
    options.push({
      value: `${date.getFullYear()}-${date.getMonth()}`,
      label: format(date, "MMMM yyyy"),
      year: date.getFullYear(),
      month: date.getMonth()
    })
  }
  return options
}
// Part 2: Main component setup with collapsible sidebar state

export default function OverviewPage() {
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all")
  const [selectedMonth, setSelectedMonth] = React.useState<string>("all")
  const [checkInFilter, setCheckInFilter] = React.useState<string>("all")
  const [stats, setStats] = React.useState(store.getStats())
  const [checkIns, setCheckIns] = React.useState(store.getCheckIns())
  const [okrs, setOkrs] = React.useState(store.getOKRs())
  const [isLoading, setIsLoading] = React.useState(true)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date())
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const isDark = useTheme()
  const textColor = isDark ? '#ffffff' : '#000000'
  const router = useRouter()

  const monthOptions = React.useMemo(() => generateMonthOptions(), [])
  
  // Only update last update time when data is first loaded or specifically refreshed
  const updateTimestamp = () => {
    const now = new Date();
    setLastUpdateTime(now);
    // Persist to localStorage so it stays across reloads unless updated again
    if (typeof window !== 'undefined') {
      localStorage.setItem('petro_goals_last_update', now.toISOString());
    }
  };

  const displayLastUpdateTime = React.useMemo(() => {
    if (checkIns.length > 0) {
      return new Date(checkIns[0].createdAt)
    }
    return lastUpdateTime
  }, [checkIns, lastUpdateTime])

  // Initial load effect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('petro_goals_last_update');
      if (saved) {
        setLastUpdateTime(new Date(saved));
      }
    }
  }, []);

  const filteredCheckIns = React.useMemo(() => {
    if (checkInFilter === "all") return checkIns
    
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    
    return checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.createdAt)
      switch (checkInFilter) {
        case "today":
          return isAfter(checkInDate, todayStart) || isEqual(checkInDate, todayStart)
        case "week":
          return isAfter(checkInDate, weekStart) || isEqual(checkInDate, weekStart)
        case "month":
          return isAfter(checkInDate, monthStart) || isEqual(checkInDate, monthStart)
        default:
          return true
      }
    })
  }, [checkIns, checkInFilter])

  React.useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await store.initialize()
      setStats(store.getStats(undefined, selectedDepartment))
      setCheckIns(store.getCheckIns())
      setOkrs(store.getOKRs())
      setNotifications(store.getNotifications())
      await store.checkAllDeadlines()
      setNotifications(store.getNotifications())
      // Only set initial timestamp if none exists
      if (typeof window !== 'undefined' && !localStorage.getItem('petro_goals_last_update')) {
        updateTimestamp()
      }
      setIsLoading(false)
    }
    init()
  }, [selectedMonth, selectedDepartment])

  // Optimize background refresh to be more conservative
React.useEffect(() => {
  const refreshOKRsAfterCheckIn = setInterval(() => {
    const currentOKRs = store.getOKRs()
    // Only update if length changed (new OKR added/deleted)
    if (currentOKRs.length !== okrs.length) {
      setOkrs(currentOKRs)
      setCheckIns(store.getCheckIns())
      setStats(store.getStats(undefined, selectedDepartment))
    }
  }, 15000) // Increased to 15 seconds
  return () => clearInterval(refreshOKRsAfterCheckIn)
}, [selectedDepartment, okrs.length]) // Changed dependency

  const handleMarkAsRead = async (id: string) => {
    await store.markNotificationAsRead(id)
    setNotifications(store.getNotifications())
  }

  const handleMarkAllAsRead = async () => {
    await store.markAllNotificationsAsRead()
    setNotifications(store.getNotifications())
  }

  const handleClearAll = async () => {
    await store.clearAllNotifications()
    setNotifications([])
  }

  React.useEffect(() => {
    let filterMonth = undefined
    if (selectedMonth !== "all") {
      const [year, month] = selectedMonth.split("-").map(Number)
      filterMonth = { year, month }
    }
    setStats(store.getStats(filterMonth, selectedDepartment))
  }, [selectedMonth, selectedDepartment])

  const filteredOKRs = selectedDepartment === "all" 
    ? okrs 
    : okrs.filter(o => o.department === selectedDepartment)

  const departmentChartData = Object.entries(stats.departmentProgress)
    .map(([name, progress]) => ({ 
      name, 
      progress,
      updatedAt: format(lastUpdateTime, "MMM dd, yyyy HH:mm")
    }))
    .filter(d => d.progress > 0)

  const statusData = [
    { name: "On Track", value: stats.onTrack, color: "#10b981" },
    { name: "At Risk", value: stats.atRisk, color: "#f59e0b" },
    { name: "Off Track", value: stats.offTrack, color: "#ef4444" },
  ]

  // No loading screen - immediately render what we have
  if (isLoading && okrs.length === 0) {
    return null
  }

  return (
    <StrategicPillarProvider>
      <div className="p-4 sm:p-6">
        <div className="flex gap-4 sm:gap-6">
        {/* Main Content Column */}
        <div className={`flex-1 space-y-4 sm:space-y-6 transition-all duration-300 ${isSidebarCollapsed ? 'mr-0' : ''}`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold" data-testid="text-page-title">Overview</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Company-wide Goals & OKRs Performance Dashboard</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last updated: {format(displayLastUpdateTime, "MMMM dd, yyyy 'at' HH:mm:ss")}
                </p>
              </div>
              <NotificationBell 
                notifications={notifications}
                okrs={okrs}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onClearAll={handleClearAll}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-month-filter">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-department-filter">
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
          </div>

          {/* Mission, Vision & Values Card */}
<div className="relative bg-background rounded-3xl shadow-xl overflow-hidden border-2 border-primary/20">
  {/* Gradient background overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>

  {/* Content */}
  <div className="relative z-10 p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-6">
      <Pin className="h-6 w-6 text-primary animate-pulse" />
      <h2 className="text-xl sm:text-2xl font-bold">Mission, Vision & Values</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {/* Mission Card */}
      <div className="group relative bg-gradient-to-br from-blue-50 to-background dark:from-blue-950/30 dark:to-background rounded-2xl p-4 sm:p-6 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            
          </div>
          
          <div className="mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold">Mission</h3>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {COMPANY_INFO.mission}
          </p>
        </div>
      </div>

      {/* Vision Card */}
      <div className="group relative bg-gradient-to-br from-yellow-50 to-background dark:from-yellow-950/30 dark:to-background rounded-2xl p-4 sm:p-6 border-2 border-yellow-200/50 dark:border-yellow-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            
          </div>
          
          <div className="mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <Pin className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold">Vision</h3>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {COMPANY_INFO.vision}
          </p>
        </div>
      </div>

      {/* Values Card */}
      <div className="group relative bg-gradient-to-br from-pink-50 to-background dark:from-pink-950/30 dark:to-background rounded-2xl p-4 sm:p-6 border-2 border-pink-200/50 dark:border-pink-800/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            
          </div>
          
          <div className="mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold">Values</h3>
          </div>
          
          <ul className="space-y-2">
            {COMPANY_INFO.values?.map((value, index) => (
              <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-pink-500 font-bold mt-0.5">•</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

          <StrategicPillarsOverview okrs={filteredOKRs} />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Total OKRs</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold text-primary" data-testid="text-total-okrs">{stats.total}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3 hidden sm:block" />
                  <span className="truncate">{stats.uniqueDepartments} departments</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Overall Progress</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold" data-testid="text-overall-progress">{stats.overallProgress}%</div>
                <Progress 
                  value={stats.overallProgress} 
                  className={`mt-2 ${stats.overallProgress >= 80 ? '[&>div]:bg-emerald-500' : ''}`}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">On Track</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-500" data-testid="text-on-track">{stats.onTrack}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">on target</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">At Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold text-amber-500" data-testid="text-at-risk">{stats.atRisk}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">need attention</p>
              </CardContent>
            </Card>
            
            <Card className="col-span-2 sm:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Off Track</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-2xl sm:text-3xl font-bold text-red-500" data-testid="text-off-track">{stats.offTrack}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">behind schedule</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Department Progress</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  OKR completion rate by department
                  <span className="block text-xs mt-1">
                    Updated: {format(lastUpdateTime, "MMM dd, yyyy HH:mm")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  {departmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentChartData} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0, 0, 0, 0.1)" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                          {departmentChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.progress >= 80 ? "#10b981" : "hsl(var(--primary))"} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available. Add OKRs to see department progress.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">OKR Status Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Current status of all objectives
                  <span className="block text-xs mt-1">
                    As of: {format(lastUpdateTime, "MMM dd, yyyy HH:mm")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] sm:h-[300px]">
                  {stats.total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No OKRs found. Create your first OKR to see status distribution.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OKR Progress Trends */}
          {filteredOKRs.length > 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  OKR Progress Trends
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Individual progress tracking for each OKR
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredOKRs.map((okr) => {
                    const getOverallProgressHistory = () => {
                      if (okr.keyResults.length === 0) return []
                      
                      const allProgressEntries: { [date: string]: number[] } = {}
                      
                      for (const kr of okr.keyResults) {
                        if (kr.progressHistory && kr.progressHistory.length > 0) {
                          for (const entry of kr.progressHistory) {
                            const dateStr = entry.date
                            const percentage = (entry.value / kr.target) * 100
                            
                            if (!allProgressEntries[dateStr]) {
                              allProgressEntries[dateStr] = []
                            }
                            allProgressEntries[dateStr].push(percentage)
                          }
                        }
                      }
                      
                      if (Object.keys(allProgressEntries).length === 0) {
                        const today = format(new Date(), "MMM dd, yyyy")
                        const currentProgress = Math.round(
                          okr.keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / okr.keyResults.length
                        )
                        return [{ date: today, value: Math.min(currentProgress, 100) }]
                      }
                      
                      const progressArray = Object.entries(allProgressEntries)
                        .map(([date, values]) => ({
                          date,
                          value: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
                        }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      
                      return progressArray
                    }
                    
                    const progressData = getOverallProgressHistory()
                    
                    return (
                      <div key={okr.id} className="bg-background/60 rounded-lg p-3 sm:p-4 border border-primary/10">
                        <div className="mb-4 sm:mb-5 space-y-1.5 sm:space-y-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-primary line-clamp-2">{okr.goal}</h4>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{okr.department}</p>
                          <div className="pt-1 sm:pt-1.5">
                            <StatusBadge status={okr.status} />
                          </div>
                        </div>
                        <div className="h-[200px] sm:h-[240px]">
                          {progressData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart 
                                data={progressData}
                                margin={{ top: 12, right: 16, left: 0, bottom: 24 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.1)" />
                                <XAxis 
                                  dataKey="date" 
                                  tick={{ fontSize: 11, fontStyle: "normal" }}
                                  tickFormatter={(value) => {
                                    const date = new Date(value)
                                    return format(date, "MMM dd")
                                  }}
                                  angle={-15}
                                  textAnchor="end"
                                  height={60}
                                />
                                <YAxis 
                                  domain={[0, 100]} 
                                  ticks={[0, 25, 50, 75, 100]}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{ fontSize: 11 }}
                                  width={35}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2}
                                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                              No progress history
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Collapsible Right Sidebar - Check-ins */}
        <div className={`hidden lg:block transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-[380px]'}`}>
          <div className="sticky top-6">
            {isSidebarCollapsed ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarCollapsed(false)}
                className="h-full w-12 rounded-lg shadow-lg"
                title="Expand check-ins"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Card className="overflow-hidden border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/30 border-b px-4 py-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold tracking-tight">Latest Check-ins</CardTitle>
                        <CardDescription className="text-xs mt-1">Activity from all departments</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed(true)}
                        className="h-8 w-8 -mr-2"
                        title="Collapse check-ins"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select value={checkInFilter} onValueChange={setCheckInFilter}>
                      <SelectTrigger className="w-full h-9 text-sm" data-testid="select-checkin-filter">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Check-ins</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
                    <div className="px-4 py-2">
                      {filteredCheckIns.slice(0, 10).map((checkIn) => (
                        <CheckInItem key={checkIn.id} checkIn={checkIn} />
                      ))}
                      {filteredCheckIns.length === 0 && (
                        <div className="py-16 text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
                            <Target className="h-6 w-6 text-muted-foreground/60" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">No check-ins found</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Adjust your filter or check back later</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </StrategicPillarProvider>
  )
}
