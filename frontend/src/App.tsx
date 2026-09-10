import React, { useState } from 'react'
import { PortalHome } from './components/PortalHome'
import { RoleSelectionLanding } from './components/RoleSelectionLanding'
import { LoginModal } from './components/LoginModal'
import { RoleDashboards } from './components/RoleDashboards'
import { AgentReasoningEngine } from './components/AgentReasoningEngine'
import { X, Bot } from 'lucide-react'

export const App: React.FC = () => {
  // Navigation: 'portal' | 'dashboard'
  const [viewMode, setViewMode] = useState<'portal' | 'dashboard'>('portal')
  const [portalInitialSlide, setPortalInitialSlide] = useState<0 | 1>(0)
  const [selectedRole, setSelectedRole] = useState<string>('Fishermen')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginModalInitialMode, setLoginModalInitialMode] = useState<'login' | 'register'>('login')
  const [agentModalOpen, setAgentModalOpen] = useState(false)

  const checkIsRoleRegistered = (role: string): boolean => {
    try {
      const roleKey = role.toLowerCase().replace(/\s+/g, '_')
      const flag = localStorage.getItem(`orca_${roleKey}_registered`) === 'true'
      if (flag) return true

      // Check registered users list
      const users = JSON.parse(localStorage.getItem('orca_registered_users') || '[]')
      if (Array.isArray(users) && users.some((u: any) => u.role === role)) {
        return true
      }

      // Backward compatibility for Fishermen
      if (role === 'Fishermen') {
        const legacyFlag = localStorage.getItem('orca_fisherman_registered') === 'true'
        const pendingRegs = JSON.parse(localStorage.getItem('orca_pending_registrations') || '[]')
        return legacyFlag || (Array.isArray(pendingRegs) && pendingRegs.length > 0)
      }

      return false
    } catch {
      return false
    }
  }

  const handleSelectRole = (role: string) => {
    setSelectedRole(role)
    if (!checkIsRoleRegistered(role)) {
      // Not registered -> open role-specific register form
      handleOpenLogin('register')
    } else {
      // Already registered -> open role-specific login form
      handleOpenLogin('login')
    }
  }

  const handleOpenLogin = (mode: 'login' | 'register' = 'login') => {
    setLoginModalInitialMode(mode)
    setLoginModalOpen(true)
  }

  const handleLoginSuccess = (role: string) => {
    setSelectedRole(role)
    const roleKey = role.toLowerCase().replace(/\s+/g, '_')
    localStorage.setItem(`orca_${roleKey}_registered`, 'true')
    if (role === 'Fishermen') {
      localStorage.setItem('orca_fisherman_registered', 'true')
    }
    if (role === 'Disaster Management') {
      localStorage.setItem('orca_disaster_management_registered', 'true')
    }
    setLoginModalOpen(false)
    setViewMode('dashboard')
  }

  const speakAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.lang = 'en-IN'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="orca-app-root">
      {/* ── 1. PORTAL SLIDING EXPERIENCE (Slide 1: Home Overview | Slide 2: Role Selection) ── */}
      {viewMode === 'portal' && (
        <PortalHome
          onSelectRole={handleSelectRole}
          onOpenLogin={() => handleOpenLogin('login')}
          onExploreMap={() => {
            setSelectedRole('Coastal Authorities')
            setViewMode('dashboard')
          }}
          initialSlide={portalInitialSlide}
        />
      )}

      {/* ── 2. ROLE DASHBOARDS (Specialized Mission Consoles) ── */}
      {viewMode === 'dashboard' && (
        <RoleDashboards
          key={selectedRole}
          initialRole={selectedRole}
          onBackToHome={() => {
            setPortalInitialSlide(1)
            setViewMode('portal')
          }}
          onOpenAgentModal={() => setAgentModalOpen(true)}
        />
      )}

      {/* ── 3. AUTH MODAL (Matching Top-Right Screens: Welcome Back & Register) ── */}
      <LoginModal
        key={`${selectedRole}-${loginModalInitialMode}`}
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialMode={loginModalInitialMode}
        targetRole={selectedRole}
      />

      {/* ── 4. FLOATING / SLIDEOUT MULTI-AGENT AI CONSOLE ("Ask ORCA") ── */}
      {agentModalOpen && (
        <div className="agent-modal-drawer-backdrop" onClick={() => setAgentModalOpen(false)}>
          <div className="agent-modal-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="agent-drawer-header">
              <div className="drawer-title-row">
                <Bot size={22} className="text-cyan animate-pulse" />
                <h3>Ask ORCA — Multi-Agent AI Safety Reasoning</h3>
              </div>
              <button className="btn-drawer-close" onClick={() => setAgentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="agent-drawer-body">
              <AgentReasoningEngine onSpeakAdvisory={speakAudio} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
