// lib\store.ts
"use client"

import { OKR, CheckIn, User, CompanyInfo, Department, DEPARTMENTS, Comment, Notification, KeyResult, MilestoneStage, OKRStatus, Initiative } from "@/types/okr"
import { supabase, isConnected } from "./supabase"
import { toast } from "sonner"

export const COMPANY_INFO: CompanyInfo = {
  mission: "To provide quality training, review, and consultancy services to clients seeking growth and development.",
  vision: "To be the leading institution providing one-stop-shop services on becoming better, safer and healthier nation.",
  strategicPlan: [
    "Operational Excellence",
    "Human Capital",
    "Sustainable Operations",
    "Digital Transformation",
    "Business Growth",
  ],
  values: [
    "Leadership in Health, Safety, and Environment",
    "Care for Clients and Stakeholders",
    "Committed to Quality and Excellence",
    "Respect for Diversity and Equality",
    "Passion for Service"
  ]
}

export const STRATEGIC_PILLAR_SUBTITLES: Record<string, string> = {
  "Operational Excellence": "Quality Service, HSE & Data Security",
  "Human Capital": "Generative Working Culture & Employee Engagement",
  "Sustainable Operations": "Strong Financial Management & Positioning",
  "Digital Transformation": "Digitalization & Data-Driven Operations",
  "Business Growth": "Expansion & Diversification of Services"
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
  private users: User[] = []
  private currentUser: User | null = null
  private initialized = false
  private demoMode = false

  private lastFetchTime = 0
  private fetchCacheDuration = 3000 // 3 seconds cache
  private isLoadingOKRs = false

  async initialize() {
    if (this.initialized) return
    if (isConnected()) {
      await this.fetchOKRs()
      await this.fetchCheckIns()
      await this.fetchCompanyInfo()
      await this.fetchNotifications()
      await this.fetchUsers()
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

  async fetchUsers() {
    if (this.demoMode || !supabase) {
      this.users = [DEMO_USER]
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      this.users = (data || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        profilePicture: u.profile_picture || undefined
      }))
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      this.users = [DEMO_USER]
    }
  }

  async fetchOKRs() {
    // Prevent duplicate calls
    if (this.isLoadingOKRs) return

    const now = Date.now()
    if (now - this.lastFetchTime < this.fetchCacheDuration) {
      return // Skip if fetched recently
    }

    this.isLoadingOKRs = true
    this.lastFetchTime = now

    if (!supabase) {
      this.isLoadingOKRs = false
      return
    }

    try {
      // Single query with all joins - reduces 100+ queries to 1
      const { data: okrsData, error: okrsError } = await supabase
        .from('okrs')
        .select(`
        *,
        key_results (
          *,
          progress_history (*),
          milestone_stages (*)
        ),
        initiatives (
          *,
          comments (*)
        )
      `)
        .order('created_at', { ascending: false })

      if (okrsError) {
        console.error('Error fetching OKRs:', okrsError)
        return
      }

      // Transform the nested data structure
      this.okrs = (okrsData || []).map((okr: any) => ({
        id: okr.id,
        department: okr.department as Department,
        goal: okr.goal,
        status: okr.status as OKR['status'],
        strategicPillar: okr.strategic_pillar,
        createdBy: okr.created_by,
        keyResults: (okr.key_results || []).map((kr: any) => ({
          id: kr.id,
          title: kr.title,
          startDate: kr.start_date,
          endDate: kr.end_date,
          target: Number(kr.target),
          current: Number(kr.current),
          unit: kr.unit,
          targetType: kr.target_type || 'quantitative',
          milestoneStages: (kr.milestone_stages || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((ms: any) => ({
              id: ms.id,
              name: ms.name,
              weight: Number(ms.weight),
              progress: Number(ms.progress)
            })),
          progressHistory: (kr.progress_history || [])
            .sort((a: any, b: any) => a.date.localeCompare(b.date))
            .map((ph: any) => ({
              date: ph.date,
              value: Number(ph.value)
            }))
        })),
        initiatives: (okr.initiatives || []).map((init: any) => ({
          id: init.id,
          title: init.title,
          completed: init.completed,
          assignee: init.assignee || undefined,
          deadline: init.deadline || undefined,
          comments: (init.comments || []).map((c: any) => ({
            id: c.id,
            author: c.author,
            content: c.content,
            createdAt: c.created_at
          }))
        })),
        createdAt: okr.created_at,
        updatedAt: okr.updated_at
      }))
    } catch (error) {
      console.error('Error in fetchOKRs:', error)
      this.okrs = []
    } finally {
      this.isLoadingOKRs = false
    }
  }
  async fetchCheckIns() {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
        *,
        check_in_key_result_updates (*)
      `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching check-ins:', error)
        return
      }

      // Fetch users to get profile pictures
      const { data: users } = await supabase
        .from('users')
        .select('id, profile_picture, name')

      const userMap = new Map((users || []).map(u => [u.id, u.profile_picture]))
      const nameMap = new Map((users || []).map(u => [u.name, u.profile_picture]))

      this.checkIns = (data || []).map(checkIn => ({
        id: checkIn.id,
        okrId: checkIn.okr_id,
        okrGoal: checkIn.okr_goal,
        userId: checkIn.user_id,
        userName: checkIn.user_name,
        department: checkIn.department as Department,
        message: checkIn.message,
        userProfilePicture: userMap.get(checkIn.user_id) || nameMap.get(checkIn.user_name) || undefined,
        keyResultUpdates: (checkIn.check_in_key_result_updates || []).map((u: any) => ({
          keyResultId: u.key_result_id,
          keyResultTitle: u.key_result_title,
          previousValue: Number(u.previous_value),
          newValue: Number(u.new_value)
        })),
        createdAt: checkIn.created_at
      }))
    } catch (error) {
      console.error('Error in fetchCheckIns:', error)
      this.checkIns = []
    }
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

  getUsers(): User[] {
    return this.users
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
    try {
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
        toast.success("OKR created successfully!")
        return newOKR
      }

      const { data: newOKR, error } = await supabase
        .from('okrs')
        .insert({
          department: okr.department,
          goal: okr.goal,
          status: okr.status,
          strategic_pillar: okr.strategicPillar || null,
          created_by: okr.createdBy || null
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
          assignee: init.assignee,
          deadline: init.deadline
        })
      }

      await this.fetchOKRs()
      const createdOKR = this.okrs.find(o => o.id === newOKR.id)
      if (createdOKR) {
        await this.sendInitiativeNotifications(createdOKR)
      }
      toast.success("OKR created successfully!")
      return createdOKR || null
    } catch (error) {
      toast.error("Failed to create OKR")
      throw error
    }
  }

  async updateOKR(id: string, updates: Partial<OKR>): Promise<OKR | undefined> {
    try {
      if (this.demoMode || !supabase) {
        const index = this.okrs.findIndex(o => o.id === id)
        if (index === -1) return undefined

        this.okrs[index] = {
          ...this.okrs[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        toast.success("OKR updated successfully!")
        return this.okrs[index]
      }

      const { error } = await supabase
        .from('okrs')
        .update({
          department: updates.department,
          goal: updates.goal,
          status: updates.status,
          strategic_pillar: updates.strategicPillar || null,
          created_by: updates.createdBy || null
        })
        .eq('id', id)

      if (error) throw error

      if (updates.keyResults) {
        // Get existing key result IDs for this OKR to handle updates vs inserts
        const { data: existingKRs } = await supabase
          .from('key_results')
          .select('id')
          .eq('okr_id', id)

        const existingIds = new Set((existingKRs || []).map(kr => kr.id))
        const updatedIds = new Set(updates.keyResults.map(kr => kr.id).filter(id => !id.startsWith('temp-')))

        // Delete key results that are no longer present
        const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id))
        if (idsToDelete.length > 0) {
          await supabase.from('key_results').delete().in('id', idsToDelete)
        }

        for (const kr of updates.keyResults) {
          const isNew = kr.id.startsWith('temp-')
          const krData = {
            okr_id: id,
            title: kr.title,
            start_date: kr.startDate,
            end_date: kr.endDate,
            target: kr.target,
            current: kr.current,
            unit: kr.unit,
            target_type: kr.targetType || 'quantitative'
          }

          let krId = kr.id
          if (isNew) {
            const { data: newKR } = await supabase
              .from('key_results')
              .insert(krData)
              .select()
              .single()
            if (newKR) krId = newKR.id
          } else {
            await supabase
              .from('key_results')
              .update(krData)
              .eq('id', kr.id)
          }

          if (krId && !krId.startsWith('temp-')) {
            if (kr.milestoneStages) {
              // Handle milestone stages similarly
              const { data: existingStages } = await supabase
                .from('milestone_stages')
                .select('id')
                .eq('key_result_id', krId)

              const existingStageIds = new Set((existingStages || []).map(s => s.id))
              const updatedStageIds = new Set(kr.milestoneStages.map(s => s.id).filter(id => !id.startsWith('temp-')))

              const stagesToDelete = Array.from(existingStageIds).filter(id => !updatedStageIds.has(id))
              if (stagesToDelete.length > 0) {
                await supabase.from('milestone_stages').delete().in('id', stagesToDelete)
              }

              for (let i = 0; i < kr.milestoneStages.length; i++) {
                const ms = kr.milestoneStages[i]
                const msData = {
                  key_result_id: krId,
                  name: ms.name,
                  weight: Number(ms.weight) || 0,
                  progress: Number(ms.progress) || 0,
                  order_index: i
                }

                if (ms.id.startsWith('temp-')) {
                  await supabase.from('milestone_stages').insert(msData)
                } else {
                  await supabase.from('milestone_stages').update(msData).eq('id', ms.id)
                }
              }
            }
          }
        }
      }

      if (updates.initiatives) {
        // Get existing initiative IDs for this OKR
        const { data: existingInits } = await supabase
          .from('initiatives')
          .select('id')
          .eq('okr_id', id)

        const existingIds = new Set((existingInits || []).map(i => i.id))
        const updatedIds = new Set(updates.initiatives.map(i => i.id).filter(id => id && !id.startsWith('temp-')))

        // Delete initiatives that are no longer present
        const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id))
        if (idsToDelete.length > 0) {
          await supabase.from('initiatives').delete().in('id', idsToDelete)
        }

        for (const init of updates.initiatives) {
          const isNew = !init.id || init.id.startsWith('temp-')
          const initData = {
            okr_id: id,
            title: init.title,
            completed: init.completed,
            assignee: init.assignee,
            deadline: init.deadline
          }

          if (isNew) {
            await supabase.from('initiatives').insert(initData)
          } else {
            await supabase.from('initiatives').update(initData).eq('id', init.id)
          }
        }
      }

      const previousInits = this.okrs.find(o => o.id === id)?.initiatives

      await this.fetchOKRs()
      const updatedOKR = this.okrs.find(o => o.id === id)
      if (updatedOKR) {
        await this.sendInitiativeNotifications(updatedOKR, previousInits)
      }
      toast.success("OKR updated successfully!")
      return updatedOKR
    } catch (error) {
      toast.error("Failed to update OKR")
      throw error
    }
  }

  async toggleInitiative(okrId: string, initiativeId: string, completed: boolean): Promise<void> {
    try {
      if (this.demoMode || !supabase) {
        const okr = this.okrs.find(o => o.id === okrId)
        if (okr) {
          const init = okr.initiatives.find(i => i.id === initiativeId)
          if (init) init.completed = completed
        }
        return
      }

      const { error } = await supabase
        .from('initiatives')
        .update({ completed })
        .eq('id', initiativeId)

      if (error) throw error

      // Update local state without full fetch to avoid duplication during rapid clicks
      const okr = this.okrs.find(o => o.id === okrId)
      if (okr) {
        const initiative = okr.initiatives.find(i => i.id === initiativeId)
        if (initiative) initiative.completed = completed
      }
    } catch (error) {
      console.error('Error toggling initiative:', error)
      toast.error("Failed to update initiative")
      throw error
    }
  }

  async updateMilestoneStage(okrId: string, keyResultId: string, stageId: string, progress: number): Promise<void> {
    try {
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

      toast.success("Milestone updated successfully!")
    } catch (error) {
      toast.error("Failed to update milestone")
      throw error
    }
  }

  async deleteOKR(id: string): Promise<boolean> {
    try {
      if (this.demoMode || !supabase) {
        const index = this.okrs.findIndex(o => o.id === id)
        if (index === -1) return false
        this.okrs.splice(index, 1)
        this.notifications = this.notifications.filter(n => n.okrId !== id)
        toast.success("OKR deleted successfully!")
        return true
      }

      // Delete check-ins associated with the OKR first (they have foreign key constraints)
      const { data: checkInsToDelete } = await supabase
        .from('check_ins')
        .select('id')
        .eq('okr_id', id)

      if (checkInsToDelete && checkInsToDelete.length > 0) {
        const checkInIds = checkInsToDelete.map(ci => ci.id)
        await supabase
          .from('check_in_key_result_updates')
          .delete()
          .in('check_in_id', checkInIds)

        await supabase
          .from('check_ins')
          .delete()
          .in('id', checkInIds)
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('okr_id', id)

      if (notifError) {
        console.error('Error deleting notifications:', notifError)
      }

      const { error: okrError } = await supabase
        .from('okrs')
        .delete()
        .eq('id', id)

      if (okrError) {
        console.error('Error deleting OKR:', okrError)
        toast.error("Failed to delete OKR")
        return false
      }

      await this.fetchOKRs()
      await this.fetchNotifications()

      this.okrs = this.okrs.filter(o => o.id !== id)
      this.notifications = this.notifications.filter(n => n.okrId !== id)

      toast.success("OKR deleted successfully!")
      return true
    } catch (error) {
      console.error('Error in deleteOKR:', error)
      toast.error("Failed to delete OKR")
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
    try {
      if (this.demoMode || !supabase) {
        const newCheckIn: CheckIn = {
          id: `checkin-${Date.now()}`,
          ...checkIn,
          createdAt: new Date().toISOString(),
          userProfilePicture: this.currentUser?.profilePicture
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

                // Also update milestone stages if they exist
                if (update.milestoneUpdates && kr.milestoneStages) {
                  for (const msUpdate of (update as any).milestoneUpdates) {
                    const stage = kr.milestoneStages.find(s => s.id === msUpdate.stageId)
                    if (stage) {
                      stage.progress = msUpdate.newProgress
                    }
                  }
                }
              }
            }
          }
        }
        toast.success("Check-in created successfully!")
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
          if (!this.demoMode && supabase) {
            // Update the key result's current value
            await supabase
              .from('key_results')
              .update({ current: update.newValue })
              .eq('id', update.keyResultId)

            // Add to progress history
            await supabase.from('progress_history').insert({
              key_result_id: update.keyResultId,
              date: new Date().toISOString().split('T')[0],
              value: update.newValue
            })

            // Update milestone stages if they exist
            if (update.milestoneUpdates) {
              for (const msUpdate of update.milestoneUpdates) {
                await supabase
                  .from('milestone_stages')
                  .update({ progress: msUpdate.newProgress })
                  .eq('id', msUpdate.stageId)
              }
            }

            // Fetch all stages after updates to ensure we have the latest state for recalculation
            const { data: stages } = await supabase
              .from('milestone_stages')
              .select('progress, weight')
              .eq('key_result_id', update.keyResultId)

            if (stages && stages.length > 0) {
              const calculatedProgress = stages.reduce((acc, stage) => {
                return acc + (Number(stage.progress) * Number(stage.weight) / 100)
              }, 0)
              const roundedProgress = Math.round(calculatedProgress)

              // Update the key result's current value in Supabase
              await supabase
                .from('key_results')
                .update({ current: roundedProgress })
                .eq('id', update.keyResultId)

              // Update the value in the current object for the check_in_key_result_updates link
              update.newValue = roundedProgress
            }

            // Create the check-in key result update link with the recalculated progress
            await supabase.from('check_in_key_result_updates').insert({
              check_in_id: newCheckIn.id,
              key_result_id: update.keyResultId,
              key_result_title: update.keyResultTitle,
              previous_value: update.previousValue,
              new_value: update.newValue
            })
          }
        }
      }

      this.lastFetchTime = 0
      await this.fetchOKRs()
      await this.fetchCheckIns()
      toast.success("Check-in created successfully!")
      return this.checkIns.find(c => c.id === newCheckIn.id) || null
    } catch (error) {
      toast.error("Failed to create check-in")
      throw error
    }
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

    toast.success("All notifications marked as read")
  }

  async clearAllNotifications(): Promise<void> {
    if (!this.demoMode && supabase && this.currentUser) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', this.currentUser.id)
    }
    this.notifications = []
    toast.success("All notifications cleared")
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
    try {
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
        toast.success("Comment added successfully!")
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
      toast.success("Comment added successfully!")
      return newComment
    } catch (error) {
      toast.error("Failed to add comment")
      throw error
    }
  }

  private async sendInitiativeNotifications(okr: OKR, previousInitiatives?: Initiative[]) {
    const appUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"

    for (const initiative of okr.initiatives) {
      if (initiative.assignee) {
        // Only send if it's a new initiative or the assignee has changed
        if (previousInitiatives) {
          const prevInit = previousInitiatives.find(i => i.id === initiative.id)
          if (prevInit && prevInit.assignee === initiative.assignee) {
            continue // Assignee didn't change, skip email
          }
        }

        const user = this.users.find(u => u.name === initiative.assignee)
        if (user && user.email) {
          const okrLink = `${appUrl}/dashboard/departments?okrId=${okr.id}`

          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.email,
                subject: `New Initiative Assigned: ${initiative.title}`,
                text: `You have been assigned a new initiative: "${initiative.title}" in the OKR: "${okr.goal}".\n\nClick here to view: ${okrLink}`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">New Initiative Assigned</h2>
                    <p>Hi <strong>${user.name}</strong>,</p>
                    <p>You have been assigned a new initiative:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 18px; font-weight: bold;">${initiative.title}</p>
                      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Objective: ${okr.goal}</p>
                    </div>
                    <p>Click the button below to view the OKR details and start working on this initiative:</p>
                    <div style="margin-top: 20px;">
                      <a href="${okrLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View OKR Details</a>
                    </div>
                    <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">Sent by PetroGoals OKR Management System</p>
                  </div>
                `
              })
            })
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error)
          }
        }
      }
    }
  }
}

export const store = new Store()
