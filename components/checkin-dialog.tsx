"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OKR, CheckIn } from "@/types/okr"
import { formatDateTime } from "@/lib/utils"

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  okr: OKR | null
  onSubmit: (checkIn: Omit<CheckIn, "id" | "createdAt">) => void
  userName: string
}

export function CheckInDialog({ open, onOpenChange, okr, onSubmit, userName }: CheckInDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [keyResultUpdates, setKeyResultUpdates] = React.useState<Record<string, number>>({})

  React.useEffect(() => {
    if (open && okr) {
      setMessage("")
      const updates: Record<string, number> = {}
      okr.keyResults.forEach(kr => {
        updates[kr.id] = kr.current
      })
      setKeyResultUpdates(updates)
    }
  }, [open, okr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!okr) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    const updates = okr.keyResults
      .filter(kr => keyResultUpdates[kr.id] !== kr.current)
      .map(kr => ({
        keyResultId: kr.id,
        keyResultTitle: kr.title,
        previousValue: kr.current,
        newValue: keyResultUpdates[kr.id] || kr.current,
      }))

    onSubmit({
      okrId: okr.id,
      okrGoal: okr.goal,
      userId: "1",
      userName,
      department: okr.department,
      message,
      keyResultUpdates: updates.length > 0 ? updates : undefined,
    })

    setIsLoading(false)
    onOpenChange(false)
  }

  if (!okr) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Check In</DialogTitle>
          <DialogDescription>
            Update progress and add notes for this OKR
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="mb-2">{okr.department}</Badge>
              <p className="text-sm font-medium">{okr.goal}</p>
            </div>

            <div className="space-y-3">
              <Label>Update Key Results (optional)</Label>
              {okr.keyResults.map(kr => (
                <div key={kr.id} className="p-3 border rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium">{kr.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {kr.current.toLocaleString()} / Target: {kr.target.toLocaleString()} {kr.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">New Value:</Label>
                    <Input
                      type="number"
                      className="w-32"
                      value={keyResultUpdates[kr.id] || 0}
                      onChange={(e) => setKeyResultUpdates({
                        ...keyResultUpdates,
                        [kr.id]: Number(e.target.value)
                      })}
                    />
                    <span className="text-sm text-muted-foreground">{kr.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Update Message</Label>
              <Textarea
                id="message"
                placeholder="What progress have you made? Any blockers or wins to share?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
                required
                data-testid="input-checkin-message"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Logged by: {userName}</span>
              <span>•</span>
              <span>{formatDateTime(new Date())}</span>
            </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t gap-3 flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !message.trim()} data-testid="button-submit-checkin">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Check-In"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
