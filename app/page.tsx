'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [pin, setPin] = useState('')
  const router = useRouter()

  const createRoom = async () => {
    const newPin = Math.random().toString(36).substring(2, 6).toUpperCase()
    const { data: room } = await supabase.from('rooms').insert([{ pin_code: newPin }]).select().single()
    
    if (room) {
      const { data: player } = await supabase.from('players').insert([{ room_id: room.id, player_num: 1 }]).select().single()
      localStorage.setItem('myPlayerId', player.id)
      router.push(`/room/${room.id}`)
    }
  }

  const joinRoom = async () => {
    const { data: room } = await supabase.from('rooms').select('*').eq('pin_code', pin.toUpperCase()).single()
    if (room) {
      const { data: player } = await supabase.from('players').insert([{ room_id: room.id, player_num: 2 }]).select().single()
      localStorage.setItem('myPlayerId', player.id)
      await supabase.from('rooms').update({ status: 'tactic' }).eq('id', room.id)
      router.push(`/room/${room.id}`)
    } else {
      alert("PIN introuvable")
    }
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">⚽ Draft Foot</h1>
      <button onClick={createRoom} className="w-full max-w-xs bg-emerald-600 p-4 rounded-xl font-bold mb-4">
        Créer une partie
      </button>
      <div className="w-full max-w-xs flex flex-col gap-2">
        <input 
          type="text" 
          placeholder="CODE PIN" 
          className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-center text-xl uppercase"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button onClick={joinRoom} className="bg-blue-600 p-4 rounded-xl font-bold">
          Rejoindre
        </button>
      </div>
    </main>
  )
}