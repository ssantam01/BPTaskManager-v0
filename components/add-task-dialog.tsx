"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTasks } from "@/lib/tasks-context"
import { useAuth } from "@/lib/auth-context"
import type { Priority } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { addTask } = useTasks()
  const { user, users, isAdmin } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [link, setLink] = useState("")
  const [priority, setPriority] = useState<Priority>("media")
  const [assignedTo, setAssignedTo] = useState<string | null>(null)

  // Función para formatear el enlace correctamente
  const formatLink = (link: string): string | null => {
    if (!link || !link.trim()) return null

    // Si ya tiene http:// o https://, dejarlo como está
    if (link.match(/^https?:\/\//i)) {
      return link
    }

    // Si parece una URL sin protocolo (comienza con www. o contiene un punto), añadir https://
    if (link.match(/^www\./i) || link.includes(".")) {
      return `https://${link}`
    }

    // Si no parece una URL, devolverlo tal cual
    return link
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim() || !user?.id) return

    addTask({
      title,
      description,
      link: formatLink(link),
      createdBy: user.id,
      assignedTo: assignedTo, // Puede ser null o el ID de un usuario
      priority,
    })

    // Reset form
    setTitle("")
    setDescription("")
    setLink("")
    setPriority("media")
    setAssignedTo(null)
    onOpenChange(false)
  }

  // Solo los administradores pueden crear tareas
  if (!isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la tarea"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Enlace (opcional)</Label>
              <Input
                id="link"
                type="text" // Cambiado de "url" a "text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="ejemplo.com o https://ejemplo.com"
              />
              {link && !link.match(/^https?:\/\//i) && link.includes(".") && (
                <p className="text-xs text-muted-foreground">Se añadirá "https://" automáticamente al guardar</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <RadioGroup value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="alta" id="alta" />
                  <Label htmlFor="alta" className="text-red-600 dark:text-red-400">
                    Alta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="media" id="media" />
                  <Label htmlFor="media" className="text-yellow-600 dark:text-yellow-400">
                    Media
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="baja" id="baja" />
                  <Label htmlFor="baja" className="text-green-600 dark:text-green-400">
                    Baja
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignTo">Asignar a (opcional)</Label>
              <Select
                value={assignedTo || ""}
                onValueChange={(value) => setAssignedTo(value === "none" ? null : value)}
              >
                <SelectTrigger id="assignTo">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.image || "/placeholder.svg?height=24&width=24"} alt={u.name || ""} />
                          <AvatarFallback className="text-xs">{u.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Agregar Tarea</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
