"use client"

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

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { addTask } = useTasks()
  const { user, isAdmin } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [link, setLink] = useState("")
  const [priority, setPriority] = useState<Priority>("media")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim() || !user?.id) return

    addTask({
      title,
      description,
      link: link.trim() ? link : null,
      createdBy: user.id,
      assignedTo: null,
      priority,
    })

    // Reset form
    setTitle("")
    setDescription("")
    setLink("")
    setPriority("media")
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
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://ejemplo.com"
              />
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
