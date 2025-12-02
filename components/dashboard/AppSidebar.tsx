'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { 
  Home, 
  Package, 
  Bell, 
  Settings,
  LogOut,
  Smartphone,
  Plus
} from 'lucide-react'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Usar setTimeout para evitar el warning de setState síncrono
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    // Eliminar cookie de autenticación
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/auth')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const menuItems = [
    {
      title: 'Principal',
      items: [
        {
          title: 'Dashboard',
          icon: Home,
          section: 'dashboard',
        },
      ],
    },
    {
      title: 'Dispositivos',
      items: [
        {
          title: 'Mis Dispositivos',
          icon: Smartphone,
          section: 'my-devices',
        },
        {
          title: 'Reclamar Dispositivo',
          icon: Plus,
          section: 'claim-devices',
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          title: 'Alertas',
          icon: Bell,
          section: 'alerts',
        },
        {
          title: 'Configuración',
          icon: Settings,
          section: 'settings',
        },
      ],
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 shrink-0 items-center border-b border-sidebar-border">
        <div className="flex items-center gap-2 w-full justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Sistema Domótico</span>
            <span className="text-xs text-sidebar-foreground/70">Panel de Control</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton
                        onClick={() => onSectionChange(item.section)}
                        isActive={activeSection === item.section}
                        tooltip={item.title}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="mt-auto pb-2">
          <SidebarGroupContent>
            <div className="grid grid-cols-2 gap-2 px-2">
              <button
                onClick={toggleTheme}
                className="flex h-10 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
                title={mounted ? (theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro') : 'Cambiar Tema'}
              >
                {mounted && theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex h-10 items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50/50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
