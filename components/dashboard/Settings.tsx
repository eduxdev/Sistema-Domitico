'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Mail, TestTube } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
  } | null>(null)
  const [testingEmail, setTestingEmail] = useState(false)

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const testEmail = async (tipo: 'prueba' | 'alerta') => {
    setTestingEmail(true)
    try {
      const response = await fetch(`/api/alerts/email?tipo=${tipo}`, {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Email de ${tipo} enviado exitosamente`, {
          description: `Se envió a ${user?.email || 'tu email'}`
        })
      } else {
        toast.error(`Error enviando email de ${tipo}`, {
          description: data.error
        })
      }
    } catch {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      })
    } finally {
      setTestingEmail(false)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configuración</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificaciones por Email
            </CardTitle>
            <CardDescription>
              Configura y prueba las alertas por correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email de destino</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Las alertas se envían automáticamente a tu email registrado
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Probar notificaciones</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => testEmail('prueba')}
                  disabled={testingEmail}
                  className="flex-1"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Email de Prueba
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => testEmail('alerta')}
                  disabled={testingEmail}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Simular Alerta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Gestiona tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                value={user?.fullName || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" 
                value={user?.phoneNumber || ''} 
                disabled 
                className="bg-gray-50"
                placeholder="No configurado"
              />
            </div>
            <p className="text-xs text-gray-500">
              Para modificar tu perfil, contacta al administrador del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>
              Configuración de seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input type="password" id="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input type="password" id="new-password" />
            </div>
            <Button className="w-full">Cambiar Contraseña</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistema</CardTitle>
            <CardDescription>
              Configuración general del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Input id="language" defaultValue="Español" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Input id="timezone" defaultValue="Europe/Madrid" />
            </div>
            <Button className="w-full">Guardar Preferencias</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
