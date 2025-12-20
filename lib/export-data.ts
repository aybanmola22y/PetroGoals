"use client"

import { OKR, CheckIn } from "@/types/okr"
import { store } from "./store"

function escapeCSV(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function arrayToCSV(headers: string[], rows: (string | number | boolean | undefined | null)[][]): string {
  const headerRow = headers.map(escapeCSV).join(",")
  const dataRows = rows.map(row => row.map(escapeCSV).join(","))
  return [headerRow, ...dataRows].join("\n")
}

export function exportOKRsToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["ID", "Department", "Goal", "Status", "Created At", "Updated At"]
  const rows = okrs.map(okr => [
    okr.id,
    okr.department,
    okr.goal,
    okr.status,
    okr.createdAt,
    okr.updatedAt
  ])
  return arrayToCSV(headers, rows)
}

export function exportKeyResultsToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["OKR ID", "OKR Goal", "Key Result ID", "Title", "Start Date", "End Date", "Target", "Current", "Unit", "Target Type", "Progress %"]
  const rows: (string | number | boolean | undefined | null)[][] = []
  
  for (const okr of okrs) {
    for (const kr of okr.keyResults) {
      const progress = kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0
      rows.push([
        okr.id,
        okr.goal,
        kr.id,
        kr.title,
        kr.startDate,
        kr.endDate,
        kr.target,
        kr.current,
        kr.unit,
        kr.targetType,
        progress
      ])
    }
  }
  
  return arrayToCSV(headers, rows)
}

export function exportCheckInsToCSV(): string {
  const checkIns = store.getCheckIns()
  const headers = ["ID", "OKR ID", "OKR Goal", "User ID", "User Name", "Department", "Message", "Created At", "Key Result Updates"]
  const rows = checkIns.map(ci => {
    const updates = ci.keyResultUpdates?.map(u => 
      `${u.keyResultTitle}: ${u.previousValue} → ${u.newValue}`
    ).join("; ") || ""
    
    return [
      ci.id,
      ci.okrId,
      ci.okrGoal,
      ci.userId,
      ci.userName,
      ci.department,
      ci.message,
      ci.createdAt,
      updates
    ]
  })
  return arrayToCSV(headers, rows)
}

export function exportInitiativesToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["OKR ID", "OKR Goal", "Initiative ID", "Title", "Completed", "Assignee"]
  const rows: (string | number | boolean | undefined | null)[][] = []
  
  for (const okr of okrs) {
    for (const init of okr.initiatives) {
      rows.push([
        okr.id,
        okr.goal,
        init.id,
        init.title,
        init.completed ? "Yes" : "No",
        init.assignee || ""
      ])
    }
  }
  
  return arrayToCSV(headers, rows)
}

export function exportCommentsToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["OKR ID", "OKR Goal", "Initiative ID", "Initiative Title", "Comment ID", "Author", "Content", "Created At"]
  const rows: (string | number | boolean | undefined | null)[][] = []
  
  for (const okr of okrs) {
    for (const init of okr.initiatives) {
      for (const comment of init.comments) {
        rows.push([
          okr.id,
          okr.goal,
          init.id,
          init.title,
          comment.id,
          comment.author,
          comment.content,
          comment.createdAt
        ])
      }
    }
  }
  
  return arrayToCSV(headers, rows)
}

export function exportMilestoneStagesToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["OKR ID", "OKR Goal", "Key Result ID", "Key Result Title", "Stage ID", "Stage Name", "Weight %", "Progress %"]
  const rows: (string | number | boolean | undefined | null)[][] = []
  
  for (const okr of okrs) {
    for (const kr of okr.keyResults) {
      if (kr.milestoneStages) {
        for (const stage of kr.milestoneStages) {
          rows.push([
            okr.id,
            okr.goal,
            kr.id,
            kr.title,
            stage.id,
            stage.name,
            stage.weight,
            stage.progress
          ])
        }
      }
    }
  }
  
  return arrayToCSV(headers, rows)
}

export function exportProgressHistoryToCSV(): string {
  const okrs = store.getOKRs()
  const headers = ["OKR ID", "OKR Goal", "Key Result ID", "Key Result Title", "Date", "Value"]
  const rows: (string | number | boolean | undefined | null)[][] = []
  
  for (const okr of okrs) {
    for (const kr of okr.keyResults) {
      for (const entry of kr.progressHistory) {
        rows.push([
          okr.id,
          okr.goal,
          kr.id,
          kr.title,
          entry.date,
          entry.value
        ])
      }
    }
  }
  
  return arrayToCSV(headers, rows)
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAllDataAsZip(): void {
  const timestamp = new Date().toISOString().split("T")[0]
  
  downloadCSV(`okrs_${timestamp}.csv`, exportOKRsToCSV())
  
  setTimeout(() => {
    downloadCSV(`key_results_${timestamp}.csv`, exportKeyResultsToCSV())
  }, 100)
  
  setTimeout(() => {
    downloadCSV(`check_ins_${timestamp}.csv`, exportCheckInsToCSV())
  }, 200)
  
  setTimeout(() => {
    downloadCSV(`initiatives_${timestamp}.csv`, exportInitiativesToCSV())
  }, 300)
  
  setTimeout(() => {
    downloadCSV(`comments_${timestamp}.csv`, exportCommentsToCSV())
  }, 400)
  
  setTimeout(() => {
    downloadCSV(`milestone_stages_${timestamp}.csv`, exportMilestoneStagesToCSV())
  }, 500)
  
  setTimeout(() => {
    downloadCSV(`progress_history_${timestamp}.csv`, exportProgressHistoryToCSV())
  }, 600)
}
