"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

// Usuario administrador inicial
const INITIAL_ADMIN: User = {
  id: "admin1",
  name: "Administrador",
  email: "simonsantamaria.cv@gmail.com",
  image: "/placeholder.svg?height=40&width=40",
  role: "admin",
  password: "Bianca1905", // En una aplicación real, esto debería estar hasheado
}

interface AuthContextType {
  user: User | null
  users: User[]
  login: (email: string, password: string) => boolean
  logout: () => void
  status: "loading" | "authenticated" | "unauthenticated"
  isAdmin: boolean
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, userData: Partial<User>) => void
  deleteUser: (id: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([INITIAL_ADMIN])
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const router = useRouter()

  // Cargar usuarios y sesión del localStorage al iniciar
  useEffect(() => {
    const storedUsers = localStorage.getItem("users")
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers))
      } catch (error) {
        console.error("Error parsing stored users:", error)
        // Si hay un error, inicializar con el admin por defecto
        setUsers([INITIAL_ADMIN])
        localStorage.setItem("users", JSON.stringify([INITIAL_ADMIN]))
      }
    } else {
      // Si no hay usuarios guardados, inicializar con el admin por defecto
      localStorage.setItem("users", JSON.stringify([INITIAL_ADMIN]))
    }

    const storedUserId = localStorage.getItem("currentUserId")
    if (storedUserId) {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const foundUser = storedUsers.find((u: User) => u.id === storedUserId)
      if (foundUser) {
        setUser(foundUser)
        setStatus("authenticated")
      } else {
        setStatus("unauthenticated")
      }
    } else {
      setStatus("unauthenticated")
    }
  }, [])

  // Guardar usuarios en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users))
  }, [users])

  const login = (email: string, password: string) => {
    const foundUser = users.find((u) => u.email === email && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("currentUserId", foundUser.id)
      setStatus("authenticated")
      router.push("/dashboard")
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUserId")
    setStatus("unauthenticated")
    router.push("/login")
  }

  const addUser = (userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
    }
    setUsers((prev) => [...prev, newUser])
  }

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return { ...user, ...userData }
        }
        return user
      }),
    )

    // Si el usuario actualizado es el usuario actual, actualizar también el estado del usuario
    if (user && user.id === id) {
      setUser((prev) => (prev ? { ...prev, ...userData } : prev))
    }
  }

  const deleteUser = (id: string) => {
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

    setUsers((prev) => prev.filter((user) => user.id !== id))
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
