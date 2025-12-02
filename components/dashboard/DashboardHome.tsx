'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Gauge, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalLecturas: 0,
    ultimaLectura: null as {
      id: number;
      sensor_tipo: string;
      valor: number;
      unidad: string;
      estado: string;
      sensor_nombre: string;
      created_at: string;
    } | null,
    alertasActivas: 0,
    sistemaOperativo: true,
    sensoresPorTipo: {} as { [key: string]: number }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Primero obtener dispositivos reclamados por el usuario
      const devicesResponse = await fetch('/api/devices/my-devices')
      const devicesData = await devicesResponse.json()
      
      if (!devicesData.success || !devicesData.data || devicesData.data.length === 0) {
        // Si no hay dispositivos reclamados, mostrar estadísticas vacías
        setStats({
          totalLecturas: 0,
          ultimaLectura: null,
          alertasActivas: 0,
          sistemaOperativo: true,
          sensoresPorTipo: {}
        })
        return
      }

      // Obtener lecturas solo de dispositivos reclamados
      const allReadings: Array<{
        id: number;
        sensor_tipo: string;
        valor: number;
        unidad: string;
        estado: string;
        sensor_nombre: string;
        created_at: string;
      }> = []
      const sensoresPorTipo: { [key: string]: number } = {}

      for (const device of devicesData.data) {
        try {
          const readingsResponse = await fetch(`/api/sensor/multi-data?device_id=${device.device_id}&limit=20`)
          if (readingsResponse.ok) {
            const readingsData = await readingsResponse.json()
            if (readingsData.success && readingsData.data) {
              allReadings.push(...readingsData.data)
              
              // Contar sensores por tipo
              readingsData.data.forEach((lectura: { sensor_tipo: string }) => {
                sensoresPorTipo[lectura.sensor_tipo] = (sensoresPorTipo[lectura.sensor_tipo] || 0) + 1
              })
            }
          }
        } catch (err) {
          console.error(`Error obteniendo lecturas para ${device.device_id}:`, err)
        }
      }

      // Ordenar por fecha más reciente
      allReadings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setStats({
        totalLecturas: allReadings.length,
        ultimaLectura: allReadings[0] || null,
        alertasActivas: allReadings.filter((l: { estado: string }) => l.estado !== 'normal').length,
        sistemaOperativo: true,
        sensoresPorTipo
      })
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      // En caso de error, mostrar estadísticas vacías
      setStats({
        totalLecturas: 0,
        ultimaLectura: null,
        alertasActivas: 0,
        sistemaOperativo: true,
        sensoresPorTipo: {}
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Multi-Sensor</h2>
        <p className="text-gray-500">Resumen de tu sistema de monitoreo ambiental</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturas Recientes</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalLecturas}</div>
                <p className="text-xs text-muted-foreground">
                  De tus dispositivos
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Lectura</CardTitle>
            <Activity className={`h-4 w-4 ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stats.ultimaLectura?.valor || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.ultimaLectura?.estado?.toUpperCase() || 'Sin datos'} {stats.ultimaLectura?.unidad || ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.alertasActivas > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-28" />
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold ${stats.alertasActivas > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.alertasActivas}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.alertasActivas === 0 ? 'Todo normal' : 'Requieren atención'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">Operativo</div>
                <p className="text-xs text-muted-foreground">
                  Sensores funcionando correctamente
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Última lectura detallada */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-8 w-16 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-24 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-28 mx-auto" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Skeleton className="h-3 w-64" />
            </div>
          </CardContent>
        </Card>
      ) : stats.ultimaLectura && (
        <Card>
          <CardHeader>
            <CardTitle>Última Lectura Multi-Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-2xl font-bold">{stats.ultimaLectura.valor} {stats.ultimaLectura.unidad}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Estado</p>
                <p className={`text-lg font-semibold ${
                  stats.ultimaLectura.estado === 'normal' ? 'text-green-600' :
                  stats.ultimaLectura.estado === 'precaucion' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.ultimaLectura.estado?.toUpperCase()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="text-lg font-medium">{stats.ultimaLectura.sensor_tipo}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Sensor</p>
                <p className="text-lg font-medium">{stats.ultimaLectura.sensor_nombre || 'Principal'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Última actualización: {new Date(stats.ultimaLectura.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen por tipo de sensor */}
      {!loading && Object.keys(stats.sensoresPorTipo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Tipo de Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(stats.sensoresPorTipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{tipo}</p>
                  <p className="text-xl font-bold text-blue-600">{cantidad}</p>
                  <p className="text-xs text-gray-400">lecturas</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay dispositivos reclamados */}
      {!loading && stats.totalLecturas === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes dispositivos reclamados
              </h3>
              <p className="text-gray-500 mb-4">
                Para ver estadísticas y lecturas, primero debes reclamar un dispositivo en la sección &quot;Reclamar Dispositivo&quot;.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}