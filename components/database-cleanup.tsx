"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle } from "lucide-react"
import { checkAndPerformCleanup } from "@/lib/database-cleanup"
import { useAuth } from "@/lib/auth-context"
import { useTasks } from "@/lib/tasks-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function DatabaseCleanup() {
  const { isAdmin, refreshUsers } = useAuth()
  const { refreshTasks } = useTasks()
  const [nextCleanup, setNextCleanup] = useState<Date | null>(null)
  const [daysRemaining, setDaysRemaining] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [cleanupStatus, setCleanupStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    const checkCleanupStatus = async () => {
      const status = await checkAndPerformCleanup()
      setNextCleanup(status.nextCleanupDate)
      setDaysRemaining(status.daysRemaining)
    }

    checkCleanupStatus()
  }, [])

  const handleForceCleanup = async () => {
    setShowConfirmDialog(false)
    setIsLoading(true)
    setCleanupStatus("idle")

    try {
      const result = await checkAndPerformCleanup(true)
      setNextCleanup(result.nextCleanupDate)
      setDaysRemaining(result.daysRemaining)

      // Refrescar los datos después de la limpieza
      await refreshUsers()
      await refreshTasks()

      setCleanupStatus("success")
    } catch (error) {
      console.error("Error forcing cleanup:", error)
      setCleanupStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Limpieza de la Base de Datos</CardTitle>
          <CardDescription>
            La base de datos se limpia automáticamente cada 20 días para mantener el rendimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nextCleanup && (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Próxima limpieza programada:</span>{" "}
                {nextCleanup.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm">
                <span className="font-medium">Días restantes:</span> {daysRemaining}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                La limpieza elimina todas las tareas y usuarios, excepto el administrador principal.
              </p>
            </div>
          )}

          {cleanupStatus === "success" && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
              <AlertDescription>Limpieza completada con éxito.</AlertDescription>
            </Alert>
          )}

          {cleanupStatus === "error" && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>Error al realizar la limpieza. Inténtalo de nuevo.</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => setShowConfirmDialog(true)} disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Forzar limpieza ahora
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar limpieza de la base de datos</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todas las tareas y usuarios (excepto el administrador principal). Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Todos los datos serán eliminados permanentemente. ¿Estás seguro de que deseas continuar?
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleForceCleanup} disabled={isLoading}>
              {isLoading ? "Limpiando..." : "Sí, eliminar todos los datos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
