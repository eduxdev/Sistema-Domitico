'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings as SettingsIcon, Mail, Bell, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
  } | null>(null)
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    email_cooldown_minutes: 15,
    max_emails_per_hour: 4,
    critical_only: false
  })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    // Cargar configuración de notificaciones
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      const data = await response.json()
      if (data.success) {
        setNotificationSettings(data.settings)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }

  const saveNotificationSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Configuración guardada correctamente')
      } else {
        toast.error(data.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      toast.error('Error de conexión')
    } finally {
      setSavingSettings(false)
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
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Las alertas se envían automáticamente a tu email registrado
              </p>
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
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" 
                value={user?.phoneNumber || ''} 
                disabled 
                className="bg-gray-50 dark:bg-gray-800"
                placeholder="No configurado"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Para modificar tu perfil, contacta al administrador del sistema
            </p>
          </CardContent>
        </Card>

        {/* Configuración de Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Notificaciones
            </CardTitle>
            <CardDescription>
              Controla cuándo y cómo recibir alertas por email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuración básica */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Emails habilitados</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recibir notificaciones por email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.email_enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email_enabled: e.target.checked
                  }))}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Solo alertas críticas</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recibir solo alertas de peligro</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.critical_only}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    critical_only: e.target.checked
                  }))}
                  className="h-4 w-4"
                />
              </div>
            </div>

            {/* Configuración de frecuencia */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Label className="text-sm font-medium">Control de Frecuencia</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown" className="text-sm">
                    Tiempo entre emails (minutos)
                  </Label>
                  <Input
                    id="cooldown"
                    type="number"
                    min="5"
                    max="120"
                    value={notificationSettings.email_cooldown_minutes}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      email_cooldown_minutes: parseInt(e.target.value) || 15
                    }))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 5, máximo 120 minutos</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-hour" className="text-sm">
                    Máximo emails por hora
                  </Label>
                  <Input
                    id="max-hour"
                    type="number"
                    min="1"
                    max="10"
                    value={notificationSettings.max_emails_per_hour}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      max_emails_per_hour: parseInt(e.target.value) || 4
                    }))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 1, máximo 10 emails</p>
                </div>
              </div>
            </div>

            {/* Información actual */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Configuración Actual</span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Emails: {notificationSettings.email_enabled ? 'Habilitados' : 'Deshabilitados'}</p>
                <p>• Cooldown: {notificationSettings.email_cooldown_minutes} minutos entre emails</p>
                <p>• Límite: {notificationSettings.max_emails_per_hour} emails máximo por hora</p>
                <p>• Modo: {notificationSettings.critical_only ? 'Solo críticas' : 'Todas las alertas'}</p>
              </div>
            </div>

            <Button 
              onClick={saveNotificationSettings}
              disabled={savingSettings}
              className="w-full"
            >
              {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
