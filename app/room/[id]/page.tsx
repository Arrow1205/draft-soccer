'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const TACTICS = {
  "4-4-2": { def: 4, mid: 4, att: 2, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MD", "MG", "BU", "ATT"] },
  "4-3-3": { def: 4, mid: 3, att: 3, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "ATT", "BU", "AG", "AD"] },
  "3-5-2": { def: 3, mid: 5, att: 2, allowed: ["GK", "DC", "MC", "MDC", "MOC", "MD", "MG", "BU", "ATT"] },
  "5-3-2": { def: 5, mid: 3, att: 2, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "ATT", "BU"] },
  "4-2-3-1":{ def: 4, mid: 5, att: 1, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "MD", "MG", "BU", "ATT"] }
};

const DRAFT_SEQUENCE = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "ATT", "ATT"];
const BUDGET_OPTIONS = [300, 500, 800, 9999]; 

const PLAYERS_DB = [
  { id: 1, name: "Mbappé", pos: "BU", value: 180 }, { id: 2, name: "Haaland", pos: "BU", value: 180 }, { id: 3, name: "Vinicius", pos: "AG", value: 150 }, { id: 4, name: "Salah", pos: "AD", value: 65 }, { id: 5, name: "Kane", pos: "BU", value: 110 }, { id: 6, name: "Leao", pos: "AG", value: 90 }, { id: 7, name: "Saka", pos: "AD", value: 130 },
  { id: 13, name: "Bellingham", pos: "MOC", value: 180 }, { id: 14, name: "De Bruyne", pos: "MOC", value: 60 }, { id: 15, name: "Rodri", pos: "MDC", value: 110 }, { id: 16, name: "Pedri", pos: "MC", value: 80 }, { id: 17, name: "Foden", pos: "MOC", value: 130 }, { id: 18, name: "Wirtz", pos: "MOC", value: 110 }, { id: 19, name: "Valverde", pos: "MC", value: 100 },
  { id: 27, name: "Dias", pos: "DC", value: 80 }, { id: 28, name: "Saliba", pos: "DC", value: 80 }, { id: 29, name: "Hakimi", pos: "DD", value: 65 }, { id: 30, name: "Theo", pos: "DG", value: 60 }, { id: 31, name: "Bastoni", pos: "DC", value: 70 }, { id: 32, name: "Frimpong", pos: "DD", value: 50 },
  { id: 41, name: "Alisson", pos: "GK", value: 35 }, { id: 42, name: "Donnarumma", pos: "GK", value: 40 }, { id: 43, name: "Maignan", pos: "GK", value: 40 }, { id: 44, name: "Courtois", pos: "GK", value: 30 }, { id: 45, name: "Ederson", pos: "GK", value: 40 }
];

const QUESTIONS_DB = [
    { q: "Qui a gagné la CDM 2018 ?", ok: "France", bad: ["Brésil", "Croatie"] },
    { q: "Quel club a gagné la LDC 2023 ?", ok: "Man City", bad: ["Real", "Inter"] }
];

const getStars = (value: number) => {
    if (value >= 100) return 5;
    if (value >= 80) return 4;
    if (value >= 50) return 3;
    if (value >= 30) return 2;
    return 1;
}

const isHorsPoste = (playerPos: string, tacticStr: string) => {
    // @ts-ignore
    const allowed = TACTICS[tacticStr]?.allowed || [];
    return !allowed.includes(playerPos);
}

