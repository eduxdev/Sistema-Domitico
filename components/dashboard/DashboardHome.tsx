'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Package, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DashboardHome() {
  // Datos de ejemplo - más adelante se pueden obtener del API
  const stats = {
    totalDevices: 3,
    activeDevices: 2,
    totalAlerts: 1,
    resolvedAlerts: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-500">Resumen de tu sistema domótico</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispositivos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDevices} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos Activos</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeDevices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDevices - stats.activeDevices} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.resolvedAlerts} resueltas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operativo</div>
            <p className="text-xs text-muted-foreground">
              Todo funcionando correctamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dispositivo agregado</p>
                <p className="text-sm text-gray-500">Sensor Cocina fue agregado</p>
              </div>
              <span className="text-xs text-gray-400">Hace 2 horas</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lectura del sensor</p>
                <p className="text-sm text-gray-500">Nivel de gas: NORMAL</p>
              </div>
              <span className="text-xs text-gray-400">Hace 5 minutos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}