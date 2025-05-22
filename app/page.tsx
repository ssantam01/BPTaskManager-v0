"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function Home() {
  const { user, status, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    } else if (status === "unauthenticated" && !error) {
      router.push("/login")
    }
  }, [status, router, error])

  // Mostrar un mensaje de error si hay problemas
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              <p className="font-semibold">Error en la aplicación</p>
              <p className="mt-1">{error}</p>
              <p className="mt-4 text-sm">
                Es posible que la base de datos no esté configurada correctamente. Por favor, contacte al administrador.
              </p>
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar un estado de carga mientras se verifica la sesión
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-pulse h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
