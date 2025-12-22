"use client"

import { OKR, CheckIn, User, CompanyInfo, Department, DEPARTMENTS, Comment, Notification, KeyResult, MilestoneStage, OKRStatus } from "@/types/okr"
import { supabase, isConnected } from "./supabase"

export const COMPANY_INFO: CompanyInfo = {
  mission: "To provide quality training, review, and consultancy services to clients seeking growth and development.",
  vision: "To be the leading institution providing one-stop-shop services on becoming better, safer and healthier nation.",
  strategicPlan: [
    "Safety First",
    "Integrity & Transparency",
    "Innovation & Excellence",
    "Sustainability",
    "Teamwork & Collaboration",
  ],
  values: [
    "Leadership in Health, Safety, and Environment",
    "Care for Clients and Stakeholders",
    "Committed to Quality and Excellence",
    "Respect for Diversity and Equality",
    "Passion for Service"
  ]
}

const DEMO_USER: User = {
  id: "demo-user-1",
  email: "demo@petro-okr.com",
  name: "Demo User",
  password: "demo123",
  profilePicture: undefined
}

class Store {
  private okrs: OKR[] = []
  private checkIns: CheckIn[] = []
  private notifications: Notification[] = []
  private currentUser: User | null = null
  private initialized = false
  private demoMode = false

  async initialize() {
    if (this.initialized) return
    if (isConnected()) {
      await this.fetchOKRs()
      await this.fetchCheckIns()
      await this.fetchCompanyInfo()
      await this.fetchNotifications()
      this.demoMode = false
    } else {
      this.okrs = []
      this.checkIns = []
      this.notifications = []
      this.demoMode = true
    }
    this.initialized = true
  }

  isDemoMode(): boolean {
    return this.demoMode
  }

  async fetchCompanyInfo() {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .single()
    
    if (data && !error) {
      Object.assign(COMPANY_INFO, {
        mission: data.mission,
        vision: data.vision,
        strategicPlan: data.core_values
      })
    }
  }

  async fetchOKRs() {
    if (!supabase) return

    const { data: okrsData, error: okrsError } = await supabase
      .from('okrs')
      .select('*')
      .order('created_at', { ascending: false })

    if (okrsError) {
      console.error('Error fetching OKRs:', okrsError)
      return
    }

    const okrs: OKR[] = []

    for (const okr of okrsData || []) {
      const { data: keyResults } = await supabase
        .from('key_results')
        .select('*')
        .eq('okr_id', okr.id)

      const { data: initiatives } = await supabase
        .from('initiatives')
        .select('*')
        .eq('okr_id', okr.id)

      const formattedKeyResults = await Promise.all((keyResults || []).map(async (kr) => {
        const { data: progressHistory } = await supabase!
          .from('progress_history')
          .select('*')
          .eq('key_result_id', kr.id)
          .order('date', { ascending: true })

        const { data: milestoneStages } = await supabase!
          .from('milestone_stages')
          .select('*')
          .eq('key_result_id', kr.id)
          .order('order_index', { ascending: true })

        return {
          id: kr.id,
          title: kr.title,
          startDate: kr.start_date,
          endDate: kr.end_date,
          target: Number(kr.target),
          current: Number(kr.current),
          unit: kr.unit,
          targetType: kr.target_type || 'quantitative',
          milestoneStages: (milestoneStages || []).map(ms => ({
            id: ms.id,
            name: ms.name,
            weight: Number(ms.weight),
            progress: Number(ms.progress)
          })),
          progressHistory: (progressHistory || []).map(ph => ({
            date: ph.date,
            value: Number(ph.value)
          }))
        }
      }))

      const formattedInitiatives = await Promise.all((initiatives || []).map(async (init) => {
        const { data: comments } = await supabase!
          .from('comments')
          .select('*')
          .eq('initiative_id', init.id)

        return {
          id: init.id,
          title: init.title,
          completed: init.completed,
          assignee: init.assignee || undefined,
          comments: (comments || []).map(c => ({
            id: c.id,
            author: c.author,
            content: c.content,
            createdAt: c.created_at
          }))
        }
      }))

      okrs.push({
        id: okr.id,
        department: okr.department as Department,
        goal: okr.goal,
        status: okr.status as OKR['status'],
        keyResults: formattedKeyResults,
        initiatives: formattedInitiatives,
        createdAt: okr.created_at,
        updatedAt: okr.updated_at
      })
    }

    this.okrs = okrs
  }

