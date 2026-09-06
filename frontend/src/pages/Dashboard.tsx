import { useState, useRef, useEffect } from 'react'
import { UserRole } from '../types'
import Sidebar from '../components/shared/Sidebar'
import Header from '../components/shared/Header'
import ChatPane from '../components/chat/ChatPane'
import ConditionCards from '../components/cards/ConditionCards'
import RiskPanel from '../components/cards/RiskPanel'
import AlertBanner from '../components/alerts/AlertBanner'
import OrcaMap from '../components/map/OrcaMap'

interface Props { role: UserRole; onChangeRole: () => void }

export default function Dashboard({ role, onChangeRole }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeAlert, setActiveAlert] = useState({
    text: 'Southwest monsoon active — exercise caution. Verify with IMD before departure.',
    severity: 'moderate' as const,
  })

  return (
    <div className="ocean-mesh h-screen flex flex-col overflow-hidden">
      {/* Alert banner */}
      {activeAlert && (
        <AlertBanner
          text={activeAlert.text}
          severity={activeAlert.severity}
          onDismiss={() => setActiveAlert(null as any)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar role={role} open={sidebarOpen} onChangeRole={onChangeRole} />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header role={role} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <div className="flex-1 flex overflow-hidden gap-3 p-3">
            {/* Left: Chat pane */}
            <div className="w-80 flex-shrink-0 flex flex-col">
              <ChatPane role={role} />
            </div>

            {/* Center: Map */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <OrcaMap />
              <ConditionCards />
            </div>

            {/* Right: Risk + Evidence */}
            <div className="w-72 flex-shrink-0">
              <RiskPanel role={role} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
