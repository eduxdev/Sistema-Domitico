import { supabase } from '@/lib/supabase'

export interface DiscoveredDevice {
  deviceId: string
  deviceName: string
  macAddress: string
  ipAddress: string
  deviceType: string
  isActive: boolean
  lastSeen: Date
}

export class NetworkDiscovery {
  private readonly DEVICE_TIMEOUT = 60000 // 1 minuto

  constructor() {
    // No necesitamos UDP socket en Next.js
  }

  async startDiscovery(): Promise<void> {
    // No necesitamos hacer nada aquí, los dispositivos se registran automáticamente
    return Promise.resolve()
  }

  async getDiscoveredDevices(): Promise<DiscoveredDevice[]> {
    try {
      // Obtener dispositivos activos de la base de datos (últimos 10 minutos)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      
      const { data: devices, error } = await supabase
        .from('devices')
        .select('*')
        .eq('is_active', true)
        .gte('last_seen', tenMinutesAgo)
        .order('last_seen', { ascending: false })

      if (error) {
        return []
      }

      const discoveredDevices: DiscoveredDevice[] = devices.map(device => {
        const timestamp = device.last_seen || device.updated_at || device.created_at
        return {
          deviceId: device.device_id,
          deviceName: device.device_name,
          macAddress: device.mac_address || '',
          ipAddress: device.ip_address || '',
          deviceType: device.device_type || 'gas_sensor',
          isActive: device.is_active || false,
          lastSeen: timestamp ? new Date(timestamp) : new Date()
        }
      })

      return discoveredDevices
      
    } catch (error) {
      console.error('Error in getDiscoveredDevices:', error)
      return []
    }
  }

  async sendCommandToDevice(): Promise<void> {
    try {
      // En lugar de UDP, podríamos usar HTTP si el ESP32 tiene un servidor web
      // Por ahora, método placeholder
      return Promise.resolve()
    } catch (error) {
      console.error('Error sending command to device:', error)
      throw error
    }
  }

  stopDiscovery() {
    // No hay socket que cerrar
  }
}

// Singleton para usar en toda la aplicación
export const networkDiscovery = new NetworkDiscovery()