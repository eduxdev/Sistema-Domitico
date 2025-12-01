'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Plus, 
  Wifi, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AvailableDevice {
  id: string
  device_id: string
  nombre: string
  tipo: string
  mac_address?: string
  ip_address?: string
  created_at: string
}

interface ClaimForm {
  nickname: string
  ubicacion: string
}

export default function ClaimDevices() {
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claimForms, setClaimForms] = useState<Record<string, ClaimForm>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchAvailableDevices()
  }, [])

  const fetchAvailableDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/devices/available')
      const data = await response.json()
      
      if (data.success) {
        setAvailableDevices(data.devices)
        setError(null)
        // Inicializar formularios
        const forms: Record<string, ClaimForm> = {}
        data.devices.forEach((device: AvailableDevice) => {
          forms[device.device_id] = {
            nickname: device.nombre,
            ubicacion: ''
          }
        })
        setClaimForms(forms)
      } else {
        setError(data.error || 'Error al cargar dispositivos')
      }
    } catch (error) {
      console.error('Error fetching available devices:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimDevice = async (deviceId: string) => {
    const form = claimForms[deviceId]
    if (!form.nickname.trim()) {
      toast({
        title: "Error",
        description: "El nombre del dispositivo es requerido",
        variant: "destructive"
      })
      return
    }

    try {
      setClaiming(deviceId)
      const response = await fetch('/api/devices/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId,
          nickname: form.nickname.trim(),
          ubicacion: form.ubicacion.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "¡Dispositivo reclamado!",
          description: `${form.nickname} ha sido agregado a tus dispositivos`,
        })
        // Actualizar lista de dispositivos disponibles
        fetchAvailableDevices()
      } else {
        toast({
          title: "Error al reclamar",
          description: data.error || 'No se pudo reclamar el dispositivo',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error claiming device:', error)
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      })
    } finally {
      setClaiming(null)
    }
  }

  const updateClaimForm = (deviceId: string, field: keyof ClaimForm, value: string) => {
    setClaimForms(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Reclamar Dispositivo</h2>
          <p className="text-gray-500">Dispositivos disponibles para reclamar</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Reclamar Dispositivo</h2>
          <p className="text-gray-500">Dispositivos disponibles para reclamar</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAvailableDevices} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reclamar Dispositivo</h2>
          <p className="text-gray-500">
            Dispositivos disponibles para reclamar ({availableDevices.length})
          </p>
        </div>
        <Button 
          onClick={fetchAvailableDevices} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {availableDevices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No hay dispositivos disponibles
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Todos los dispositivos registrados ya han sido reclamados o no hay dispositivos conectados.
            </p>
            <Button onClick={fetchAvailableDevices} variant="outline">
              Verificar nuevamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableDevices.map((device) => (
            <Card key={device.device_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    {device.nombre}
                  </CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Disponible
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 font-mono">{device.device_id}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información del dispositivo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Tipo:</span>
                    <span className="capitalize">{device.tipo.replace('_', ' ')}</span>
                  </div>
                  {device.ip_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-xs">{device.ip_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Registrado: {new Date(device.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>

                {/* Formulario de reclamación */}
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label htmlFor={`nickname-${device.device_id}`} className="text-sm font-medium">
                      Nombre del dispositivo *
                    </Label>
                    <Input
                      id={`nickname-${device.device_id}`}
                      placeholder="Ej: Sensor Cocina"
                      value={claimForms[device.device_id]?.nickname || ''}
                      onChange={(e) => updateClaimForm(device.device_id, 'nickname', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`ubicacion-${device.device_id}`} className="text-sm font-medium">
                      Ubicación (opcional)
                    </Label>
                    <Input
                      id={`ubicacion-${device.device_id}`}
                      placeholder="Ej: Cocina, Sala, Garaje"
                      value={claimForms[device.device_id]?.ubicacion || ''}
                      onChange={(e) => updateClaimForm(device.device_id, 'ubicacion', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={() => handleClaimDevice(device.device_id)}
                    disabled={claiming === device.device_id || !claimForms[device.device_id]?.nickname?.trim()}
                    className="w-full"
                  >
                    {claiming === device.device_id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Reclamando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Reclamar Dispositivo
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
