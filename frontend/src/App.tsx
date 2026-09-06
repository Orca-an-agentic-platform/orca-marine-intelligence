import { useState } from 'react'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import { UserRole } from './types'

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null)

  if (!role) return <Landing onSelectRole={setRole} />
  return <Dashboard role={role} onChangeRole={() => setRole(null)} />
}
