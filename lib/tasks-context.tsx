"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Task } from "@/lib/types"

interface TasksContextType {
  availableTasks: Task[]
  assignedTasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt">) => void
  assignTask: (taskId: number, userId: string | undefined) => void
  unassignTask: (taskId: number) => void
  deleteTask: (taskId: number) => void
  clearAssignedTasks: () => void
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

const TASK_CLEANUP_KEY = "taskCleanupTimestamp"

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const { user } = useAuth()

  // Cargar tareas del localStorage al iniciar
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks")
    if (storedTasks) {
      try {
        // Convertir tareas antiguas al nuevo formato si es necesario
        const parsedTasks = JSON.parse(storedTasks)
        const updatedTasks = parsedTasks.map((task: any) => ({
          ...task,
          priority: task.priority || "media", // Valor por defecto para tareas antiguas
          lastAssignedAt: task.lastAssignedAt || (task.assignedTo ? new Date().toISOString() : null),
        }))
        setTasks(updatedTasks)
      } catch (error) {
        console.error("Error parsing stored tasks:", error)
        localStorage.removeItem("tasks")
      }
    } else {
      // Tareas de ejemplo si no hay ninguna guardada
      const exampleTasks: Task[] = [
        {
          id: 1,
          title: "Actualizar documentación del proyecto",
          description: "Revisar y actualizar la documentación técnica del proyecto principal",
          link: "https://docs.google.com/document/example",
          createdBy: "admin1",
          assignedTo: null,
          createdAt: new Date().toISOString(),
          priority: "alta",
        },
        {
          id: 2,
          title: "Corregir errores en el formulario de contacto",
          description: "El formulario no valida correctamente los campos de email y teléfono",
          link: "https://github.com/example/repo/issues/123",
          createdBy: "user1",
          assignedTo: null,
          createdAt: new Date().toISOString(),
          priority: "media",
        },
        {
          id: 3,
          title: "Diseñar nueva página de inicio",
          description: "Crear mockups para la nueva página de inicio según los requisitos del cliente",
          link: "https://figma.com/file/example",
          createdBy: "user2",
          assignedTo: null,
          createdAt: new Date().toISOString(),
          priority: "baja",
        },
      ]
      setTasks(exampleTasks)
      localStorage.setItem("tasks", JSON.stringify(exampleTasks))
    }
  }, [])

  // Verificar si han pasado 24 horas desde la última limpieza
  useEffect(() => {
    if (!user?.id) return

    const checkAndCleanTasks = () => {
      const lastCleanup = localStorage.getItem(`${TASK_CLEANUP_KEY}_${user.id}`)
      const now = new Date().getTime()

      if (!lastCleanup) {
        // Primera vez, solo guardar el timestamp
        localStorage.setItem(`${TASK_CLEANUP_KEY}_${user.id}`, now.toString())
        return
      }

      const lastCleanupTime = Number.parseInt(lastCleanup)
      const hoursPassed = (now - lastCleanupTime) / (1000 * 60 * 60)

      if (hoursPassed >= 24) {
        // Han pasado 24 horas, limpiar tareas asignadas a este usuario
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.assignedTo === user.id ? { ...task, assignedTo: null } : task)),
        )
        localStorage.setItem(`${TASK_CLEANUP_KEY}_${user.id}`, now.toString())
      }
    }

    checkAndCleanTasks()
    // Verificar cada hora si han pasado 24 horas desde la última limpieza
    const interval = setInterval(checkAndCleanTasks, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [user?.id])

  // Guardar tareas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  const availableTasks = tasks.filter((task) => task.assignedTo === null)
  const assignedTasks = tasks.filter((task) => task.assignedTo !== null)

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, newTask])
  }

  const assignTask = (taskId: number, userId: string | undefined) => {
    if (!userId) return

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, assignedTo: userId, lastAssignedAt: new Date().toISOString() } : task,
      ),
    )
  }

  const unassignTask = (taskId: number) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, assignedTo: null } : task)))
  }

  const deleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const clearAssignedTasks = () => {
    if (!user?.id) return

    setTasks((prev) => prev.map((task) => (task.assignedTo === user.id ? { ...task, assignedTo: null } : task)))
    // Actualizar el timestamp de limpieza
    localStorage.setItem(`${TASK_CLEANUP_KEY}_${user.id}`, new Date().getTime().toString())
  }

  return (
    <TasksContext.Provider
      value={{
        availableTasks,
        assignedTasks,
        addTask,
        assignTask,
        unassignTask,
        deleteTask,
        clearAssignedTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider")
  }
  return context
}
