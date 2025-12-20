"use client"

import * as React from "react"
import { 
  Target, 
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
  Handshake,
  Zap,
  Briefcase
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
    // Check if this is a status distribution chart (shows count, not percentage)
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
    .map(n => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="group relative py-3 sm:py-5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors duration-150 -mx-1 sm:-mx-2 px-1 sm:px-2 rounded-lg">
      <div className="flex gap-2 sm:gap-4">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 border-2 border-primary/20">
          <AvatarFallback className="text-[10px] sm:text-xs font-semibold bg-primary/5 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-xs sm:text-sm text-foreground">{checkIn.userName}</span>
              <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0 h-4 sm:h-5 font-medium">
                {checkIn.department}
              </Badge>
            </div>
            <time className="text-[10px] sm:text-xs text-muted-foreground">
              {formatDateTime(checkIn.createdAt)}
            </time>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium text-foreground/90 leading-snug line-clamp-2 sm:line-clamp-none">
              {checkIn.okrGoal}
            </p>
            {checkIn.message && (
              <blockquote className="text-xs sm:text-sm text-muted-foreground pl-2 sm:pl-3 border-l-2 border-muted-foreground/20 italic line-clamp-2 sm:line-clamp-none">
                {checkIn.message}
              </blockquote>
            )}
          </div>
          
          {checkIn.keyResultUpdates && checkIn.keyResultUpdates.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
              {checkIn.keyResultUpdates.map((update, idx) => (
                <div 
                  key={idx} 
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="font-semibold truncate max-w-[60px] sm:max-w-none">{update.keyResultTitle}:</span>
                  <span>{update.previousValue}</span>
                  <span className="text-emerald-500">→</span>
                  <span className="font-semibold">{update.newValue}</span>
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
  const isDark = useTheme()
  const textColor = isDark ? '#ffffff' : '#000000'
  
  const monthOptions = React.useMemo(() => generateMonthOptions(), [])
  
  // Update timestamp only when actual data changes
  React.useEffect(() => {
    setLastUpdateTime(new Date())
  }, [stats, checkIns, okrs, notifications])

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
      setIsLoading(false)
    }
    init()
  }, [selectedMonth, selectedDepartment])

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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold" data-testid="text-page-title">Overview</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Company-wide Goals & OKRs Performance Dashboard</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last updated: {format(lastUpdateTime, "MMMM dd, yyyy 'at' HH:mm:ss")}
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

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="text-lg sm:text-xl">📌</span> Mission, Vision & Values
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-background/60 rounded-lg p-3 sm:p-4 border border-primary/10">
              <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <span>📌</span> Mission
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">{COMPANY_INFO.mission}</p>
            </div>
            <div className="bg-background/60 rounded-lg p-3 sm:p-4 border border-primary/10">
              <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <span>📌</span> Vision
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">{COMPANY_INFO.vision}</p>
            </div>
            <div className="bg-background/60 rounded-lg p-3 sm:p-4 border border-primary/10">
              <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" /> Values
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 mt-2">
                {COMPANY_INFO.values?.map((value, index) => (
                  <li key={index} className="text-xs sm:text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <span className="text-lg sm:text-xl">🎯</span> Strategic Pillars
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {COMPANY_INFO.strategicPlan.map((pillar, index) => (
              <div key={index} className="bg-background/60 rounded-lg p-3 sm:p-4 border border-primary/10">
                <h4 className="text-xs sm:text-sm font-semibold text-primary">{pillar}</h4>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                // Calculate overall OKR progress by averaging all key results
                const getOverallProgressHistory = () => {
                  if (okr.keyResults.length === 0) return []
                  
                  // Collect all progress history entries from all key results
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
                  
                  // If no history exists, return current progress for today
                  if (Object.keys(allProgressEntries).length === 0) {
                    const today = format(new Date(), "MMM dd, yyyy")
                    const currentProgress = Math.round(
                      okr.keyResults.reduce((acc, kr) => acc + (kr.current / kr.target) * 100, 0) / okr.keyResults.length
                    )
                    return [{ date: today, value: Math.min(currentProgress, 100) }]
                  }
                  
                  // Convert to array, average by date, and sort
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

      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/30 border-b px-4 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight">Latest Check-ins</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">Activity feed from across all departments</CardDescription>
            </div>
            <Select value={checkInFilter} onValueChange={setCheckInFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm" data-testid="select-checkin-filter">
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
        <CardContent className="pt-4 px-3 sm:px-6">
          <ScrollArea className="h-[350px] sm:h-[400px] pr-2 sm:pr-4">
            <div className="space-y-2">
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
    </div>
  )
}
