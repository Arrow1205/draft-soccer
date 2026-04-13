'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [pin, setPin] = useState('')
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)

  const createRoom = async () => {
    setIsConnecting(true)
    const newPin = Math.random().toString(36).substring(2, 6).toUpperCase()
    
    // CORRECTION ICI : On force le statut à 'settings' lors de la création
    const { data: room, error } = await supabase.from('rooms').insert([{ pin_code: newPin, status: 'settings' }]).select().single()
    
    if (error) {
      console.error(error)
      setIsConnecting(false)
      return alert("Erreur de connexion à Supabase.")
    }

    if (room) {
      const { data: player } = await supabase.from('players').insert([{ room_id: room.id, player_num: 1 }]).select().single()
      localStorage.setItem('myPlayerId', player.id)
      router.push(`/room/${room.id}`)
    }
  }

  const joinRoom = async () => {
    if(pin.length !== 4) return alert("Le PIN doit faire 4 caractères.")
    setIsConnecting(true)
    const { data: room } = await supabase.from('rooms').select('*').eq('pin_code', pin.toUpperCase()).single()
    
    if (room) {
      const { data: player } = await supabase.from('players').insert([{ room_id: room.id, player_num: 2 }]).select().single()
      localStorage.setItem('myPlayerId', player.id)
      
      // CORRECTION ICI : On ne change PLUS le statut ici. C'est l'hôte qui le changera après avoir choisi le budget !
      router.push(`/room/${room.id}`)
    } else {
      setIsConnecting(false)
      alert("PIN introuvable")
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0B0F19] text-slate-200 relative overflow-hidden">
      {/* Effet de lumière LDC en arrière-plan */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-md bg-white/5 p-8 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-wider">CHAMPIONS</h1>
        <h2 className="text-2xl font-light mb-10 tracking-widest text-slate-300">DRAFT</h2>

        <button 
          onClick={createRoom} 
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-4 rounded-xl font-bold mb-8 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] disabled:opacity-50"
        >
          {isConnecting ? 'CRÉATION...' : 'CRÉER UNE PARTIE'}
        </button>
        
        <div className="w-full flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-sm font-light text-slate-400">OU REJOINDRE</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="ENTRER LE CODE PIN" 
            className="p-4 rounded-xl bg-[#060913] border border-blue-500/30 text-center text-2xl uppercase tracking-[0.3em] font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
          />
          <button 
            onClick={joinRoom} 
            disabled={isConnecting || pin.length < 4}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {isConnecting ? 'CONNEXION...' : 'REJOINDRE LE MATCH'}
          </button>
        </div>
      </div>
    </main>
  )
}