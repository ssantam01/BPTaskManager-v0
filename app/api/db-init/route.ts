import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Usar la clave de servicio para tener permisos completos
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await request.json()

    if (body.action === "create_tables") {
      // Crear tabla de usuarios si no existe
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          image TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Crear tabla de tareas si no existe
      const createTasksTable = `
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          link TEXT,
          priority TEXT NOT NULL,
          created_by UUID REFERENCES users(id),
          assigned_to UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_assigned_at TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'pendiente'
        );
      `

      // Ejecutar las consultas SQL directamente
      const { error: usersError } = await supabase.rpc("sql_query", { query: createUsersTable })
      if (usersError) {
        console.error("Error creating users table:", usersError)
        return NextResponse.json({ success: false, error: usersError }, { status: 500 })
      }

      const { error: tasksError } = await supabase.rpc("sql_query", { query: createTasksTable })
      if (tasksError) {
        console.error("Error creating tasks table:", tasksError)
        return NextResponse.json({ success: false, error: tasksError }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Tables created successfully" })
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in db-init API:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
