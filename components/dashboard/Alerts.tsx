'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { CheckCircle, Info } from 'lucide-react'

interface Lectura {
  id: number
  valor_ppm: number
  estado: string
  sensor_nombre: string | null
  device_id: string | null
  created_at: string
  device_name?: string
}

interface Device {
  id: string
  device_id: string
  nombre: string
  nickname?: string
}

export default function Alerts() {
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 11

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Primero obtener los dispositivos del usuario
      const devicesResponse = await fetch('/api/devices/my-devices')
      const devicesData = await devicesResponse.json()
      
      if (!devicesData.success) {
        setError('Error al cargar dispositivos del usuario')
        return
      }
      
      const userDevices = devicesData.devices || []
      setDevices(userDevices)
      
      if (userDevices.length === 0) {
        setLecturas([])
        setError(null)
        return
      }
      
      // Obtener alertas de todos los dispositivos del usuario
      const allAlerts: Lectura[] = []
      
      for (const device of userDevices) {
        try {
          const alertsResponse = await fetch(`/api/sensor/data?limit=10&device_id=${device.device_id}`)
          const alertsData = await alertsResponse.json()
          
          if (alertsData.success && alertsData.data) {
            // Filtrar solo lecturas con alertas (no normales) y agregar info del dispositivo
            const deviceAlerts = alertsData.data
              .filter((lectura: Lectura) => lectura.estado !== 'normal')
              .map((lectura: Lectura) => ({
                ...lectura,
                device_name: device.nickname || device.nombre,
                device_id: device.device_id
              }))
            
            allAlerts.push(...deviceAlerts)
          }
        } catch (err) {
          console.error(`Error fetching alerts for device ${device.device_id}:`, err)
        }
      }
      
      // Ordenar por fecha más reciente
      allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setLecturas(allAlerts)
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar las alertas')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityFromEstado = (estado: string): 'low' | 'medium' | 'high' => {
    switch (estado) {
      case 'peligro':
        return 'high'
      case 'precaucion':
        return 'medium'
      case 'normal':
        return 'low'
      default:
        return 'medium'
    }
  }

  const getSeverityBadge = (estado: string) => {
    const severity = getSeverityFromEstado(estado)
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0">PELIGRO</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0">PRECAUCIÓN</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0">NORMAL</Badge>
      default:
        return <Badge className="text-xs px-2 py-0">Sin definir</Badge>
    }
  }



  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Alertas de Mis Dispositivos</h2>
            <p className="text-gray-500 dark:text-gray-400">Alertas de los dispositivos que has reclamado</p>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Nivel PPM</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Alertas</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alertas de Mis Dispositivos</h2>
          <p className="text-gray-500">Alertas de los dispositivos que has reclamado</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            {devices.length} dispositivos
          </Badge>
          <Badge variant={lecturas.length > 0 ? "destructive" : "secondary"}>
            {lecturas.length} alertas activas
          </Badge>
        </div>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Info className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No tienes dispositivos reclamados</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Ve a &quot;Reclamar Dispositivo&quot; para agregar dispositivos y ver sus alertas aquí.
            </p>
          </CardContent>
        </Card>
      ) : lecturas.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No hay alertas activas</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Todos tus dispositivos están funcionando normalmente. Las alertas aparecerán aquí cuando se detecten niveles elevados de gas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Nivel PPM</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturas
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((lectura) => {
                      const severity = getSeverityFromEstado(lectura.estado)
                      return (
                        <TableRow key={lectura.id}>
                          {/* Dispositivo */}
                          <TableCell>
                            <span className="font-medium text-sm">
                              {lectura.device_name || lectura.sensor_nombre || 'Sensor Principal'}
                            </span>
                          </TableCell>

                          {/* Nivel PPM */}
                          <TableCell>
                            <span className="font-semibold text-sm">{lectura.valor_ppm} PPM</span>
                          </TableCell>

                          {/* Fecha */}
                          <TableCell>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div>{new Date(lectura.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(lectura.created_at).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </TableCell>

                          {/* Estado */}
                          <TableCell>
                            {getSeverityBadge(lectura.estado)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paginación */}
          {lecturas.length > itemsPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) setCurrentPage(currentPage - 1)
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: Math.ceil(lecturas.length / itemsPerPage) }, (_, i) => i + 1).map((page) => {
                  const totalPages = Math.ceil(lecturas.length / itemsPerPage)
                  
                  // Mostrar solo algunas páginas
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }
                  return null
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < Math.ceil(lecturas.length / itemsPerPage)) {
                        setCurrentPage(currentPage + 1)
                      }
                    }}
                    className={
                      currentPage === Math.ceil(lecturas.length / itemsPerPage)
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  )
}