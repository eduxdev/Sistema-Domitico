'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import MultiSensorAlerts from '@/components/dashboard/MultiSensorAlerts'
import Settings from '@/components/dashboard/Settings'
import DashboardHome from '@/components/dashboard/DashboardHome'
import MyDevices from '@/components/dashboard/MyDevices'
import ClaimDevices from '@/components/dashboard/ClaimDevices'

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('dashboard')

  // Sincronizar con la URL al cargar
  useEffect(() => {
    const section = searchParams.get('section') || 'dashboard'
    setActiveSection(section)
  }, [searchParams])

  // Actualizar URL cuando cambia la sección
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    router.push(`/dashboard?section=${section}`, { scroll: false })
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />
      case 'my-devices':
        return <MyDevices />
      case 'claim-devices':
        return <ClaimDevices />
      case 'alerts':
        return <MultiSensorAlerts />
      case 'settings':
        return <Settings />
      default:
        return <DashboardHome />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
          <SidebarTrigger />
        </header>
        <div className="container mx-auto p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}