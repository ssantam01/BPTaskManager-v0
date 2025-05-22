"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function LoginPage() {
  const { login, status } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Por favor, ingresa tu email y contraseña")
      return
    }

    setIsLoading(true)
    try {
      const success = await login(email, password)
      if (!success) {
        setError("Email o contraseña incorrectos")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Error al iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar credenciales de administrador para facilitar el inicio de sesión
  const adminCredentials = {
    email: "simonsantamaria.cv@gmail.com",
    password: "Bianca1905",
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-pulse h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-E0RM1dB7D5pcYtSZRmouIugTH5cLQ0.png"
              alt="BYTE POINT Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <CardTitle>Gestor de Tareas</CardTitle>
          <CardDescription>Inicia sesión para acceder a tus tareas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>

            {/* Mostrar credenciales de administrador */}
            <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm font-medium mb-2">Credenciales de administrador:</p>
              <p className="text-xs">Email: {adminCredentials.email}</p>
              <p className="text-xs">Contraseña: {adminCredentials.password}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  setEmail(adminCredentials.email)
                  setPassword(adminCredentials.password)
                }}
              >
                Usar credenciales de administrador
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
