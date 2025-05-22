"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User } from "@/lib/types"

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth()
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Estados para el formulario
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setIsAdmin(false)
    setError("")
  }

  const handleOpenAddUser = () => {
    resetForm()
    setIsAddUserOpen(true)
  }

  const handleOpenEditUser = (user: User) => {
    setName(user.name || "")
    setEmail(user.email || "")
    setPassword("") // No mostrar la contraseña actual por seguridad
    setIsAdmin(user.role === "admin")
    setEditingUser(user)
    setError("")
  }

  const handleAddUser = async () => {
    if (!name || !email || !password) {
      setError("Todos los campos son obligatorios")
      return
    }

    // Verificar si el email ya existe
    if (users.some((u) => u.email === email)) {
      setError("Ya existe un usuario con ese email")
      return
    }

    setIsLoading(true)
    try {
      const newUser = await addUser({
        name,
        email,
        password,
        role: isAdmin ? "admin" : "user",
        image: "/placeholder.svg?height=40&width=40",
      })

      if (newUser) {
        console.log("Usuario añadido correctamente:", newUser)
        resetForm()
        setIsAddUserOpen(false)
      } else {
        setError("Error al crear el usuario. Inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error al añadir usuario:", error)
      setError("Error al crear el usuario. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    if (!name || !email) {
      setError("Nombre y email son obligatorios")
      return
    }

    // Verificar si el email ya existe (excepto para el usuario actual)
    if (users.some((u) => u.email === email && u.id !== editingUser.id)) {
      setError("Ya existe un usuario con ese email")
      return
    }

    setIsLoading(true)
    try {
      const updates: Partial<User> = {
        name,
        email,
        role: isAdmin ? "admin" : "user",
      }

      // Solo actualizar la contraseña si se proporciona una nueva
      if (password) {
        updates.password = password
      }

      await updateUser(editingUser.id, updates)
      setEditingUser(null)
      resetForm()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      setError("Error al actualizar el usuario. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true)
    try {
      await deleteUser(userId)
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
        <Button onClick={handleOpenAddUser} disabled={isLoading}>
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.image || "/placeholder.svg?height=40&width=40"}
                      alt={user.name || "Usuario"}
                    />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{user.name}</CardTitle>
                    <CardDescription className="text-xs">{user.email}</CardDescription>
                  </div>
                </div>
                {user.id !== currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar usuario</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Rol: <span className="font-medium">{user.role === "admin" ? "Administrador" : "Usuario"}</span>
                </span>
                <Button variant="outline" size="sm" onClick={() => handleOpenEditUser(user)} disabled={isLoading}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
            {user.id === currentUser?.id && (
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">Este es tu usuario actual</p>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {/* Diálogo para agregar usuario */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>Crea un nuevo usuario para el sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is-admin" checked={isAdmin} onCheckedChange={setIsAdmin} disabled={isLoading} />
              <Label htmlFor="is-admin">Es administrador</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? "Agregando..." : "Agregar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar usuario */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Nueva Contraseña (dejar en blanco para mantener la actual)</Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-is-admin" checked={isAdmin} onCheckedChange={setIsAdmin} disabled={isLoading} />
              <Label htmlFor="edit-is-admin">Es administrador</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
