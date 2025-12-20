"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Settings, 
  LogOut,
  Target,
  Menu,
  X,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Departments",
    href: "/dashboard/departments",
    icon: Building2,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface SidebarProps {
  onLogout?: () => void
}

function SidebarContent({ onLogout }: Pick<SidebarProps, 'onLogout'>) {
  const pathname = usePathname()
  const [user, setUser] = React.useState<{
    name: string
    email: string
    profilePicture?: string | null
  } | null>(null)

  React.useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        
        // Log to help debug
        console.log("👤 User loaded in sidebar:", parsedUser)
        if (!parsedUser.profilePicture) {
          console.log("⚠️ No profile picture found for user")
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Target className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">PetroGoals</span>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.title.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-3 space-y-3">
        {/* User Profile Section */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              {user.profilePicture ? (
                <AvatarImage 
                  src={user.profilePicture} 
                  alt={user.name}
                  onError={(e) => {
                    // Hide broken image if URL fails to load
                    console.log("Failed to load profile picture:", user.profilePicture)
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-3">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ onLogout }: Pick<SidebarProps, 'onLogout'>) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // Close sidebar when pathname changes on mobile
  React.useEffect(() => {
    if (isMobile) {
      setOpen(false)
    }
  }, [pathname, isMobile])

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4">
          <div className="flex items-center gap-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation sidebar</SheetDescription>
                <SidebarContent onLogout={() => { setOpen(false); onLogout?.() }} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">PetroGoals</span>
            </div>
          </div>
        </div>
        <div className="h-16" />
      </>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-sidebar">
      <SidebarContent onLogout={onLogout} />
    </aside>
  )
}