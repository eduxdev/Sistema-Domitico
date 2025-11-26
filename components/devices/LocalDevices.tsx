'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface LocalDevice {
  deviceId: string
  deviceName: string
  ipAddress: string
  macAddress: string
  deviceType: string
  lastSeen: string
  canClaim: boolean
  ownedByUser?: boolean
}

export default function LocalDevices() {
  const [devices, setDevices] = useState<LocalDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [claimingDevice, setClaimingDevice] = useState<string | null>(null)

  const discoverDevices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/devices/discover')
      const result = await response.json()
      
      if (result.success) {
        // Solo mostrar dispositivos que se pueden reclamar
        const availableDevices = result.devices.filter((d: LocalDevice) => d.canClaim)
        setDevices(availableDevices)
      }
    } catch (error) {
      console.error('Error descubriendo dispositivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimDevice = async (deviceId: string, nickname: string, location: string) => {
    setClaimingDevice(deviceId)
    try {
      const response = await fetch('/api/devices/claim-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, nickname, location })
      })

      const result = await response.json()
      
      if (result.success) {
        // Actualizar la lista
        discoverDevices()
        toast.success('¡Dispositivo reclamado exitosamente!', {
          description: 'El dispositivo ahora aparece en "Mis Dispositivos"'
        })
      } else {
        toast.error('Error al reclamar dispositivo', {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Error reclamando dispositivo:', error)
      toast.error('Error reclamando dispositivo', {
        description: 'Por favor intenta nuevamente'
      })
    } finally {
      setClaimingDevice(null)
    }
  }

  useEffect(() => {
    discoverDevices()
    // Actualizar cada 30 segundos
    const interval = setInterval(discoverDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Dispositivos Disponibles</h2>
          {devices.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
              {devices.length}
            </span>
          )}
        </div>
        <Button onClick={discoverDevices} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar Dispositivos'}
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              No se encontraron dispositivos activos en los últimos 10 minutos.
              <br />
              Asegúrate de que tu ESP32 esté encendido y conectado a WiFi.
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>El sistema busca dispositivos que hayan reportado actividad recientemente.</p>
              <p>Tu ESP32 debe estar ejecutando el código y enviando datos a Supabase.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.deviceId}
              device={device}
              onClaim={claimDevice}
              claiming={claimingDevice === device.deviceId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para dispositivos disponibles para reclamar
function DeviceCard({ device, onClaim, claiming }: {
  device: LocalDevice
  onClaim: (deviceId: string, nickname: string, location: string) => void
  claiming: boolean
}) {
  const [nickname, setNickname] = useState(device.deviceName)
  const [location, setLocation] = useState('')

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="text-sm">{device.deviceName}</span>
          <Badge variant="outline">Disponible</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-500 space-y-1">
          <div>IP: {device.ipAddress}</div>
          <div>MAC: {device.macAddress}</div>
          <div>Tipo: {device.deviceType}</div>
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Nombre personalizado"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Input
            placeholder="Ubicación (ej: Cocina)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button
            onClick={() => onClaim(device.deviceId, nickname, location)}
            disabled={claiming || !nickname.trim()}
            className="w-full"
          >
            {claiming ? 'Reclamando...' : 'Reclamar Dispositivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}