import { useState, useRef, useEffect } from 'react'
import { UserRole } from '../../types'

interface Message { role: 'user' | 'orca'; text: string; time: string; streaming?: boolean }

const SUGGESTIONS: Record<string, string[]> = {
  fisherman: ['Is it safe to fish near Ratnagiri tomorrow?', 'Where is the nearest PFZ today?', 'What are the wave conditions for next 24 hours?'],
  coastal_authority: ['Show vessels in restricted zones', 'Active hazard alerts for Maharashtra coast', 'Geofence status for Malvan MPA'],
  disaster_management: ['Vessel exposure in cyclone track', 'Prioritise response for Maharashtra coast', 'Storm surge risk for next 6 hours'],
  maritime_operator: ['Safe route from Mumbai to Kochi avoiding bad weather', 'Sea state forecast for tomorrow morning', 'Port weather window at Cochin'],
  researcher: ['SST anomaly trend for Arabian Sea this monsoon', 'Chlorophyll productivity vs historical average', 'PFZ shift analysis for June–September'],
  shipping_operator: ['Best weather window for Mumbai Port departure', 'Route optimization avoiding wave heights above 3m', 'ETA estimate with weather delay'],
}

export default function ChatPane({ role }: { role: UserRole }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'orca', text: `Hello! I'm ORCA — your marine intelligence assistant. I can help with fishing safety, weather conditions, PFZ zones, hazard alerts and route planning. What would you like to know?`, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const suggestions = SUGGESTIONS[role] ?? SUGGESTIONS.fisherman

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    setMessages(m => [...m, { role: 'user', text: query, time: now }])
    setInput('')
    setLoading(true)

    // Streaming SSE from backend
    const orcaMsg: Message = { role: 'orca', text: '', time: now, streaming: true }
    setMessages(m => [...m, orcaMsg])

    try {
      const res = await fetch('http://localhost:8000/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_role: role, language: 'en' }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'advisory' && data.data) {
                fullText = data.data.detailed_guidance || data.data.summary || 'Advisory generated.'
              } else if (data.type === 'status') {
                fullText = data.message || fullText
              } else if (data.type === 'error') {
                fullText = `⚠️ ${data.message}`
              }
              setMessages(m => m.map((msg, i) =>
                i === m.length - 1 ? { ...msg, text: fullText, streaming: data.type !== 'done' } : msg
              ))
            } catch {}
          }
        }
      }
    } catch (e) {
      setMessages(m => m.map((msg, i) =>
        i === m.length - 1 ? { ...msg, text: '⚠️ Could not reach ORCA backend. Make sure it is running on port 8000.', streaming: false } : msg
      ))
    }
    setLoading(false)
  }

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden border border-white/5">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center text-sm glow-teal">🐋</div>
        <div>
          <p className="text-sm font-semibold text-white">ORCA</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-emerald-400">Agent Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[90%] px-3 py-2.5 text-xs leading-relaxed ${msg.role === 'user' ? 'msg-user text-cyan-100' : 'msg-orca text-slate-300'}`}>
              {msg.role === 'orca' && !msg.text && (
                <div className="flex gap-1 items-center py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot" />
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.streaming && <span className="animate-blink text-cyan-400">▍</span>}
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-cyan-400/50 text-right' : 'text-slate-600'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 space-y-1">
          {suggestions.map(s => (
            <button key={s} onClick={() => sendQuery(s)}
              className="w-full text-left text-xs px-3 py-2 rounded-xl glass border border-white/5 hover:border-cyan-400/30 text-slate-400 hover:text-white transition-all duration-200">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery(input) } }}
            placeholder="Ask about conditions, safety, PFZ..."
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none outline-none focus:border-cyan-400/40 focus:bg-white/8 transition-all"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => sendQuery(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-all glow-teal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
            </button>
            <button className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5 text-center">Data from INCOIS · IMD · MOSDAC · Sources cited in every response</p>
      </div>
    </div>
  )
}
