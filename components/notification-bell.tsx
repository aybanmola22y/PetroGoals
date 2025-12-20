"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Bell, X, Clock, AlertTriangle, CheckCircle, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Notification, OKR, Department } from "@/types/okr"
import { formatDateTime } from "@/lib/utils"

interface NotificationBellProps {
  notifications: Notification[]
  okrs: OKR[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
}

interface GroupedNotification extends Notification {
  department: Department | "Other"
  isCompleted: boolean
}

export function NotificationBell({ 
  notifications, 
  okrs,
  onMarkAsRead, 
  onMarkAllAsRead,
  onClearAll
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const unreadCount = notifications.filter(n => !n.read).length

  // Close notification panel when pathname changes
  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const getOKRDepartment = (okrId?: string): Department | "Other" => {
    if (!okrId) return "Other"
    const okr = okrs.find(o => o.id === okrId)
    return okr?.department || "Other"
  }

  const isOKRCompleted = (okrId?: string): boolean => {
    if (!okrId) return false
    const okr = okrs.find(o => o.id === okrId)
    if (!okr || okr.keyResults.length === 0) return false
    return okr.keyResults.every(kr => kr.current >= kr.target)
  }

  const groupedByDepartment = React.useMemo(() => {
    // Filter out notifications for deleted OKRs first
    const validNotifications = notifications.filter(n => {
      if (!n.okrId) return true
      return okrs.some(o => o.id === n.okrId)
    })

    const enrichedNotifications: GroupedNotification[] = validNotifications.map(n => ({
      ...n,
      department: n.department || getOKRDepartment(n.okrId),
      isCompleted: isOKRCompleted(n.okrId)
    }))

    const groups: Record<string, GroupedNotification[]> = {}
    enrichedNotifications.forEach(n => {
      if (!groups[n.department]) {
        groups[n.department] = []
      }
      groups[n.department].push(n)
    })

    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Other") return 1
      if (b === "Other") return -1
      return a.localeCompare(b)
    })
  }, [notifications, okrs])

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "deadline_reminder":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "okr_update":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "checkin_reminder":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] sm:w-full p-0 flex flex-col">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-lg">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-1 sm:gap-2 flex-wrap justify-end">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={onMarkAllAsRead}>
                    Mark all read
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9" onClick={onClearAll}>
                    Clear all
                  </Button>
                </div>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1">
              Stay updated with your OKR deadlines and updates
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {groupedByDepartment.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <>
                  {groupedByDepartment.map(([department, deptNotifications]) => {
                    const pendingCount = deptNotifications.filter(n => !n.isCompleted).length
                    const unreadDeptCount = deptNotifications.filter(n => !n.read).length
                    
                    return (
                    <div key={department} className="space-y-2">
                      <div className="flex items-center gap-2 py-2 px-0 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-xs sm:text-sm truncate">{department}</span>
                        <div className="flex gap-1 ml-auto flex-shrink-0">
                          {unreadDeptCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5">
                              {unreadDeptCount} new
                            </Badge>
                          )}
                          {pendingCount > 0 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs text-amber-600 border-amber-300 px-1.5 sm:px-2 py-0 h-5">
                              {pendingCount} pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {deptNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2 sm:p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                            notification.isCompleted ? "opacity-50" : ""
                          } ${
                            notification.read 
                              ? "bg-muted/30" 
                              : "bg-primary/5 border-primary/20"
                          }`}
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <p className={`text-xs sm:text-sm font-medium leading-tight ${notification.read ? "text-muted-foreground" : ""}`}>
                                  {notification.title}
                                </p>
                                {notification.isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                    <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span className="hidden sm:inline">Completed</span>
                                    <span className="sm:hidden">Done</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span className="hidden sm:inline">Pending</span>
                                    <span className="sm:hidden">Pending</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                                {notification.message}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                                {notification.deadline 
                                  ? `Deadline: ${formatDateTime(notification.deadline)}`
                                  : formatDateTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
