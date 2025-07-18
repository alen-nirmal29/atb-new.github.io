"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth } from "@/lib/auth"
import { User } from "@/types"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: User) => void
  logout: () => void
  verifyToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter();
  const pathname = usePathname();

  const verifyToken = async (): Promise<boolean> => {
    try {
      const tokens = auth.getTokens()
      if (!tokens?.access) {
        console.log("No access token found")
        return false
      }

      console.log("Verifying token...")

      // Try to refresh token if needed
      try {
        const newTokens = await auth.refreshToken()
        if (newTokens) {
          console.log("Token refreshed successfully")
        }
      } catch (error) {
        console.error("Token refresh failed:", error)
        // Token refresh failed, user needs to login again
        auth.logout()
        return false
      }

      const currentUser = auth.getUser()
      if (currentUser) {
        console.log("User found:", currentUser)
        setUser(currentUser)
        setIsAuthenticated(true)
        return true
      }

      console.log("No user found in storage")
      return false
    } catch (error) {
      console.error("Token verification error:", error)
      auth.logout()
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    verifyToken()
  }, [])

  // Redirect to dashboard after successful authentication
  useEffect(() => {
    if (isAuthenticated && user && pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, pathname, router]);

  const login = (userData: User) => {
    console.log("AuthContext: login called with userData:", userData)
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem("isAuthenticated", "true")
    console.log("AuthContext: Authentication state updated")
  }

  const logout = () => {
    auth.logout()
    setUser(null)
    setIsAuthenticated(false)
    // Redirect logic should be handled by the UI components (e.g., in a protected route)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
