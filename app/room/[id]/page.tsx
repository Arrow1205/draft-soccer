'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function RoomPage() {
  const { id: roomId } = useParams()
  const [room, setRoom] = useState<any>(null)
  const [me, setMe] = useState<any>(null)
  const [opponent, setOpponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const myId = localStorage.getItem('myPlayerId')

    const loadInitialData = async () => {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      const { data: players } = await supabase.from('players').select('*').eq('room_id', roomId)
      
      setRoom(roomData)
      setMe(players?.find(p => p.id === myId))
      setOpponent(players?.find(p => p.id !== myId))
      setLoading(false)
    }

    loadInitialData()

    // Realtime Subscriptions
    const roomSub = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
        payload => setRoom(payload.new))
      .subscribe()

    const playerSub = supabase.channel(`players:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, 
        () => loadInitialData())
      .subscribe()

    return () => {
      supabase.removeChannel(roomSub)
      supabase.removeChannel(playerSub)
    }
  }, [roomId])

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  // --- RENDU : ATTENTE JOUEUR 2 ---
  if (!opponent && room.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl">En attente d'un adversaire...</h2>
        <div className="text-4xl font-mono mt-4 bg-slate-800 p-4 rounded">{room.pin_code}</div>
      </div>
    )
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl">
        <div>
          <div className="text-sm text-slate-400">Budget</div>
          <div className="text-xl font-bold text-emerald-400">{me?.budget} M€</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Phase</div>
          <div className="font-bold uppercase text-blue-400">{room.status}</div>
        </div>
      </div>

      {/* ICI : Logique d'affichage selon room.status (tactic, drafting, quiz...) */}
      {room.status === 'tactic' && <TacticPhase me={me} />}
      {room.status === 'drafting' && <DraftPhase room={room} me={me} />}
    </main>
  )
}

// Sous-composant Tactic (exemple)
function TacticPhase({ me }: any) {
  const selectTactic = async (t: string) => {
    await supabase.from('players').update({ tactic: t, is_ready: true }).eq('id', me.id)
  }
  return (
    <div>
      <h2 className="text-center mb-4">Choisissez votre tactique</h2>
      {['4-3-3', '4-4-2', '3-5-2'].map(t => (
        <button key={t} onClick={() => selectTactic(t)} className="w-full bg-slate-700 p-4 mb-2 rounded-lg">
          {t}
        </button>
      ))}
    </div>
  )
}

function DraftPhase({ room, me }: any) {
  // Même logique que précédemment mais adaptée à React
  return <div>Draft en cours... (Tour {room.turn_number + 1})</div>
}