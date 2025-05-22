import { createClient } from "@supabase/supabase-js"
import type { Priority, TaskStatus } from "@/lib/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface DatabaseUser {
  id: string
  email: string
  name: string
  password: string
  role: "user" | "admin"
  image?: string
  created_at: string
}

export interface DatabaseTask {
  id: number
  title: string
  description?: string
  link?: string
  priority: Priority
  created_by: string
  assigned_to?: string
  created_at: string
  last_assigned_at?: string
  status?: TaskStatus
}
