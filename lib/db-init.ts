import { supabase } from "@/lib/supabase"

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

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

    // Habilitar la extensión uuid-ossp
    const { error: uuidExtError } = await supabase.rpc("extensions", {
      name: "uuid-ossp",
    })

    if (uuidExtError) {
      console.log("Note: uuid-ossp extension might not be available or already enabled")
    }

    // Ejecutar las consultas para crear las tablas
    const { error: usersTableError } = await supabase.rpc("sql_query", {
      query: createUsersTable,
    })

    if (usersTableError) {
      console.error("Error creating users table:", usersTableError)
      // Intentar un enfoque alternativo si el RPC no funciona
      try {
        await fetch("/api/db-init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "create_tables" }),
        })
        console.log("Attempted to create tables via API route")
      } catch (fetchError) {
        console.error("Error calling db-init API:", fetchError)
      }
    } else {
      console.log("Users table created or already exists")
    }

    const { error: tasksTableError } = await supabase.rpc("sql_query", {
      query: createTasksTable,
    })

    if (tasksTableError) {
      console.error("Error creating tasks table:", tasksTableError)
    } else {
      console.log("Tasks table created or already exists")
    }

    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    return false
  }
}

// Función para crear el administrador inicial
export async function createInitialAdmin() {
  try {
    // Verificar si ya existe un administrador
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1)

    if (checkError) {
      // Si hay un error al verificar, podría ser porque la tabla no existe
      console.error("Error checking for existing admin:", checkError)
      return false
    }

    // Si no hay administradores, crear uno
    if (!existingUsers || existingUsers.length === 0) {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            email: "simonsantamaria.cv@gmail.com",
            name: "Administrador",
            password: "Bianca1905",
            role: "admin",
            image: "/placeholder.svg?height=40&width=40",
          },
        ])
        .select()

      if (error) {
        console.error("Error creating initial admin:", error)
        return false
      }

      console.log("Initial admin created successfully")
      return true
    }

    console.log("Admin already exists")
    return true
  } catch (error) {
    console.error("Error in createInitialAdmin:", error)
    return false
  }
}
