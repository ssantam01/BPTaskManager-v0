"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Task, TaskStatus } from "@/lib/types"
import { supabase, type DatabaseTask } from "@/lib/supabase"

interface TasksContextType {
  availableTasks: Task[]
  assignedTasks: Task[]
  completedTasks: Task[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "status">) => Promise<void>
  assignTask: (taskId: number, userId: string | undefined) => Promise<void>
  unassignTask: (taskId: number) => Promise<void>
  deleteTask: (taskId: number) => Promise<void>
  completeTask: (taskId: number) => Promise<void>
  reopenTask: (taskId: number) => Promise<void>
  clearAssignedTasks: () => Promise<void>
  refreshTasks: () => Promise<void>
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const { user } = useAuth()

  // Función para convertir DatabaseTask a Task
  const convertDatabaseTask = (dbTask: DatabaseTask): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || "",
    link: dbTask.link || null,
    priority: dbTask.priority,
    createdBy: dbTask.created_by,
    assignedTo: dbTask.assigned_to || null,
    createdAt: dbTask.created_at,
    lastAssignedAt: dbTask.last_assigned_at || null,
    status: (dbTask.status as TaskStatus) || "pendiente",
  })

  // Cargar tareas desde Supabase
  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading tasks:", error)
        return
      }

      if (!data) {
        console.log("No tasks found")
        setTasks([])
        return
      }

      const convertedTasks = data.map(convertDatabaseTask)
      setTasks(convertedTasks)
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  }

  // Cargar datos al iniciar
  useEffect(() => {
    loadTasks()
  }, [])

  const availableTasks = tasks.filter((task) => task.assignedTo === null && task.status === "pendiente")
  const assignedTasks = tasks.filter((task) => task.assignedTo !== null && task.status === "pendiente")
  const completedTasks = tasks.filter((task) => task.status === "completada")

  const addTask = async (taskData: Omit<Task, "id" | "createdAt" | "status">): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: taskData.title,
            description: taskData.description,
            link: taskData.link,
            priority: taskData.priority,
            created_by: taskData.createdBy,
            assigned_to: taskData.assignedTo,
            last_assigned_at: taskData.assignedTo ? new Date().toISOString() : null,
            status: "pendiente",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error adding task:", error)
        return
      }

      const newTask = convertDatabaseTask(data)
      setTasks((prev) => [newTask, ...prev])
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const assignTask = async (taskId: number, userId: string | undefined): Promise<void> => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: userId,
          last_assigned_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (error) {
        console.error("Error assigning task:", error)
        return
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, assignedTo: userId, lastAssignedAt: new Date().toISOString() } : task,
        ),
      )
    } catch (error) {
      console.error("Error assigning task:", error)
    }
  }

  const unassignTask = async (taskId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: null,
          last_assigned_at: null,
        })
        .eq("id", taskId)

      if (error) {
        console.error("Error unassigning task:", error)
        return
      }

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, assignedTo: null, lastAssignedAt: null } : task)),
      )
    } catch (error) {
      console.error("Error unassigning task:", error)
    }
  }

  const completeTask = async (taskId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completada",
        })
        .eq("id", taskId)

      if (error) {
        console.error("Error completing task:", error)
        return
      }

      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: "completada" } : task)))
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const reopenTask = async (taskId: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "pendiente",
        })
        .eq("id", taskId)

      if (error) {
        console.error("Error reopening task:", error)
        return
      }

      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: "pendiente" } : task)))
    } catch (error) {
      console.error("Error reopening task:", error)
    }
  }

  const deleteTask = async (taskId: number): Promise<void> => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) {
        console.error("Error deleting task:", error)
        return
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const clearAssignedTasks = async (): Promise<void> => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: null,
          last_assigned_at: null,
        })
        .eq("assigned_to", user.id)
        .eq("status", "pendiente")

      if (error) {
        console.error("Error clearing assigned tasks:", error)
        return
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.assignedTo === user.id && task.status === "pendiente"
            ? { ...task, assignedTo: null, lastAssignedAt: null }
            : task,
        ),
      )
    } catch (error) {
      console.error("Error clearing assigned tasks:", error)
    }
  }

  const refreshTasks = async (): Promise<void> => {
    await loadTasks()
  }

  return (
    <TasksContext.Provider
      value={{
        availableTasks,
        assignedTasks,
        completedTasks,
        addTask,
        assignTask,
        unassignTask,
        deleteTask,
        completeTask,
        reopenTask,
        clearAssignedTasks,
        refreshTasks,
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
