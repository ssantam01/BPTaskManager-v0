"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2 } from "lucide-react"
import { useTasks } from "@/lib/tasks-context"
import { useAuth } from "@/lib/auth-context"
import type { Task } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface TaskListProps {
  tasks: Task[]
  type: "available" | "assigned"
}

export function TaskList({ tasks, type }: TaskListProps) {
  const { assignTask, unassignTask, deleteTask } = useTasks()
  const { user, isAdmin } = useAuth()

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === "available" ? "No hay tareas disponibles" : "No tienes tareas asignadas"}
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

  return (
    <div className="grid gap-4">
      {sortedTasks.map((task) => (
        <Card key={task.id} className="relative">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                  {task.createdBy === user?.id && (
                    <Badge variant="outline" className="text-xs">
                      Creada por ti
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
              {task.link && (
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  Enlace
                </a>
              )}
              {task.lastAssignedAt && task.assignedTo && (
                <p className="text-xs text-muted-foreground">
                  Asignada hace {formatDistanceToNow(new Date(task.lastAssignedAt), { locale: es, addSuffix: false })}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {type === "available" ? (
              <Button onClick={() => assignTask(task.id, user?.id)} size="sm" className="w-full">
                Tomar Tarea
              </Button>
            ) : (
              <Button onClick={() => unassignTask(task.id)} variant="outline" size="sm" className="w-full">
                Liberar Tarea
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
