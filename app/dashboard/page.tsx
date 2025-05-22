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
import { DatabaseCleanup } from "@/components/database-cleanup"
import Image from "next/image"

export default function DashboardPage() {
  const { user, logout, status, isAdmin } = useAuth()
  const { availableTasks, assignedTasks, completedTasks, clearAssignedTasks } = useTasks()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("tareas")
  const [tasksView, setTasksView] = useState<"mis-tareas" | "todas-tareas">("mis-tareas")
  const [showCompleted, setShowCompleted] = useState(false)

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

  const userAssignedTasks = assignedTasks.filter((t) => t.assignedTo === user.id)
  const userCompletedTasks = completedTasks.filter((t) => t.assignedTo === user.id || t.createdBy === user.id)

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
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {activeTab === "tareas" ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Tareas</h2>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Tarea
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-md font-medium mb-4">Tareas Disponibles ({availableTasks.length})</h3>
                <TaskList tasks={availableTasks} type="available" />
              </div>

              <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  {isAdmin && (
                    <Tabs
                      value={tasksView}
                      onValueChange={(v) => setTasksView(v as "mis-tareas" | "todas-tareas")}
                      className="mb-4"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="mis-tareas" className="flex-1">
                          Mis Tareas
                        </TabsTrigger>
                        <TabsTrigger value="todas-tareas" className="flex-1">
                          Todas las Asignadas
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {tasksView === "mis-tareas" || !isAdmin ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-medium">Mis Tareas Asignadas ({userAssignedTasks.length})</h3>
                        {userAssignedTasks.length > 0 && (
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
                      <TaskList tasks={userAssignedTasks} type="assigned" />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-medium">Todas las Tareas Asignadas ({assignedTasks.length})</h3>
                      </div>
                      <TaskList tasks={assignedTasks} type="assigned" />
                    </>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">
                      Tareas Completadas (
                      {tasksView === "mis-tareas" || !isAdmin ? userCompletedTasks.length : completedTasks.length})
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => setShowCompleted(!showCompleted)}>
                      {showCompleted ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>

                  {showCompleted && (
                    <TaskList
                      tasks={tasksView === "mis-tareas" || !isAdmin ? userCompletedTasks : completedTasks}
                      type="completed"
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "usuarios" ? (
          <UserManagement />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DatabaseCleanup />
          </div>
        )}
      </main>

      <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  )
}
