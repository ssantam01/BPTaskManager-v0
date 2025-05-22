export type Priority = "baja" | "media" | "alta"

export interface Task {
  id: number
  title: string
  description: string
  link: string | null
  createdBy: string
  assignedTo: string | null
  createdAt: string
  priority: Priority
  lastAssignedAt?: string | null
}

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: "user" | "admin"
  password: string
}
