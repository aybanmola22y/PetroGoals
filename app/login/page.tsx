//app\login\page.tsx

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Target, Mail, Lock, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoadingScreen } from "@/components/loading-screen"
import { store } from "@/lib/store"
import { isConnected, supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = React.useState(false)
  const [supabaseConnected, setSupabaseConnected] = React.useState<boolean | null>(null)
  const [storeInitialized, setStoreInitialized] = React.useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = React.useState(false)
React.useEffect(() => {
  const handleOAuthCallback = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (accessToken) {
      console.log("🔐 OAuth tokens found in URL, processing...")
      
      if (!supabase) {
        console.error("❌ Supabase not configured")
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error("❌ Failed to set session:", error)
          setError("Authentication failed. Please try again.")
          window.history.replaceState(null, '', window.location.pathname)
          return
        }

        if (session) {
          console.log("✅ Session established:", session.user)
          
          const user = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || 
                  session.user.user_metadata?.name ||
                  session.user.email?.split("@")[0] || "User",
            profilePicture: session.user.user_metadata?.avatar_url || 
                           session.user.user_metadata?.picture || null,
          }

          localStorage.setItem("user", JSON.stringify(user))
          document.cookie = `auth_token=${JSON.stringify(user)}; path=/; max-age=${7 * 24 * 60 * 60}`
          
          await store.initialize()
          
          console.log("✅ User authenticated, redirecting to dashboard...")
          window.history.replaceState(null, '', window.location.pathname)
          
          setShowLoadingScreen(true)
          setTimeout(() => router.push("/dashboard"), 500)
        }
      } catch (err) {
        console.error("❌ Error processing OAuth callback:", err)
        setError("Authentication failed. Please try again.")
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }

  handleOAuthCallback()
}, [router])

  React.useEffect(() => {
  if (!supabase) return

  // Check if user is already logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      router.push("/dashboard")
    }
  })

  // Listen for auth changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      router.push("/dashboard")
    }
  })

  return () => subscription.unsubscribe()
}, [router])


  React.useEffect(() => {
  console.group("🧪 Login Page Init")
  console.log("Supabase connected:", isConnected())
  console.log("Supabase client:", supabase)
  console.groupEnd()

  setSupabaseConnected(isConnected())
  store.initialize().then(() => {
    setStoreInitialized(true)
  })
}, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const user = await store.login(email, password)
    
    if (user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
        // Set auth token in cookie for server-side authentication
        document.cookie = `auth_token=${JSON.stringify(user)}; path=/; max-age=${7 * 24 * 60 * 60}`
      }
      setShowLoadingScreen(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
      return
    } else {
      if (!supabaseConnected) {
        setError("Invalid demo credentials. Use demo@petro-okr.com / demo123")
      } else {
        setError("Invalid email or password")
      }
    }
    
    setIsLoading(false)
  }


const handleMicrosoftLogin = async () => {
  setIsMicrosoftLoading(true)
  setError("")

  if (!supabase) {
    setError("Supabase is not configured. Microsoft login is unavailable.")
    setIsMicrosoftLoading(false)
    return
  }

  try {
    console.log("🔐 Starting Microsoft OAuth login")
    
    // Supabase will redirect back to login page with tokens in URL hash
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/login`,
        scopes: "email profile openid",
      },
    })

    if (error) {
      console.error("❌ OAuth error:", error)
      setError(error.message)
      setIsMicrosoftLoading(false)
      return
    }

    console.log("✅ OAuth initiated successfully, redirecting to Microsoft...")
    // Browser will redirect to Microsoft, then back through Supabase, then to dashboard
  } catch (err: any) {
    console.error("❌ Unexpected error:", err)
    setError(err.message || "An unexpected error occurred")
    setIsMicrosoftLoading(false)
  }
}
  if (showLoadingScreen) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4 safe-area-inset">
        <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">PetroGoals</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track objectives and key results across your organization
          </p>
        </div>

        {supabaseConnected === false && (
          <Card className="mb-4 border-blue-500/50 bg-blue-500/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-600">Demo Mode Active</p>
                  <p className="text-muted-foreground mt-1">
                    Use demo credentials to explore the app:
                  </p>
                  <div className="mt-2 p-2 bg-muted rounded font-mono text-xs">
                    <div>Email: <span className="text-foreground">demo@petro-okr.com</span></div>
                    <div>Password: <span className="text-foreground">demo123</span></div>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    To connect to your own database, configure Supabase credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleMicrosoftLogin}
              disabled={isMicrosoftLoading || isLoading}
              data-testid="button-microsoft-login"
            >
              {isMicrosoftLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
              )}       
              Sign in with Microsoft
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" data-testid="text-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isMicrosoftLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {supabaseConnected === true && (
              <div className="mt-4 p-3 rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Sign in with your credentials to access the OKR dashboard.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
