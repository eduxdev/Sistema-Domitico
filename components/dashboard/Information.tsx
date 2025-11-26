'use client'

import React, { useState } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import LocalDevices from '../devices/LocalDevices'
import MyDevices from '../devices/MyDevices'
import Alerts from '../dashboard/Alerts'
import Settings from '../dashboard/Settings'
import DashboardHome from '../dashboard/DashboardHome'

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<string>('dashboard')

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />
      case 'my-devices':
        return <MyDevices />
      case 'add-devices':
        return <LocalDevices />
      case 'alerts':
        return <Alerts />
      case 'settings':
        return <Settings />
      default:
        return <DashboardHome />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
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