export default function RoomPage() {
  const { id: roomId } = useParams()
  const [room, setRoom] = useState<any>(null)
  const [me, setMe] = useState<any>(null)
  const [opponent, setOpponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(12)

  // 1. Abonnement Realtime
  useEffect(() => {
    const myId = localStorage.getItem('myPlayerId')
    const loadData = async () => {
      const { data: r } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      const { data: p } = await supabase.from('players').select('*').eq('room_id', roomId)
      setRoom(r); 
      setMe(p?.find((x: any) => x.id === myId)); 
      setOpponent(p?.find((x: any) => x.id !== myId));
      setLoading(false)
    }
    loadData()

    const roomSub = supabase.channel(`room`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => setRoom(payload.new)).subscribe()
    const playerSub = supabase.channel(`players`).on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => loadData()).subscribe()

    return () => { supabase.removeChannel(roomSub); supabase.removeChannel(playerSub); }
  }, [roomId])

  // 2. Timer Quiz
  useEffect(() => {
    if (room?.status === 'quiz' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 0.1), 100)
      return () => clearTimeout(timer)
    } else if (timeLeft <= 0 && room?.status === 'quiz' && !me?.quiz_response) {
      supabase.from('players').update({ quiz_response: { ans: 'TIMEOUT', time: 0 } }).eq('id', me?.id)
    }
  }, [timeLeft, room?.status, me?.quiz_response, me?.id])

  // 3. HOST : Vérifier conflit de Draft
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'drafting' && me?.current_pick && opponent?.current_pick) {
          if (me.current_pick.id === opponent.current_pick.id) {
              let q = QUESTIONS_DB[Math.floor(Math.random() * QUESTIONS_DB.length)];
              let answers = [q.ok, ...q.bad].sort(() => 0.5 - Math.random());
              supabase.from('rooms').update({ status: 'quiz', quiz_data: { question: q.q, answers: answers, correct: q.ok, conflict: me.current_pick } }).eq('id', room.id).then();
          } else {
              supabase.from('rooms').update({ status: 'round_result' }).eq('id', room.id).then();
          }
      }
  }, [me?.current_pick, opponent?.current_pick, room?.status, me?.player_num, room?.id])

  // 4. HOST : Résultat du Quiz
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'quiz' && me?.quiz_response && opponent?.quiz_response) {
          let qData = room.quiz_data;
          let mOk = me.quiz_response.ans === qData.correct;
          let oOk = opponent.quiz_response.ans === qData.correct;
          
          let winner = null;
          if (mOk && oOk) winner = me.quiz_response.time >= opponent.quiz_response.time ? me : opponent;
          else if (mOk) winner = me;
          else if (oOk) winner = opponent;
          else winner = Math.random() > 0.5 ? me : opponent;

          let loser = winner.id === me.id ? opponent : me;
          let loserPlayer = { id: Math.random(), name: "Remplaçant", pos: qData.conflict.pos, value: Math.floor(qData.conflict.value / 2) };
          
          supabase.from('players').upsert([
              { ...winner, current_pick: qData.conflict },
              { ...loser, current_pick: loserPlayer }
          ]).then(() => {
              supabase.from('rooms').update({ status: 'round_result' }).eq('id', room.id);
          })
      }
  }, [me?.quiz_response, opponent?.quiz_response, room?.status, me?.player_num, room?.quiz_data, room?.id, me?.id])

  // 5. HOST : Résultat du Round
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'round_result') {
          const timer = setTimeout(async () => {
              let nextTurn = room.turn_number + 1;
              if (nextTurn >= 11) {
                  await supabase.from('rooms').update({ status: 'pitch' }).eq('id', room.id);
              } else {
                  let newMeTeam = [...(me.team||[]), me.current_pick];
                  let newOpTeam = [...(opponent.team||[]), opponent.current_pick];
                  await supabase.from('players').upsert([
                      { id: me.id, team: newMeTeam, budget: me.budget - me.current_pick.value, current_pick: null, quiz_response: null },
                      { id: opponent.id, team: newOpTeam, budget: opponent.budget - opponent.current_pick.value, current_pick: null, quiz_response: null }
                  ]);

                  let targetPos = DRAFT_SEQUENCE[nextTurn];
                  let genericPos = targetPos === "DEF" ? ["DC", "DD", "DG"] : targetPos === "MID" ? ["MC", "MDC", "MOC", "MD", "MG"] : ["BU", "ATT", "AG", "AD"];
                  let pool = PLAYERS_DB.filter(p => genericPos.includes(p.pos)).sort(() => 0.5 - Math.random()).slice(0, 5);
                  
                  await supabase.from('rooms').update({ status: 'drafting', turn_number: nextTurn, current_pool: pool, quiz_data: null }).eq('id', room.id);
              }
          }, 4000);
          return () => clearTimeout(timer);
      }
  }, [room?.status, me?.player_num, room?.turn_number, room?.id, me?.team, me?.current_pick, me?.budget, opponent?.team, opponent?.current_pick, opponent?.budget, me?.id, opponent?.id])

  // 6. HOST : Match aux dés
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'match' && me?.is_ready && opponent?.is_ready) {
          let diceMe = Math.floor(Math.random() * 6) + 1;
          let diceOp = Math.floor(Math.random() * 6) + 1;
          let hpMe = isHorsPoste(me.current_pick.pos, me.tactic);
          let hpOp = isHorsPoste(opponent.current_pick.pos, opponent.tactic);
          let starsMe = getStars(me.current_pick.value);
          let starsOp = getStars(opponent.current_pick.value);

          let scoreMe = (starsMe * diceMe) - (hpMe ? diceMe : 0);
          let scoreOp = (starsOp * diceOp) - (hpOp ? diceOp : 0);

          let newMatchState = { duel: { p1: me.current_pick, p2: opponent.current_pick }, dice: { p1: diceMe, p2: diceOp }, scores: { p1: scoreMe, p2: scoreOp }, hp: { p1: hpMe, p2: hpOp } };

          supabase.from('players').upsert([
              { id: me.id, is_ready: false, used_players: [...(me.used_players||[]), me.current_pick.id], ...(scoreMe > scoreOp ? { match_score: me.match_score + 1 } : {}) },
              { id: opponent.id, is_ready: false, used_players: [...(opponent.used_players||[]), opponent.current_pick.id], ...(scoreOp > scoreMe ? { match_score: opponent.match_score + 1 } : {}) }
          ]).then(() => {
              supabase.from('rooms').update({ match_state: newMatchState }).eq('id', room.id);
          })
      }
  }, [me?.is_ready, opponent?.is_ready, room?.status, me?.player_num])


  // ==========================================
  // ACTIONS SÉCURISÉES AVEC ALERTES
  // ==========================================
  const handleBudgetSelect = async (b: number) => {
      const { error: err1 } = await supabase.from('rooms').update({ status: 'tactic', budget: b }).eq('id', room.id);
      if (err1) return alert(`Erreur Rooms : ${err1.message}`);
      
      const { error: err2 } = await supabase.from('players').update({ budget: b }).eq('room_id', room.id);
      if (err2) return alert(`Erreur Players : ${err2.message}`);
  }

  const handleTacticSelect = async (t: string) => {
      const { error } = await supabase.from('players').update({ tactic: t, is_ready: true }).eq('id', me.id);
      if (error) alert(`Erreur Tactic : ${error.message}`);
  }

  const handleLaunchDraft = async () => {
      const pool = PLAYERS_DB.filter(p => p.pos === "GK").sort(() => 0.5 - Math.random()).slice(0, 5);
      const { error } = await supabase.from('rooms').update({ status: 'drafting', current_pool: pool, turn_number: 0 }).eq('id', room.id);
      if (error) alert(`Erreur Lancement : ${error.message}`);
  }

  const handleDraftPick = async (p: any) => {
      const { error } = await supabase.from('players').update({ current_pick: p }).eq('id', me.id);
      if (error) alert(`Erreur Choix : ${error.message}`);
  }


  // ==========================================
  // RENDU UI
  // ==========================================
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-2 left-2 z-50 bg-blue-900/80 px-2 py-1 rounded text-[10px] font-bold text-cyan-400 border border-blue-500/30">
        {me?.player_num === 1 ? '👑 HÔTE (J1)' : '👤 INVITÉ (J2)'}
      </div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 max-w-2xl w-full mx-auto">
        {children}
      </div>
    </main>
  );

  if (loading) return <PageWrapper><div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div></PageWrapper>

  // PHASE 0 : ATTENTE
  if (!opponent && room.status === 'settings') {
    return <PageWrapper>
      <div className="text-center mt-20 p-10 bg-white/5 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md">
        <h2 className="text-xl text-slate-300 font-light mb-4 tracking-widest">CODE SALLE</h2>
        <p className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-mono tracking-[0.2em] font-black">{room.pin_code}</p>
        <div className="mt-10 flex justify-center"><div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div>
        <p className="mt-4 text-slate-400">En attente de l'adversaire...</p>
      </div>
    </PageWrapper>
  }

  // PHASE 1 : BUDGET
  if (room.status === 'settings' && opponent) {
      if (me.player_num === 1) {
          return <PageWrapper>
              <div className="text-center mt-10">
                  <h2 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">BUDGET INITIAL</h2>
                  <div className="grid gap-4">
                      {BUDGET_OPTIONS.map(b => (
                          <button key={b} onClick={() => handleBudgetSelect(b)} 
                                  className="bg-[#060913]/80 border border-blue-500/30 p-6 rounded-2xl text-2xl font-bold hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
                              {b === 9999 ? 'ILLIMITÉ' : `${b} M€`}
                          </button>
                      ))}
                  </div>
              </div>
          </PageWrapper>
      }
      return <PageWrapper><div className="text-center mt-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4">L'hôte configure le match...</p></div></PageWrapper>
  }

  // PHASE 2 : TACTIQUE
  if (room.status === 'tactic') {
      return <PageWrapper>
          <div className="text-center mt-4">
              <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FORMATION</h2>
              <div className="inline-block bg-blue-900/30 text-cyan-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-500/30 mb-8">
                  BUDGET : {room.budget === 9999 ? 'ILLIMITÉ' : `${room.budget} M€`}
              </div>
              
              {!me.is_ready ? (
                  <div className="grid grid-cols-2 gap-4">
                      {Object.keys(TACTICS).map(t => (
                          <button key={t} onClick={() => handleTacticSelect(t)} 
                                  className="bg-[#060913]/80 p-6 rounded-2xl border border-white/10 hover:border-cyan-400 hover:bg-blue-900/20 transition-all">
                              <span className="font-black text-2xl tracking-wider text-slate-200">{t}</span>
                          </button>
                      ))}
                  </div>
              ) : (
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <p className="text-2xl text-cyan-400 font-bold mb-4">{me.tactic} SÉLECTIONNÉ</p>
                      {!opponent.is_ready ? <div className="animate-pulse text-slate-400">Attente de l'adversaire...</div> : 
                       (me.player_num === 1 && <button onClick={handleLaunchDraft} 
                                                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl font-bold text-xl mt-4 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]">LANCER LA DRAFT</button>)}
                  </div>
              )}
          </div>
      </PageWrapper>
  }

  // PHASE 3 : DRAFT
  if (room.status === 'drafting') {
      const targetPos = DRAFT_SEQUENCE[room.turn_number];
      return <PageWrapper>
          <div className="flex justify-between items-center bg-[#060913]/80 p-4 rounded-2xl mb-6 border border-white/10 shadow-lg">
              <div><p className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">Tour {room.turn_number + 1}/11</p><p className="font-black text-xl text-slate-200">RECHERCHE : {targetPos}</p></div>
              <div className="text-right"><p className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">Budget</p><p className="font-black text-2xl text-emerald-400">{me.budget} M€</p></div>
          </div>

          {!me.current_pick ? (
              <div className="grid grid-cols-2 gap-4">
                  {room.current_pool.map((p: any) => (
                      <button key={p.id} disabled={p.value > me.budget} onClick={() => handleDraftPick(p)} 
                              className="bg-gradient-to-b from-[#111827] to-[#060913] border border-white/10 p-4 rounded-2xl disabled:opacity-30 disabled:grayscale hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] relative transition-all group overflow-hidden">
                          <span className="absolute top-3 right-3 bg-blue-900/80 text-cyan-300 border border-blue-500/50 text-xs px-2 py-1 rounded-md font-bold">{p.pos}</span>
                          <div className="font-black text-lg mt-8 text-left">{p.name}</div>
                          <div className="flex justify-between items-end mt-2">
                              <p className="text-red-400 font-bold">{p.value}M</p>
                              <div className="text-yellow-400 text-xs tracking-widest">{'★'.repeat(getStars(p.value))}</div>
                          </div>
                      </button>
                  ))}
              </div>
          ) : <div className="text-center p-10"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-400">Attente...</p></div>}
      </PageWrapper>
  }

  // RESTE DU CODE (Quiz, Resultat, Terrain) laissé identique pour compacter
  // Copiez collez le reste des 'if' de la réponse précédente.
  return <PageWrapper>Match en cours de chargement...</PageWrapper>
}