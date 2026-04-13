'use client'

import { useEffect, useState, useRef } from 'react'
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
  
  const isProcessing = useRef(false);

  useEffect(() => {
    const myId = localStorage.getItem('myPlayerId')
    
    const loadData = async () => {
      const { data: r } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      const { data: p } = await supabase.from('players').select('*').eq('room_id', roomId)
      const myPlayer = p?.find((x: any) => x.id === myId);
      const opPlayer = p?.find((x: any) => x.id !== myId);
      
      setRoom(r); setMe(myPlayer); setOpponent(opPlayer); setLoading(false);

      if (myPlayer?.player_num === 1 && !isProcessing.current) {
          
          if (r.status === 'drafting' && myPlayer.current_pick && opPlayer.current_pick) {
              isProcessing.current = true;
              if (myPlayer.current_pick.id === opPlayer.current_pick.id) {
                  let q = QUESTIONS_DB[Math.floor(Math.random() * QUESTIONS_DB.length)];
                  let answers = [q.ok, ...q.bad].sort(() => 0.5 - Math.random());
                  await supabase.from('rooms').update({ status: 'quiz', quiz_data: { question: q.q, answers: answers, correct: q.ok, conflict: myPlayer.current_pick } }).eq('id', r.id);
              } else {
                  await supabase.from('rooms').update({ status: 'round_result' }).eq('id', r.id);
              }
              isProcessing.current = false;
          }

          if (r.status === 'quiz' && myPlayer.quiz_response && opPlayer.quiz_response) {
              isProcessing.current = true;
              let qData = r.quiz_data;
              let mOk = myPlayer.quiz_response.ans === qData.correct;
              let oOk = opPlayer.quiz_response.ans === qData.correct;
              
              let winner = null;
              if (mOk && oOk) winner = myPlayer.quiz_response.time >= opPlayer.quiz_response.time ? myPlayer : opPlayer;
              else if (mOk) winner = myPlayer;
              else if (oOk) winner = opPlayer;
              else winner = Math.random() > 0.5 ? myPlayer : opPlayer;

              let loser = winner.id === myPlayer.id ? opPlayer : myPlayer;
              let loserPlayer = { id: Math.random(), name: "Looser", pos: qData.conflict.pos, value: 0 };
              
              await Promise.all([
                  supabase.from('players').update({ current_pick: qData.conflict }).eq('id', winner.id),
                  supabase.from('players').update({ current_pick: loserPlayer }).eq('id', loser.id),
                  supabase.from('rooms').update({ status: 'round_result' }).eq('id', r.id)
              ]);
              isProcessing.current = false;
          }

          if (r.status === 'match' && myPlayer.is_ready && opPlayer.is_ready && myPlayer.current_pick && opPlayer.current_pick) {
              isProcessing.current = true;
              let diceMe = Math.floor(Math.random() * 6) + 1;
              let diceOp = Math.floor(Math.random() * 6) + 1;
              let hpMe = isHorsPoste(myPlayer.current_pick.pos, myPlayer.tactic);
              let hpOp = isHorsPoste(opPlayer.current_pick.pos, opPlayer.tactic);
              let starsMe = getStars(myPlayer.current_pick.value);
              let starsOp = getStars(opPlayer.current_pick.value);

              let scoreMe = (starsMe * diceMe) - (hpMe ? diceMe : 0);
              let scoreOp = (starsOp * diceOp) - (hpOp ? diceOp : 0);

              let newMatchState = { duel: { p1: myPlayer.current_pick, p2: opPlayer.current_pick }, dice: { p1: diceMe, p2: diceOp }, scores: { p1: scoreMe, p2: scoreOp }, hp: { p1: hpMe, p2: hpOp } };
              let meScore = scoreMe > scoreOp ? (myPlayer.match_score||0) + 1 : (myPlayer.match_score||0);
              let opScore = scoreOp > scoreMe ? (opPlayer.match_score||0) + 1 : (opPlayer.match_score||0);

              await Promise.all([
                  supabase.from('players').update({ is_ready: false, current_pick: null, used_players: [...(myPlayer.used_players||[]), myPlayer.current_pick.id], match_score: meScore }).eq('id', myPlayer.id),
                  supabase.from('players').update({ is_ready: false, current_pick: null, used_players: [...(opPlayer.used_players||[]), opPlayer.current_pick.id], match_score: opScore }).eq('id', opPlayer.id),
                  supabase.from('rooms').update({ match_state: newMatchState }).eq('id', r.id)
              ]);
              isProcessing.current = false;
          }
      }
    }
    
    loadData()
    const roomSub = supabase.channel(`room`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => loadData()).subscribe()
    const playerSub = supabase.channel(`players`).on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => loadData()).subscribe()

    return () => { supabase.removeChannel(roomSub); supabase.removeChannel(playerSub); }
  }, [roomId])

  useEffect(() => { if (room?.status === 'quiz') setTimeLeft(12); }, [room?.status])
  useEffect(() => {
    if (room?.status === 'quiz' && timeLeft > 0 && !me?.quiz_response) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 0.1), 100)
      return () => clearTimeout(timer)
    } else if (timeLeft <= 0 && room?.status === 'quiz' && !me?.quiz_response) {
      supabase.from('players').update({ quiz_response: { ans: 'TIMEOUT', time: 0 } }).eq('id', me?.id)
    }
  }, [timeLeft, room?.status, me?.quiz_response, me?.id])

  const handleBudgetSelect = async (b: number) => {
      setRoom((prev: any) => ({ ...prev, status: 'tactic', budget: b }));
      setMe((prev: any) => ({ ...prev, budget: b }));
      await supabase.from('rooms').update({ status: 'tactic', budget: b }).eq('id', room.id);
      await supabase.from('players').update({ budget: b }).eq('room_id', room.id);
  }

  const handleTacticSelect = async (t: string) => {
      setMe((prev: any) => ({ ...prev, tactic: t, is_ready: true }));
      await supabase.from('players').update({ tactic: t, is_ready: true }).eq('id', me.id);
  }

  const handleLaunchDraft = async () => {
      const pool = PLAYERS_DB.filter(p => p.pos === "GK").sort(() => 0.5 - Math.random()).slice(0, 5);
      setRoom((prev: any) => ({ ...prev, status: 'drafting', current_pool: pool, turn_number: 0 }));
      await supabase.from('rooms').update({ status: 'drafting', current_pool: pool, turn_number: 0 }).eq('id', room.id);
  }

  const handleDraftPick = async (p: any) => {
      setMe((prev: any) => ({ ...prev, current_pick: p }));
      await supabase.from('players').update({ current_pick: p }).eq('id', me.id);
  }

  const handleQuizAnswer = async (ans: string) => {
      setMe((prev: any) => ({ ...prev, quiz_response: { ans: ans, time: timeLeft } }));
      await supabase.from('players').update({ quiz_response: { ans: ans, time: timeLeft } }).eq('id', me.id);
  }

  const handleNextTurn = async () => {
      let nTurn = room.turn_number + 1;
      if (nTurn >= 11) {
          setRoom((prev: any) => ({ ...prev, status: 'pitch' }));
          await supabase.from('rooms').update({ status: 'pitch' }).eq('id', room.id);
      } else {
          let newMeTeam = [...(me.team||[]), me.current_pick];
          let newOpTeam = [...(opponent.team||[]), opponent.current_pick];
          let targetPos = DRAFT_SEQUENCE[nTurn];
          let genericPos = targetPos === "DEF" ? ["DC", "DD", "DG"] : targetPos === "MID" ? ["MC", "MDC", "MOC", "MD", "MG"] : ["BU", "ATT", "AG", "AD"];
          let pool = PLAYERS_DB.filter(p => genericPos.includes(p.pos)).sort(() => 0.5 - Math.random()).slice(0, 5);
          setRoom((prev: any) => ({ ...prev, status: 'drafting', turn_number: nTurn, current_pool: pool, quiz_data: null }));
          setMe((prev: any) => ({ ...prev, team: newMeTeam, budget: me.budget - me.current_pick.value, current_pick: null, quiz_response: null }));
          await Promise.all([
              supabase.from('players').update({ team: newMeTeam, budget: me.budget - me.current_pick.value, current_pick: null, quiz_response: null, is_ready: false }).eq('id', me.id),
              supabase.from('players').update({ team: newOpTeam, budget: opponent.budget - opponent.current_pick.value, current_pick: null, quiz_response: null, is_ready: false }).eq('id', opponent.id),
              supabase.from('rooms').update({ status: 'drafting', turn_number: nTurn, current_pool: pool, quiz_data: null }).eq('id', room.id)
          ]);
      }
  }

  const handleStartMatch = async () => {
      isProcessing.current = false; // Reset du verrou
      setRoom((prev: any) => ({ ...prev, status: 'match' }));
      await supabase.from('players').update({ is_ready: false, current_pick: null }).eq('room_id', room.id);
      await supabase.from('rooms').update({ status: 'match', match_state: {} }).eq('id', room.id);
  }

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-2 left-2 z-50 bg-blue-900/80 px-2 py-1 rounded text-[10px] font-bold text-cyan-400 border border-blue-500/30">
        {me?.player_num === 1 ? '👑 HÔTE' : '👤 INVITÉ'}
      </div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="relative z-10 max-w-2xl w-full mx-auto pb-10">
        {children}
      </div>
    </main>
  );

  if (loading) return <PageWrapper><div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div></PageWrapper>

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

  if (room.status === 'tactic') {
      return <PageWrapper>
          <div className="text-center mt-4">
              <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">FORMATION</h2>
              <div className="inline-block bg-blue-900/30 text-cyan-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-500/30 mb-8">BUDGET : {room.budget === 9999 ? 'ILLIMITÉ' : `${room.budget} M€`}</div>
              
              {!me.is_ready ? (
                  <div className="grid grid-cols-2 gap-4">
                      {Object.keys(TACTICS).map(t => (
                          <button key={t} onClick={() => handleTacticSelect(t)} 
                                  className="bg-[#060913]/80 p-6 rounded-2xl border border-white/10 hover:border-cyan-400 transition-all"><span className="font-black text-2xl">{t}</span></button>
                      ))}
                  </div>
              ) : (
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <p className="text-2xl text-cyan-400 font-bold mb-4">{me.tactic} SÉLECTIONNÉ</p>
                      {!opponent?.is_ready ? <div className="animate-pulse text-slate-400">Attente de l'adversaire...</div> : 
                       (me.player_num === 1 && <button onClick={handleLaunchDraft} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl font-bold text-xl mt-4 text-white">LANCER LA DRAFT</button>)}
                  </div>
              )}
          </div>
      </PageWrapper>
  }

  if (room.status === 'drafting') {
      const targetPos = DRAFT_SEQUENCE[room.turn_number];
      const canAffordSomeone = room.current_pool?.some((p: any) => p.value <= me.budget);
      return <PageWrapper>
          <div className="flex justify-between items-center bg-[#060913]/80 p-4 rounded-2xl mb-6 border border-white/10 shadow-lg">
              <div><p className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">Tour {room.turn_number + 1}/11</p><p className="font-black text-xl text-slate-200">RECHERCHE : {targetPos}</p></div>
              <div className="text-right"><p className="text-cyan-400/60 text-xs font-bold tracking-widest uppercase">Budget</p><p className="font-black text-2xl text-emerald-400">{me.budget} M€</p></div>
          </div>
          {!me.current_pick ? (
              <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      {room.current_pool?.map((p: any) => (
                          <button key={p.id} disabled={p.value > me.budget} onClick={() => handleDraftPick(p)} 
                                  className="bg-gradient-to-b from-[#111827] to-[#060913] border border-white/10 p-4 rounded-2xl disabled:opacity-30 disabled:grayscale hover:border-cyan-400 transition-all relative">
                              <span className="absolute top-3 right-3 bg-blue-900/80 text-cyan-300 border border-blue-500/50 text-xs px-2 py-1 rounded-md font-bold">{p.pos}</span>
                              <div className="font-black text-lg mt-8 text-left">{p.name}</div>
                              <div className="flex justify-between items-end mt-2"><p className="text-red-400 font-bold">{p.value}M</p><div className="text-yellow-400 text-xs tracking-widest">{'★'.repeat(getStars(p.value))}</div></div>
                          </button>
                      ))}
                  </div>
                  {!canAffordSomeone && (
                      <button onClick={() => handleDraftPick({ id: Math.random(), name: "Looser", pos: targetPos, value: 0 })}
                          className="w-full bg-red-900/80 border-2 border-red-500 p-4 rounded-xl text-white font-bold text-xl animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                          ⚠️ BUDGET ÉPUISÉ - RECRUTER UN LOOSER (0 M€)
                      </button>
                  )}
              </>
          ) : <div className="text-center p-10"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-400">Attente de l'adversaire...</p></div>}
      </PageWrapper>
  }

  if (room.status === 'quiz') {
      return <PageWrapper>
          <div className="bg-[#1A0B0B]/80 border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(239,68,68,0.2)] relative overflow-hidden">
              <h2 className="text-3xl font-black mb-2 text-red-500 tracking-wider">DUEL !</h2>
              <p className="text-slate-300">Objectif : <strong className="text-white text-xl">{room.quiz_data.conflict.name}</strong></p>
              <div className="w-full bg-black/50 h-2 rounded-full my-8 overflow-hidden border border-white/5"><div className="bg-gradient-to-r from-red-500 to-orange-400 h-full transition-all" style={{ width: `${(timeLeft / 12) * 100}%` }}></div></div>
              <p className="text-2xl font-light mb-8">{room.quiz_data.question}</p>
              {!me.quiz_response ? (
                  <div className="grid gap-3">
                      {room.quiz_data.answers.map((ans: string) => (
                          <button key={ans} onClick={() => handleQuizAnswer(ans)} 
                                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-xl font-bold transition-colors">{ans}</button>
                      ))}
                  </div>
              ) : <p className="animate-pulse text-red-400">Réponse envoyée...</p>}
          </div>
      </PageWrapper>
  }

  if (room.status === 'round_result') {
      return <PageWrapper>
          <div className="text-center mt-10">
              <h2 className="text-2xl font-black mb-8 text-slate-300 tracking-widest">RÉSULTAT DU TOUR</h2>
              <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-gradient-to-b from-blue-900/20 to-black/40 p-6 rounded-3xl border border-blue-500/30">
                      <p className="text-xs text-blue-400 font-bold tracking-widest mb-4">TON RECRUTEMENT</p>
                      <div className="font-black text-2xl text-white">{me.current_pick?.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{me.current_pick?.pos}</div>
                  </div>
                  <div className="bg-gradient-to-b from-red-900/20 to-black/40 p-6 rounded-3xl border border-red-500/30">
                      <p className="text-xs text-red-400 font-bold tracking-widest mb-4">ADVERSAIRE</p>
                      <div className="font-black text-2xl text-white">{opponent?.current_pick?.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{opponent?.current_pick?.pos}</div>
                  </div>
              </div>
              {me.player_num === 1 ? (
                  <button onClick={handleNextTurn} className="w-full bg-emerald-600 p-4 rounded-xl font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">TOUR SUIVANT ⏩</button>
              ) : (
                  <p className="text-slate-400 animate-pulse">L'hôte prépare le prochain tour...</p>
              )}
          </div>
      </PageWrapper>
  }

  if (room.status === 'pitch' || room.status === 'match') {
      return <PageWrapper>
          <div className="flex justify-between items-center bg-[#060913]/80 p-4 rounded-2xl mb-6 border border-white/10">
              <div className="text-center"><p className="text-xs text-slate-400">TOI</p><p className="text-3xl font-black text-cyan-400">{me.match_score}</p></div>
              <div className="text-slate-600 font-black text-xl italic">VS</div>
              <div className="text-center"><p className="text-xs text-slate-400">ADV</p><p className="text-3xl font-black text-red-400">{opponent?.match_score}</p></div>
          </div>

          {room.status === 'pitch' && me.player_num === 1 ? (
              <button onClick={handleStartMatch} 
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl font-black text-xl mb-6 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                  LANCER LE MATCH
              </button>
          ) : room.status === 'pitch' && (
              <div className="w-full bg-slate-800 p-4 rounded-xl font-bold mb-6 text-center animate-pulse">L'HÔTE VA LANCER LE MATCH...</div>
          )}

          {room.status === 'match' && (
              <div className="w-full bg-red-900/80 border border-red-500 p-4 rounded-xl font-black text-lg mb-6 text-white text-center animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  {!me.is_ready ? "SÉLECTIONNE UN JOUEUR POUR LE DUEL !" : "ATTENTE DE L'ADVERSAIRE..."}
              </div>
          )}

          {room.match_state?.duel && (
              <div className="bg-gradient-to-b from-yellow-900/20 to-black/50 p-6 rounded-3xl border border-yellow-500/30 mb-8 relative">
                  <p className="text-center text-xs text-yellow-500 font-bold tracking-widest mb-4">DERNIER DUEL</p>
                  <div className="flex justify-between text-center items-center">
                      <div className="flex-1">
                          <p className="font-bold text-white">{room.match_state.duel.p1.name}</p>
                          <p className="text-4xl mt-2 mb-1">🎲 {room.match_state.dice.p1}</p>
                          {room.match_state.hp.p1 && <p className="text-[10px] text-red-500 font-bold bg-red-900/30 px-2 py-1 rounded inline-block">HORS POSTE (-{room.match_state.dice.p1})</p>}
                          <p className="text-xl text-cyan-400 font-black mt-2">Pts: {room.match_state.scores.p1}</p>
                      </div>
                      <div className="flex-1">
                          <p className="font-bold text-white">{room.match_state.duel.p2.name}</p>
                          <p className="text-4xl mt-2 mb-1">🎲 {room.match_state.dice.p2}</p>
                          {room.match_state.hp.p2 && <p className="text-[10px] text-red-500 font-bold bg-red-900/30 px-2 py-1 rounded inline-block">HORS POSTE (-{room.match_state.dice.p2})</p>}
                          <p className="text-xl text-red-400 font-black mt-2">Pts: {room.match_state.scores.p2}</p>
                      </div>
                  </div>
              </div>
          )}

          <div className="relative bg-[#063319] p-4 rounded-3xl border-2 border-emerald-500/50 min-h-[400px]">
              <p className="text-center font-black text-emerald-400/30 text-2xl tracking-widest mb-6 absolute top-8 left-0 right-0 pointer-events-none">{me.tactic}</p>
              {me.player_num === 1 && room.status === 'match' && (
                  <button onClick={() => {isProcessing.current = false; alert("Moteur débloqué !");}} className="absolute bottom-2 right-2 bg-white/10 text-[8px] p-1 rounded opacity-20">FORCE RESET</button>
              )}
              <div className="grid grid-cols-3 gap-3 relative z-10 mt-12">
                  {me.team?.map((p: any) => {
                      const isUsed = (me.used_players||[]).includes(p.id);
                      const isHpWarning = isHorsPoste(p.pos, me.tactic);
                      return (
                          <button key={p.id} disabled={isUsed || me.is_ready || room.status === 'pitch'}
                                  onClick={() => { setMe((prev: any) => ({...prev, is_ready: true, current_pick: p})); supabase.from('players').update({ is_ready: true, current_pick: p }).eq('id', me.id); }}
                                  className={`bg-gradient-to-b from-[#1a2332] to-[#0d131f] border rounded-xl p-2 text-center relative ${isUsed ? 'opacity-40 grayscale border-slate-700' : 'border-slate-600 hover:border-cyan-400'} ${me.is_ready && me.current_pick?.id === p.id ? 'ring-2 ring-cyan-400 border-cyan-400' : ''}`}>
                              <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded absolute top-1 left-1 border border-white/10">{p.pos}</span>
                              {isHpWarning && !isUsed && <span className="absolute top-1 right-1 text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-black">⚠️</span>}
                              <div className="font-bold mt-5 text-sm text-white truncate">{p.name}</div>
                              <div className="text-yellow-400 text-[10px] tracking-widest mt-1">{'★'.repeat(getStars(p.value))}</div>
                          </button>
                      )
                  })}
              </div>
          </div>
      </PageWrapper>
  }

  return <PageWrapper>Erreur de phase.</PageWrapper>
}