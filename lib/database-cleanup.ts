import { supabase } from "@/lib/supabase"

// Clave para almacenar la fecha de la última limpieza
const LAST_CLEANUP_KEY = "last_database_cleanup"
const CLEANUP_INTERVAL_DAYS = 20

// Función para verificar si es necesario realizar la limpieza
export async function checkAndPerformCleanup(forceCleanup = false): Promise<{
  cleaned: boolean
  nextCleanupDate: Date
  daysRemaining: number
}> {
  try {
    // Obtener la fecha de la última limpieza
    const lastCleanupStr = localStorage.getItem(LAST_CLEANUP_KEY)
    const now = new Date()
    let lastCleanup: Date

    if (lastCleanupStr) {
      lastCleanup = new Date(lastCleanupStr)
    } else {
      // Si no hay registro, establecer la fecha actual como la última limpieza
      lastCleanup = now
      localStorage.setItem(LAST_CLEANUP_KEY, now.toISOString())
    }

    // Calcular la próxima fecha de limpieza
    const nextCleanupDate = new Date(lastCleanup)
    nextCleanupDate.setDate(nextCleanupDate.getDate() + CLEANUP_INTERVAL_DAYS)

    // Calcular días restantes
    const daysRemaining = Math.ceil((nextCleanupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Verificar si es necesario realizar la limpieza
    if (forceCleanup || now >= nextCleanupDate) {
      await performDatabaseCleanup()

      // Actualizar la fecha de la última limpieza
      localStorage.setItem(LAST_CLEANUP_KEY, now.toISOString())

      // Calcular la nueva próxima fecha de limpieza
      const newNextCleanupDate = new Date(now)
      newNextCleanupDate.setDate(newNextCleanupDate.getDate() + CLEANUP_INTERVAL_DAYS)

      return {
        cleaned: true,
        nextCleanupDate: newNextCleanupDate,
        daysRemaining: CLEANUP_INTERVAL_DAYS,
      }
    }

    return {
      cleaned: false,
      nextCleanupDate,
      daysRemaining,
    }
  } catch (error) {
    console.error("Error checking cleanup status:", error)
    return {
      cleaned: false,
      nextCleanupDate: new Date(Date.now() + CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
      daysRemaining: CLEANUP_INTERVAL_DAYS,
    }
  }
}

// Función para realizar la limpieza de la base de datos
async function performDatabaseCleanup(): Promise<void> {
  try {
    // 1. Obtener el ID del usuario administrador principal
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", "simonsantamaria.cv@gmail.com")
      .single()

    if (!adminUser) {
      console.error("No se encontró el usuario administrador principal")
      return
    }

    const adminId = adminUser.id

    // 2. Eliminar todas las tareas
    await supabase.from("tasks").delete().neq("id", 0) // Eliminar todas las tareas

    // 3. Eliminar todos los usuarios excepto el administrador principal
    await supabase.from("users").delete().neq("id", adminId)

    console.log("Limpieza de la base de datos completada con éxito")
  } catch (error) {
    console.error("Error durante la limpieza de la base de datos:", error)
    throw error
  }
}
