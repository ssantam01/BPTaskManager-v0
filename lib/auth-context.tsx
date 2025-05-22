"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import { supabase, type DatabaseUser } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  users: User[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  status: "loading" | "authenticated" | "unauthenticated"
  isAdmin: boolean
  addUser: (user: Omit<User, "id">) => Promise<User | null>
  updateUser: (id: string, userData: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  refreshUsers: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const router = useRouter()

  // Función para convertir DatabaseUser a User
  const convertDatabaseUser = (dbUser: DatabaseUser): User => ({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    password: dbUser.password,
    role: dbUser.role,
    image: dbUser.image || "/placeholder.svg?height=40&width=40",
  })

  // Cargar usuarios desde Supabase
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading users:", error)
        return
      }

      const convertedUsers = data.map(convertDatabaseUser)
      setUsers(convertedUsers)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  // Inicializar la autenticación
  const initializeAuth = async () => {
    try {
      await loadUsers()

      // Verificar si hay una sesión guardada
      const storedUserId = localStorage.getItem("currentUserId")
      if (storedUserId) {
        const { data, error } = await supabase.from("users").select("*").eq("id", storedUserId).single()

        if (data && !error) {
          setUser(convertDatabaseUser(data))
          setStatus("authenticated")
        } else {
          localStorage.removeItem("currentUserId")
          setStatus("unauthenticated")
        }
      } else {
        setStatus("unauthenticated")
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
      setStatus("unauthenticated")
    }
  }

  // Cargar datos al iniciar
  useEffect(() => {
    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single()

      if (data && !error) {
        const convertedUser = convertDatabaseUser(data)
        setUser(convertedUser)
        localStorage.setItem("currentUserId", data.id)
        setStatus("authenticated")
        router.push("/dashboard")
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUserId")
    setStatus("unauthenticated")
    router.push("/login")
  }

  const addUser = async (userData: Omit<User, "id">): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            email: userData.email,
            name: userData.name,
            password: userData.password,
            role: userData.role,
            image: userData.image,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error adding user:", error)
        return null
      }

      const newUser = convertDatabaseUser(data)
      setUsers((prev) => [...prev, newUser])
      return newUser
    } catch (error) {
      console.error("Error adding user:", error)
      return null
    }
  }

  const updateUser = async (id: string, userData: Partial<User>): Promise<void> => {
    try {
      const { error } = await supabase.from("users").update(userData).eq("id", id)

      if (error) {
        console.error("Error updating user:", error)
        return
      }

      // Actualizar el estado local
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...userData } : user)))

      // Si el usuario actualizado es el usuario actual, actualizar también el estado del usuario
      if (user && user.id === id) {
        setUser((prev) => (prev ? { ...prev, ...userData } : prev))
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const deleteUser = async (id: string): Promise<void> => {
    try {
      // No permitir eliminar al usuario actual
      if (user && user.id === id) {
        return
      }

      // No permitir eliminar al último administrador
      const admins = users.filter((u) => u.role === "admin")
      const userToDelete = users.find((u) => u.id === id)
      if (admins.length <= 1 && userToDelete?.role === "admin") {
        return
      }

      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) {
        console.error("Error deleting user:", error)
        return
      }

      setUsers((prev) => prev.filter((user) => user.id !== id))
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const refreshUsers = async (): Promise<void> => {
    await loadUsers()
  }

  const isAdmin = user?.role === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        status,
        isAdmin,
        addUser,
        updateUser,
        deleteUser,
        refreshUsers,
      }}
    >
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
