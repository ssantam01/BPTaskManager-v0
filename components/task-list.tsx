"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, UserCheck, CheckCircle, RefreshCw } from "lucide-react"
import { useTasks } from "@/lib/tasks-context"
import { useAuth } from "@/lib/auth-context"
import type { Task } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TaskListProps {
  tasks: Task[]
  type: "available" | "assigned" | "completed"
}

export function TaskList({ tasks, type }: TaskListProps) {
  const { assignTask, unassignTask, deleteTask, completeTask, reopenTask } = useTasks()
  const { user, users, isAdmin } = useAuth()

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === "available"
          ? "No hay tareas disponibles"
          : type === "assigned"
            ? "No tienes tareas asignadas"
            : "No hay tareas completadas"}
      </div>
    )
  }

  // Ordenar tareas por prioridad (alta > media > baja)
  const priorityOrder = { alta: 0, media: 1, baja: 2 }
  const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "media":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "baja":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Obtener el nombre del usuario asignado a una tarea
  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return null
    const assignedUser = users.find((u) => u.id === userId)
    return assignedUser?.name || "Usuario desconocido"
  }

  // Función para formatear el enlace para mostrar
  const formatLinkForDisplay = (link: string | null): { href: string; text: string } | null => {
    if (!link) return null

    // Si es una URL completa, mostrarla como está
    if (link.match(/^https?:\/\//i)) {
      // Extraer el dominio para mostrar de forma segura
      try {
        const url = new URL(link)
        return {
          href: link,
          text: url.hostname + (url.pathname !== "/" ? url.pathname : ""),
        }
      } catch (e) {
        // Si hay un error al parsear la URL, mostrar el enlace completo
        return { href: link, text: link }
      }
    }

    // Si no tiene protocolo pero parece una URL, añadir https://
    if (link.includes(".")) {
      return {
        href: `https://${link}`,
        text: link,
      }
    }

    // Si no parece una URL, mostrarla tal cual
    return { href: link, text: link }
  }

  // Renderizar el enlace de forma segura
  const renderLink = (task: Task) => {
    if (!task.link) return null

    try {
      const formattedLink = formatLinkForDisplay(task.link)
      if (!formattedLink) return null

      return (
        <a
          href={formattedLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400"
        >
          <ExternalLink className="h-3 w-3" />
          {formattedLink.text}
        </a>
      )
    } catch (error) {
      console.error("Error al renderizar enlace:", error)
      return null
    }
  }

  return (
    <div className="grid gap-4">
      {sortedTasks.map((task) => (
        <Card key={task.id} className={`relative ${task.status === "completada" ? "opacity-80" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                  {task.status === "completada" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      Completada
                    </Badge>
                  )}
                  {task.createdBy === user?.id && (
                    <Badge variant="outline" className="text-xs">
                      Creada por ti
                    </Badge>
                  )}
                  {task.assignedTo && task.assignedTo !== user?.id && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      Asignada a {getAssignedUserName(task.assignedTo)}
                    </Badge>
                  )}
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar tarea</span>
                </Button>
              )}
            </div>
            <CardDescription>{task.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              {renderLink(task)}
              {task.lastAssignedAt && task.assignedTo && (
                <p className="text-xs text-muted-foreground">
                  Asignada hace {formatDistanceToNow(new Date(task.lastAssignedAt), { locale: es, addSuffix: false })}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {type === "available" ? (
              <div className="w-full flex gap-2">
                {isAdmin ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Asignar a...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {users.map((u) => (
                          <DropdownMenuItem
                            key={u.id}
                            onClick={() => assignTask(task.id, u.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={u.image || "/placeholder.svg?height=24&width=24"}
                                  alt={u.name || ""}
                                />
                                <AvatarFallback className="text-xs">{u.name?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <span>{u.name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => assignTask(task.id, user?.id)} size="sm" className="flex-1">
                      Tomar Tarea
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => assignTask(task.id, user?.id)} size="sm" className="w-full">
                    Tomar Tarea
                  </Button>
                )}
              </div>
            ) : type === "assigned" ? (
              <div className="w-full flex gap-2">
                <Button
                  onClick={() => completeTask(task.id)}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar
                </Button>
                <Button onClick={() => unassignTask(task.id)} variant="outline" size="sm" className="flex-1">
                  Liberar
                </Button>
              </div>
            ) : (
              // Tareas completadas
              <Button onClick={() => reopenTask(task.id)} variant="outline" size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reabrir Tarea
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
