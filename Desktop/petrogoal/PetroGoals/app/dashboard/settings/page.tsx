"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { User, Lock, Palette, Loader2, Check, Download, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { store } from "@/lib/store"
import {
  downloadCSV,
  downloadAllDataAsZip,
  exportOKRsToCSV,
  exportKeyResultsToCSV,
  exportCheckInsToCSV,
  exportInitiativesToCSV,
  exportCommentsToCSV,
  exportMilestoneStagesToCSV,
  exportProgressHistoryToCSV
} from "@/lib/export-data"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState(store.getCurrentUser())
  
  // Profile form
  const [name, setName] = React.useState(currentUser?.name || "")
  const [email, setEmail] = React.useState(currentUser?.email || "")
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [profileSaved, setProfileSaved] = React.useState(false)
  
  // Password form
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")
  const [isSavingPassword, setIsSavingPassword] = React.useState(false)
  const [passwordSaved, setPasswordSaved] = React.useState(false)
  
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportComplete, setExportComplete] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const user = store.getCurrentUser()
    if (user) {
      setCurrentUser(user)
      setName(user.name)
      setEmail(user.email)
    }
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileSaved(false)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update in-memory user (demo only)
    if (currentUser) {
      const updatedUser = { ...currentUser, name, email }
      store.setCurrentUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
    }
    
    setIsSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSaved(false)
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }
    
    setIsSavingPassword(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In a real app, this would update the password in the database
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    
    setIsSavingPassword(false)
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 2000)
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    setExportComplete(false)
    
    try {
      downloadAllDataAsZip()
      await new Promise(resolve => setTimeout(resolve, 800))
      setExportComplete(true)
      setTimeout(() => setExportComplete(false), 3000)
    } catch (error) {
      console.error("Export failed:", error)
    }
    
    setIsExporting(false)
  }

  const handleExportSingle = (type: string) => {
    const timestamp = new Date().toISOString().split("T")[0]
    
    switch (type) {
      case "okrs":
        downloadCSV(`okrs_${timestamp}.csv`, exportOKRsToCSV())
        break
      case "key_results":
        downloadCSV(`key_results_${timestamp}.csv`, exportKeyResultsToCSV())
        break
      case "check_ins":
        downloadCSV(`check_ins_${timestamp}.csv`, exportCheckInsToCSV())
        break
      case "initiatives":
        downloadCSV(`initiatives_${timestamp}.csv`, exportInitiativesToCSV())
        break
      case "comments":
        downloadCSV(`comments_${timestamp}.csv`, exportCommentsToCSV())
        break
      case "milestones":
        downloadCSV(`milestone_stages_${timestamp}.csv`, exportMilestoneStagesToCSV())
        break
      case "progress":
        downloadCSV(`progress_history_${timestamp}.csv`, exportProgressHistoryToCSV())
        break
    }
  }

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4 sm:gap-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  data-testid="input-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  data-testid="input-email"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSavingProfile} data-testid="button-save-profile">
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : profileSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
              </div>
              
              {passwordError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {passwordError}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSavingPassword} data-testid="button-change-password">
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : passwordSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Updated
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the look of the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable navy blue dark theme
                  </p>
                </div>
                {mounted && (
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    data-testid="switch-dark-mode"
                  />
                )}
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    theme === "light" ? "border-primary" : "border-transparent"
                  }`}
                  data-testid="button-theme-light"
                >
                  <div className="h-20 rounded bg-white border mb-2" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    theme === "dark" ? "border-primary" : "border-transparent"
                  }`}
                  data-testid="button-theme-dark"
                >
                  <div className="h-20 rounded mb-2" style={{ backgroundColor: "#0a1628" }} />
                  <span className="text-sm font-medium">Dark (Navy Blue)</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Data Backup</CardTitle>
            </div>
            <CardDescription>Export your data as CSV files for backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Download all your OKR data including objectives, key results, check-ins, initiatives, comments, and progress history as CSV files.
              </p>
              <Button
                onClick={handleExportAll}
                disabled={isExporting}
                className="w-full sm:w-auto"
                data-testid="button-export-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : exportComplete ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Export Complete!
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </>
                )}
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Export Individual Files</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("okrs")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  OKRs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("key_results")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Key Results
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("check_ins")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Check-ins
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("initiatives")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Initiatives
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("comments")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Comments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("milestones")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Milestone Stages
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle("progress")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Progress History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
