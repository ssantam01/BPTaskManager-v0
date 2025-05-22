"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useTasks } from "@/lib/tasks-context"
import { TaskList } from "@/components/task-list"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Plus, Moon, Sun, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/user-management"
import Image from "next/image"

export default function DashboardPage() {
  const { user, logout, status, isAdmin } = useAuth()
  const { availableTasks, assignedTasks, clearAssignedTasks } = useTasks()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("tareas")

  // Evitar problemas de hidratación con el tema
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-pulse h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userTasks = assignedTasks.filter((t) => t.assignedTo === user.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-E0RM1dB7D5pcYtSZRmouIugTH5cLQ0.png"
                alt="BYTE POINT Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold">Gestor de Tareas</h1>
          </div>
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-full"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span className="sr-only">Cambiar tema</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} alt={user.name || "Usuario"} />
                <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium">{user.name || "Usuario"}</span>
                {isAdmin && <span className="text-xs block text-muted-foreground">Administrador</span>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="tareas">Tareas</TabsTrigger>
              <TabsTrigger value="usuarios">Gestión de Usuarios</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {activeTab === "tareas" ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Tareas Disponibles</h2>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Tarea
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-md font-medium mb-4">Tareas Disponibles ({availableTasks.length})</h3>
                <TaskList tasks={availableTasks} type="available" />
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Mis Tareas Asignadas ({userTasks.length})</h3>
                  {userTasks.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={clearAssignedTasks}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Liberar todas
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Liberar todas mis tareas asignadas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <TaskList tasks={userTasks} type="assigned" />
                <div className="mt-4 text-xs text-muted-foreground">
                  Nota: Las tareas asignadas se liberarán automáticamente después de 24 horas.
                </div>
              </div>
            </div>
          </>
        ) : (
          <UserManagement />
        )}
      </main>

      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  )
}