  async fetchCheckIns() {
    if (!supabase) return

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching check-ins:', error)
      return
    }

    const checkIns: CheckIn[] = []

    for (const checkIn of data || []) {
      const { data: updates } = await supabase
        .from('check_in_key_result_updates')
        .select('*')
        .eq('check_in_id', checkIn.id)

      checkIns.push({
        id: checkIn.id,
        okrId: checkIn.okr_id,
        okrGoal: checkIn.okr_goal,
        userId: checkIn.user_id,
        userName: checkIn.user_name,
        department: checkIn.department as Department,
        message: checkIn.message,
        keyResultUpdates: (updates || []).map(u => ({
          keyResultId: u.key_result_id,
          keyResultTitle: u.key_result_title,
          previousValue: Number(u.previous_value),
          newValue: Number(u.new_value)
        })),
        createdAt: checkIn.created_at
      })
    }

    this.checkIns = checkIns
  }

  async fetchNotifications() {
    if (!supabase || !this.currentUser) return

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return
    }

    this.notifications = (data || []).map(n => {
      // Get the department from the OKR if available
      let department: any = "Other"
      if (n.okr_id) {
        const okr = this.okrs.find(o => o.id === n.okr_id)
        department = okr?.department || "Other"
      }

      return {
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        okrId: n.okr_id,
        keyResultId: n.key_result_id,
        read: n.read,
        createdAt: n.created_at,
        deadline: n.deadline,
        department
      }
    })
  }

  async login(email: string, password: string): Promise<User | null> {
    if (this.demoMode || !supabase) {
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        this.currentUser = { ...DEMO_USER }
        return this.currentUser
      }
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      return null
    }

    this.currentUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      password: data.password,
      profilePicture: data.profile_picture
    }
    
    await this.fetchNotifications()
    return this.currentUser
  }

  logout(): void {
    this.currentUser = null
    this.notifications = []
    // Clear auth token cookie on logout
    if (typeof window !== "undefined") {
      document.cookie = "auth_token=; path=/; max-age=0"
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user
  }

  getOKRs(): OKR[] {
    return this.okrs.map(okr => ({
      ...okr,
      status: this.calculateAutoStatus(okr)
    }))
  }

  getOKRsByDepartment(department: Department): OKR[] {
    return this.okrs
      .filter(okr => okr.department === department)
      .map(okr => ({
        ...okr,
        status: this.calculateAutoStatus(okr)
      }))
  }

  getOKRById(id: string): OKR | undefined {
    const okr = this.okrs.find(okr => okr.id === id)
    if (!okr) return undefined
    return {
      ...okr,
      status: this.calculateAutoStatus(okr)
    }
  }

  async createOKR(okr: Omit<OKR, "id" | "createdAt" | "updatedAt">): Promise<OKR | null> {
    if (this.demoMode || !supabase) {
      const newOKR: OKR = {
        id: `okr-${Date.now()}`,
        ...okr,
        keyResults: okr.keyResults.map((kr, i) => ({
          ...kr,
          id: kr.id || `kr-${Date.now()}-${i}`,
          targetType: kr.targetType || 'quantitative',
          milestoneStages: kr.milestoneStages?.map((ms, j) => ({
            ...ms,
            id: ms.id || `ms-${Date.now()}-${i}-${j}`
          }))
        })),
        initiatives: okr.initiatives.map((init, i) => ({
          ...init,
          id: init.id || `init-${Date.now()}-${i}`
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.okrs.unshift(newOKR)
      await this.checkDeadlinesAndNotify(newOKR)
      return newOKR
    }

    const { data: newOKR, error } = await supabase
      .from('okrs')
      .insert({
        department: okr.department,
        goal: okr.goal,
        status: okr.status
      })
      .select()
      .single()

    if (error) throw error

    for (const kr of okr.keyResults) {
      const { data: newKR } = await supabase
        .from('key_results')
        .insert({
          okr_id: newOKR.id,
          title: kr.title,
          start_date: kr.startDate,
          end_date: kr.endDate,
          target: kr.target,
          current: kr.current,
          unit: kr.unit,
          target_type: kr.targetType || 'quantitative'
        })
        .select()
        .single()

      if (newKR) {
        if (kr.progressHistory) {
          for (const ph of kr.progressHistory) {
            await supabase.from('progress_history').insert({
              key_result_id: newKR.id,
              date: ph.date,
              value: ph.value
            })
          }
        }

        if (kr.milestoneStages) {
          for (let i = 0; i < kr.milestoneStages.length; i++) {
            const ms = kr.milestoneStages[i]
            await supabase.from('milestone_stages').insert({
              key_result_id: newKR.id,
              name: ms.name,
              weight: ms.weight,
              progress: ms.progress,
              order_index: i
            })
          }
        }
      }
    }

    for (const init of okr.initiatives) {
      await supabase.from('initiatives').insert({
        okr_id: newOKR.id,
        title: init.title,
        completed: init.completed,
        assignee: init.assignee
      })
    }

    await this.fetchOKRs()
    return this.okrs.find(o => o.id === newOKR.id) || null
  }

  async updateOKR(id: string, updates: Partial<OKR>): Promise<OKR | undefined> {
    if (this.demoMode || !supabase) {
      const index = this.okrs.findIndex(o => o.id === id)
      if (index === -1) return undefined
      
      this.okrs[index] = {
        ...this.okrs[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      return this.okrs[index]
    }

    const { error } = await supabase
      .from('okrs')
      .update({
        department: updates.department,
        goal: updates.goal,
        status: updates.status
      })
      .eq('id', id)

    if (error) throw error

    if (updates.keyResults) {
      await supabase.from('key_results').delete().eq('okr_id', id)
      for (const kr of updates.keyResults) {
        const { data: newKR } = await supabase
          .from('key_results')
          .insert({
            okr_id: id,
            title: kr.title,
            start_date: kr.startDate,
            end_date: kr.endDate,
            target: kr.target,
            current: kr.current,
            unit: kr.unit,
            target_type: kr.targetType || 'quantitative'
          })
          .select()
          .single()

        if (newKR) {
          if (kr.progressHistory) {
            for (const ph of kr.progressHistory) {
              await supabase.from('progress_history').insert({
                key_result_id: newKR.id,
                date: ph.date,
                value: ph.value
              })
            }
          }

          if (kr.milestoneStages) {
            for (let i = 0; i < kr.milestoneStages.length; i++) {
              const ms = kr.milestoneStages[i]
              await supabase.from('milestone_stages').insert({
                key_result_id: newKR.id,
                name: ms.name,
                weight: ms.weight,
                progress: ms.progress,
                order_index: i
              })
            }
          }
        }
      }
    }

    if (updates.initiatives) {
      await supabase.from('initiatives').delete().eq('okr_id', id)
      for (const init of updates.initiatives) {
        await supabase.from('initiatives').insert({
          okr_id: id,
          title: init.title,
          completed: init.completed,
          assignee: init.assignee
        })
      }
    }

    await this.fetchOKRs()
    return this.okrs.find(o => o.id === id)
  }

  async updateMilestoneStage(okrId: string, keyResultId: string, stageId: string, progress: number): Promise<void> {
    const okr = this.okrs.find(o => o.id === okrId)
    if (!okr) return

    const kr = okr.keyResults.find(k => k.id === keyResultId)
    if (!kr || !kr.milestoneStages) return

    const updatedStages = kr.milestoneStages.map(stage =>
      stage.id === stageId ? { ...stage, progress: Math.min(100, Math.max(0, progress)) } : stage
    )

    const totalProgress = updatedStages.reduce((acc, stage) => {
      return acc + (stage.progress * stage.weight / 100)
    }, 0)

    kr.milestoneStages = updatedStages
    kr.current = Math.round(totalProgress)

    if (!this.demoMode && supabase) {
      await supabase
        .from('milestone_stages')
        .update({ progress })
        .eq('id', stageId)

      await supabase
        .from('key_results')
        .update({ current: Math.round(totalProgress) })
        .eq('id', keyResultId)
    }
  }

  async deleteOKR(id: string): Promise<boolean> {
    if (this.demoMode || !supabase) {
      const index = this.okrs.findIndex(o => o.id === id)
      if (index === -1) return false
      this.okrs.splice(index, 1)
      // Remove associated notifications from demo mode
      this.notifications = this.notifications.filter(n => n.okrId !== id)
      return true
    }

    try {
      // Delete check-ins associated with the OKR first (they have foreign key constraints)
      const { data: checkInsToDelete } = await supabase
        .from('check_ins')
        .select('id')
        .eq('okr_id', id)

      if (checkInsToDelete && checkInsToDelete.length > 0) {
        const checkInIds = checkInsToDelete.map(ci => ci.id)
        // Delete check-in updates first
        await supabase
          .from('check_in_key_result_updates')
          .delete()
          .in('check_in_id', checkInIds)
        
        // Delete check-ins
        await supabase
          .from('check_ins')
          .delete()
          .in('id', checkInIds)
      }

      // Delete notifications associated with the OKR
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('okr_id', id)

      if (notifError) {
        console.error('Error deleting notifications:', notifError)
      }

      // Delete the OKR (this should cascade delete key_results and initiatives)
      const { error: okrError } = await supabase
        .from('okrs')
        .delete()
        .eq('id', id)

      if (okrError) {
        console.error('Error deleting OKR:', okrError)
        return false
      }
      
      // Refresh data
      await this.fetchOKRs()
      await this.fetchNotifications()
      
      // Also remove from local state to ensure immediate UI update
      this.okrs = this.okrs.filter(o => o.id !== id)
      this.notifications = this.notifications.filter(n => n.okrId !== id)
      
      return true
    } catch (error) {
      console.error('Error in deleteOKR:', error)
      return false
    }
  }

  getCheckIns(): CheckIn[] {
    return [...this.checkIns].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getCheckInsByOKR(okrId: string): CheckIn[] {
    return this.checkIns
      .filter(ci => ci.okrId === okrId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getCheckInsByMonth(year: number, month: number): CheckIn[] {
    return this.checkIns.filter(ci => {
      const date = new Date(ci.createdAt)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }

  async createCheckIn(checkIn: Omit<CheckIn, "id" | "createdAt">): Promise<CheckIn | null> {
    if (this.demoMode || !supabase) {
      const newCheckIn: CheckIn = {
        id: `checkin-${Date.now()}`,
        ...checkIn,
        createdAt: new Date().toISOString()
      }
      this.checkIns.unshift(newCheckIn)
      
      if (checkIn.keyResultUpdates) {
        for (const update of checkIn.keyResultUpdates) {
          const okr = this.okrs.find(o => o.id === checkIn.okrId)
          if (okr) {
            const kr = okr.keyResults.find(k => k.id === update.keyResultId)
            if (kr) {
              kr.current = update.newValue
              kr.progressHistory.push({
                date: new Date().toISOString().split('T')[0],
                value: update.newValue
              })
            }
          }
        }
      }
      return newCheckIn
    }

    const { data: newCheckIn, error } = await supabase
      .from('check_ins')
      .insert({
        okr_id: checkIn.okrId,
        okr_goal: checkIn.okrGoal,
        user_id: checkIn.userId,
        user_name: checkIn.userName,
        department: checkIn.department,
        message: checkIn.message
      })
      .select()
      .single()

    if (error) throw error

    if (checkIn.keyResultUpdates) {
      for (const update of checkIn.keyResultUpdates) {
        await supabase.from('check_in_key_result_updates').insert({
          check_in_id: newCheckIn.id,
          key_result_id: update.keyResultId,
          key_result_title: update.keyResultTitle,
          previous_value: update.previousValue,
          new_value: update.newValue
        })
      }
    }

    await this.fetchCheckIns()
    return this.checkIns.find(c => c.id === newCheckIn.id) || null
  }

  getNotifications(): Notification[] {
    const seen = new Set<string>()
    const deduped: Notification[] = []
    
    const sorted = [...this.notifications].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    for (const n of sorted) {
      // Filter out notifications for deleted OKRs
      if (n.okrId && !this.okrs.find(o => o.id === n.okrId)) {
        continue
      }
      
      if (n.type === "deadline_reminder" && n.okrId) {
        const key = `${n.okrId}-${n.type}`
        if (seen.has(key)) continue
        seen.add(key)
      }
      deduped.push(n)
    }
    
    return deduped
  }

  async addNotification(notification: Omit<Notification, "id" | "createdAt">): Promise<Notification | null> {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...notification,
      createdAt: new Date().toISOString()
    }

    if (this.demoMode || !supabase) {
      this.notifications.unshift(newNotification)
      return newNotification
    }

    if (notification.type === "deadline_reminder" && notification.okrId) {
      const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notification.userId)
        .eq('type', notification.type)
        .eq('okr_id', notification.okrId)
        .maybeSingle()

      if (existing && !checkError) {
        return null
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        okr_id: notification.okrId,
        key_result_id: notification.keyResultId,
        read: notification.read,
        deadline: notification.deadline
      })
      .select()
      .single()

    if (error) throw error

    await this.fetchNotifications()
    return this.notifications.find(n => n.id === data.id) || null
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id)
    if (!notification) return

    notification.read = true

    if (!this.demoMode && supabase) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true)

    if (!this.demoMode && supabase && this.currentUser) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', this.currentUser.id)
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (!this.demoMode && supabase && this.currentUser) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', this.currentUser.id)
    }
    this.notifications = []
  }

  calculateAutoStatus(okr: OKR): OKRStatus {
    const now = new Date()
    
    const overallProgress = okr.keyResults.length > 0
      ? okr.keyResults.reduce((acc, kr) => acc + Math.min((kr.current / kr.target) * 100, 100), 0) / okr.keyResults.length
      : 0

    let earliestDeadline: Date | null = null
    for (const kr of okr.keyResults) {
      const endDate = new Date(kr.endDate)
      if (!earliestDeadline || endDate < earliestDeadline) {
        earliestDeadline = endDate
      }
    }

    if (!earliestDeadline) {
      return "on-track"
    }

    const daysUntilDeadline = Math.ceil((earliestDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDeadline < 0 && overallProgress < 100) {
      return "off-track"
    }

    const checkInsForOKR = this.checkIns.filter(ci => ci.okrId === okr.id)
    const lastCheckInDate = checkInsForOKR.length > 0 
      ? new Date(checkInsForOKR[0].createdAt) 
      : new Date(okr.updatedAt)
    
    const daysSinceLastUpdate = Math.ceil((now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastUpdate >= 7 && daysUntilDeadline <= 14 && daysUntilDeadline >= 0) {
      return "at-risk"
    }

    if (daysSinceLastUpdate >= 30) {
      return "at-risk"
    }

    return "on-track"
  }

  getCalculatedStatus(okrId: string): OKRStatus {
    const okr = this.okrs.find(o => o.id === okrId)
    if (!okr) return "on-track"
    return this.calculateAutoStatus(okr)
  }

  getOKRsWithAutoStatus(): OKR[] {
    return this.okrs.map(okr => ({
      ...okr,
      status: this.calculateAutoStatus(okr)
    }))
  }

  async checkDeadlinesAndNotify(okr: OKR): Promise<void> {
    if (!this.currentUser) return

    const existingNotification = this.notifications.find(
      n => n.type === "deadline_reminder" && n.okrId === okr.id
    )
    
    if (existingNotification) return

    const now = new Date()
    let earliestDeadline: { days: number; date: string } | null = null

    for (const kr of okr.keyResults) {
      const endDate = new Date(kr.endDate)
      const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
        if (!earliestDeadline || daysUntilDeadline < earliestDeadline.days) {
          earliestDeadline = { days: daysUntilDeadline, date: kr.endDate }
        }
      }
    }

    if (earliestDeadline) {
      let dueMessage = ""
      if (earliestDeadline.days === 0) {
        dueMessage = `"${okr.goal}" is due today`
      } else if (earliestDeadline.days === 1) {
        dueMessage = `"${okr.goal}" is due tomorrow`
      } else {
        dueMessage = `"${okr.goal}" is due in ${earliestDeadline.days} days`
      }

      await this.addNotification({
        userId: this.currentUser.id,
        type: "deadline_reminder",
        title: "Upcoming Deadline",
        message: dueMessage,
        okrId: okr.id,
        keyResultId: undefined,
        read: false,
        deadline: earliestDeadline.date
      })
    }
  }

  async checkAllDeadlines(): Promise<void> {
    for (const okr of this.okrs) {
      await this.checkDeadlinesAndNotify(okr)
    }
  }

  getStats(filterMonth?: { year: number; month: number }, filterDepartment?: string) {
    let filteredOkrs = this.okrs.map(okr => ({
      ...okr,
      status: this.calculateAutoStatus(okr)
    }))
    
    if (filterMonth) {
      filteredOkrs = filteredOkrs.filter(okr => {
        const date = new Date(okr.createdAt)
        return date.getFullYear() === filterMonth.year && date.getMonth() === filterMonth.month
      })
    }

    if (filterDepartment && filterDepartment !== "all") {
      filteredOkrs = filteredOkrs.filter(okr => okr.department === filterDepartment)
    }

    const total = filteredOkrs.length
    const onTrack = filteredOkrs.filter(o => o.status === "on-track").length
    const atRisk = filteredOkrs.filter(o => o.status === "at-risk").length
    const offTrack = filteredOkrs.filter(o => o.status === "off-track").length

    const departmentProgress: Record<string, number> = {}
    const departmentCounts: Record<string, number> = {}
    
    DEPARTMENTS.forEach(dept => {
      const deptOKRs = filteredOkrs.filter(o => o.department === dept)
      departmentCounts[dept] = deptOKRs.length
      if (deptOKRs.length > 0) {
        const totalProgress = deptOKRs.reduce((acc, okr) => {
          const krProgress = okr.keyResults.reduce((krAcc, kr) => {
            return krAcc + Math.min((kr.current / kr.target) * 100, 100)
          }, 0)
          return acc + (okr.keyResults.length > 0 ? krProgress / okr.keyResults.length : 0)
        }, 0)
        departmentProgress[dept] = Math.round(totalProgress / deptOKRs.length)
      }
    })

    const overallProgress = Object.values(departmentProgress).length > 0
      ? Math.round(Object.values(departmentProgress).reduce((a, b) => a + b, 0) / Object.values(departmentProgress).length)
      : 0

    const uniqueDepartments = new Set(filteredOkrs.map(o => o.department)).size

    return {
      total,
      onTrack,
      atRisk,
      offTrack,
      overallProgress,
      departmentProgress,
      departmentCounts,
      uniqueDepartments
    }
  }

  async addComment(okrId: string, initiativeId: string, comment: Omit<Comment, "id" | "createdAt">): Promise<Comment | null> {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      ...comment,
      createdAt: new Date().toISOString()
    }

    if (this.demoMode || !supabase) {
      const okr = this.okrs.find(o => o.id === okrId)
      if (!okr) return null
      
      const initiative = okr.initiatives.find(i => i.id === initiativeId)
      if (!initiative) return null
      
      if (!initiative.comments) {
        initiative.comments = []
      }
      initiative.comments.push(newComment)
      return newComment
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        initiative_id: initiativeId,
        author: comment.author,
        content: comment.content
      })

    if (error) throw error
    
    await this.fetchOKRs()
    return newComment
  }
}

export const store = new Store()
