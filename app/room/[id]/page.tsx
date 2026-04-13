'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// --- BASES DE DONNÉES LOCALES ---
const TACTICS = {
  "4-4-2": { def: 4, mid: 4, att: 2, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MD", "MG", "BU", "ATT"] },
  "4-3-3": { def: 4, mid: 3, att: 3, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "ATT", "BU", "AG", "AD"] },
  "3-5-2": { def: 3, mid: 5, att: 2, allowed: ["GK", "DC", "MC", "MDC", "MOC", "MD", "MG", "BU", "ATT"] },
  "5-3-2": { def: 5, mid: 3, att: 2, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "ATT", "BU"] },
  "4-2-3-1":{ def: 4, mid: 5, att: 1, allowed: ["GK", "DG", "DC", "DD", "MC", "MDC", "MOC", "MD", "MG", "BU", "ATT"] }
};

// Ordre des 11 tours de Draft
const DRAFT_SEQUENCE = ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "ATT", "ATT"];

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

// --- FONCTIONS UTILITAIRES ---
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

  // -- SYNCHRONISATION REALTIME --
  useEffect(() => {
    const myId = localStorage.getItem('myPlayerId')
    const loadData = async () => {
      const { data: r } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      const { data: p } = await supabase.from('players').select('*').eq('room_id', roomId)
      setRoom(r); setMe(p?.find(x => x.id === myId)); setOpponent(p?.find(x => x.id !== myId));
      setLoading(false)
    }
    loadData()

    const roomSub = supabase.channel(`room`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => setRoom(payload.new)).subscribe()
    const playerSub = supabase.channel(`players`).on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => loadData()).subscribe()

    return () => { supabase.removeChannel(roomSub); supabase.removeChannel(playerSub); }
  }, [roomId])

  // -- TIMER QUIZ --
  useEffect(() => {
    if (room?.status === 'quiz' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 0.1), 100)
      return () => clearTimeout(timer)
    } else if (timeLeft <= 0 && room?.status === 'quiz' && !me.quiz_response) {
      submitQuiz('TIMEOUT')
    }
  }, [timeLeft, room?.status])

  if (loading) return <div className="text-center p-10 font-bold text-white">Chargement du Stade...</div>

  // ==========================================
  // PHASE 0 : ATTENTE JOUEUR 2
  // ==========================================
  if (!opponent && room.status === 'settings') {
    return <div className="text-center p-10"><h2 className="text-2xl text-white">En attente du Joueur 2...</h2><p className="text-4xl text-emerald-400 mt-4 font-mono">{room.pin_code}</p></div>
  }

  // ==========================================
  // PHASE 1 : RÉGLAGES (HOST ONLY)
  // ==========================================
  const startSettings = async (budget: number) => {
      await supabase.from('rooms').update({ status: 'tactic', budget: budget }).eq('id', room.id)
      await supabase.from('players').update({ budget: budget }).eq('room_id', room.id)
  }

  if (room.status === 'settings' && opponent) {
      if (me.player_num === 1) {
          return (
              <div className="max-w-md mx-auto p-4 text-center">
                  <h2 className="text-2xl font-bold mb-6 text-white">Paramètres de la partie</h2>
                  <div className="grid gap-4">
                      {[100, 300, 500, 1000].map(b => (
                          <button key={b} onClick={() => startSettings(b)} className="bg-slate-800 border-2 border-emerald-500 p-4 rounded-xl text-xl hover:bg-emerald-900 transition-colors">Budget : {b} M€</button>
                      ))}
                  </div>
              </div>
          )
      } else {
          return <div className="text-center p-10 text-xl text-slate-300">L'hôte configure la partie...</div>
      }
  }

  // ==========================================
  // PHASE 2 : TACTIQUE SIMULTANÉE
  // ==========================================
  const selectTactic = async (t: string) => {
      await supabase.from('players').update({ tactic: t, is_ready: true }).eq('id', me.id)
  }

  const launchDraft = async () => {
      // Générer le premier pool (Gardiens)
      let pool = PLAYERS_DB.filter(p => p.pos === "GK").sort(() => 0.5 - Math.random()).slice(0, 5);
      await supabase.from('rooms').update({ status: 'drafting', current_pool: pool, turn_number: 0 }).eq('id', room.id)
  }

  if (room.status === 'tactic') {
      return (
          <div className="max-w-md mx-auto p-4 text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Choix Tactique</h2>
              <p className="text-emerald-400 mb-6">Budget validé : {room.budget} M€</p>
              
              {!me.is_ready ? (
                  <div className="grid grid-cols-2 gap-3">
                      {Object.keys(TACTICS).map(t => (
                          <button key={t} onClick={() => selectTactic(t)} className="bg-slate-800 p-4 rounded-xl border border-slate-600 hover:border-blue-500">
                              <span className="font-bold text-xl">{t}</span>
                          </button>
                      ))}
                  </div>
              ) : (
                  <div>
                      <p className="text-xl text-green-400 mb-4">Tactique {me.tactic} validée !</p>
                      {!opponent.is_ready ? <p className="animate-pulse">Attente de l'adversaire...</p> : 
                       (me.player_num === 1 && <button onClick={launchDraft} className="w-full bg-emerald-600 p-4 rounded-xl font-bold text-xl mt-4 animate-bounce">▶️ C'EST PARTI !</button>)}
                  </div>
              )}
          </div>
      )
  }

  // ==========================================
  // PHASE 3 : DRAFT (11 TOURS)
  // ==========================================
  const lockDraftPick = async (player: any) => {
      await supabase.from('players').update({ current_pick: player }).eq('id', me.id)
  }

  // HOST LOGIC : Résolution des choix
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'drafting' && me?.current_pick && opponent?.current_pick) {
          if (me.current_pick.id === opponent.current_pick.id) {
              // CONFLIT
              let q = QUESTIONS_DB[Math.floor(Math.random() * QUESTIONS_DB.length)];
              let answers = [q.ok, ...q.bad].sort(() => 0.5 - Math.random());
              supabase.from('rooms').update({ status: 'quiz', quiz_data: { question: q.q, answers: answers, correct: q.ok, conflict: me.current_pick } }).eq('id', room.id).then();
          } else {
              // PAS DE CONFLIT -> ROUND RESULT
              supabase.from('rooms').update({ status: 'round_result' }).eq('id', room.id).then();
          }
      }
  }, [me?.current_pick, opponent?.current_pick])

  if (room.status === 'drafting') {
      const targetPos = DRAFT_SEQUENCE[room.turn_number];
      return (
          <div className="max-w-2xl mx-auto p-4">
              <div className="flex justify-between bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700">
                  <div><p className="text-slate-400 text-sm">Tour {room.turn_number + 1}/11</p><p className="font-bold text-xl">Recherche : {targetPos}</p></div>
                  <div className="text-right"><p className="text-slate-400 text-sm">Crédits</p><p className="font-bold text-xl text-emerald-400">{me.budget} M€</p></div>
              </div>

              {!me.current_pick ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {room.current_pool.map((p: any) => (
                          <button key={p.id} disabled={p.value > me.budget} onClick={() => lockDraftPick(p)} className="bg-slate-900 border-2 border-slate-700 p-4 rounded-xl disabled:opacity-30 hover:border-emerald-500 relative transition-transform hover:-translate-y-1">
                              <span className="absolute top-2 right-2 bg-blue-600 text-xs px-2 py-1 rounded font-bold">{p.pos}</span>
                              <div className="w-16 h-16 mx-auto bg-slate-700 rounded-full mb-2 flex items-center justify-center font-bold text-xl">{p.name.charAt(0)}</div>
                              <p className="font-bold">{p.name}</p>
                              <p className="text-red-400 font-bold">{p.value} M€</p>
                              <div className="text-yellow-400 text-xs mt-1">{'⭐'.repeat(getStars(p.value))}</div>
                          </button>
                      ))}
                  </div>
              ) : (
                  <div className="text-center p-10"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>Attente de l'adversaire...</p></div>
              )}
          </div>
      )
  }

  // ==========================================
  // PHASE 4 : QUIZ (CONFLIT)
  // ==========================================
  const submitQuiz = async (ans: string) => {
      await supabase.from('players').update({ quiz_response: { ans: ans, time: timeLeft } }).eq('id', me.id)
  }

  // HOST LOGIC : Résolution du Quiz
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
          
          // Mise à jour de la DB pour dire qui a eu quoi avant de passer au round_result
          // Le perdant aura un joueur générique du même poste
          let loserPlayer = { id: Math.random(), name: "Remplaçant", pos: qData.conflict.pos, value: qData.conflict.value / 2 };
          
          supabase.from('players').upsert([
              { ...winner, current_pick: qData.conflict },
              { ...loser, current_pick: loserPlayer }
          ]).then(() => {
              supabase.from('rooms').update({ status: 'round_result' }).eq('id', room.id);
          })
      }
  }, [me?.quiz_response, opponent?.quiz_response])

  if (room.status === 'quiz') {
      return (
          <div className="max-w-md mx-auto p-4">
              <div className="bg-red-900 border-2 border-red-500 rounded-xl p-6 text-center">
                  <h2 className="text-3xl font-bold mb-2">⚔️ CONFLIT !</h2>
                  <p>Vous voulez tous les deux <strong>{room.quiz_data.conflict.name}</strong> !</p>
                  
                  <div className="w-full bg-slate-800 h-2 rounded-full my-6 overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(timeLeft / 12) * 100}%` }}></div>
                  </div>
                  
                  <p className="text-xl mb-6">{room.quiz_data.question}</p>
                  
                  {!me.quiz_response ? (
                      <div className="grid gap-3">
                          {room.quiz_data.answers.map((ans: string) => (
                              <button key={ans} onClick={() => submitQuiz(ans)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-xl font-bold">{ans}</button>
                          ))}
                      </div>
                  ) : <p className="animate-pulse">Enregistré. Attente de l'adversaire...</p>}
              </div>
          </div>
      )
  }

  // ==========================================
  // PHASE 5 : RESULTAT DU ROUND (5 secondes)
  // ==========================================
  // HOST LOGIC : Valider les achats, préparer le tour suivant
  useEffect(() => {
      if (me?.player_num === 1 && room?.status === 'round_result') {
          setTimeout(async () => {
              let nextTurn = room.turn_number + 1;
              if (nextTurn >= 11) {
                  await supabase.from('rooms').update({ status: 'pitch' }).eq('id', room.id);
              } else {
                  // Sauvegarder dans la team, déduire argent
                  let newMeTeam = [...me.team, me.current_pick];
                  let newOpTeam = [...opponent.team, opponent.current_pick];
                  await supabase.from('players').upsert([
                      { id: me.id, team: newMeTeam, budget: me.budget - me.current_pick.value, current_pick: null, quiz_response: null },
                      { id: opponent.id, team: newOpTeam, budget: opponent.budget - opponent.current_pick.value, current_pick: null, quiz_response: null }
                  ]);

                  // Nouveau Pool
                  let targetPos = DRAFT_SEQUENCE[nextTurn];
                  let genericPos = targetPos === "DEF" ? ["DC", "DD", "DG"] : targetPos === "MID" ? ["MC", "MDC", "MOC", "MD", "MG"] : ["BU", "ATT", "AG", "AD"];
                  let pool = PLAYERS_DB.filter(p => genericPos.includes(p.pos)).sort(() => 0.5 - Math.random()).slice(0, 5);
                  
                  await supabase.from('rooms').update({ status: 'drafting', turn_number: nextTurn, current_pool: pool, quiz_data: null }).eq('id', room.id);
              }
          }, 5000); // Reste affiché 5 secondes
      }
  }, [room?.status])

  if (room.status === 'round_result') {
      return (
          <div className="max-w-md mx-auto p-4 text-center">
              <h2 className="text-2xl font-bold mb-6">Résultat du Tour {room.turn_number + 1}</h2>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-4 rounded-xl border border-blue-500">
                      <p className="text-sm text-slate-400 mb-2">Ton joueur</p>
                      <div className="font-bold text-xl text-emerald-400">{me.current_pick?.name}</div>
                      <div className="text-sm">{me.current_pick?.pos}</div>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl border border-red-500">
                      <p className="text-sm text-slate-400 mb-2">Adversaire</p>
                      <div className="font-bold text-xl text-red-400">{opponent.current_pick?.name}</div>
                      <div className="text-sm">{opponent.current_pick?.pos}</div>
                  </div>
              </div>
          </div>
      )
  }

  // ==========================================
  // PHASE 6 : PITCH & LE MATCH (LE JEU DE DÉS)
  // ==========================================
  const selectMatchPlayer = async (player: any) => {
      await supabase.from('players').update({ is_ready: true, current_pick: player }).eq('id', me.id)
  }

  // HOST LOGIC : Résolution du duel (Lancer de dés + Calculs)
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

          let newMatchState = {
              duel: { p1: me.current_pick, p2: opponent.current_pick },
              dice: { p1: diceMe, p2: diceOp },
              scores: { p1: scoreMe, p2: scoreOp },
              hp: { p1: hpMe, p2: hpOp }
          };

          let winnerUpdate = {};
          if (scoreMe > scoreOp) winnerUpdate = { id: me.id, match_score: me.match_score + 1 };
          else if (scoreOp > scoreMe) winnerUpdate = { id: opponent.id, match_score: opponent.match_score + 1 };

          // Reset ready, add used players
          supabase.from('players').upsert([
              { id: me.id, is_ready: false, used_players: [...me.used_players, me.current_pick.id], ...(scoreMe > scoreOp ? { match_score: me.match_score + 1 } : {}) },
              { id: opponent.id, is_ready: false, used_players: [...opponent.used_players, opponent.current_pick.id], ...(scoreOp > scoreMe ? { match_score: opponent.match_score + 1 } : {}) }
          ]).then(() => {
              supabase.from('rooms').update({ match_state: newMatchState }).eq('id', room.id);
          })
      }
  }, [me?.is_ready, opponent?.is_ready])

  if (room.status === 'pitch' || room.status === 'match') {
      return (
          <div className="max-w-md mx-auto p-2">
              <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl mb-4">
                  <div className="text-2xl font-bold text-blue-400">Toi: {me.match_score}</div>
                  <div className="text-xl">🆚</div>
                  <div className="text-2xl font-bold text-red-400">Adv: {opponent.match_score}</div>
              </div>

              {room.status === 'pitch' && (
                  <button onClick={() => supabase.from('rooms').update({ status: 'match' }).eq('id', room.id)} className="w-full bg-emerald-600 p-4 rounded-xl font-bold mb-4">PRÊT POUR LE MATCH !</button>
              )}

              {/* Affichage du dernier Duel */}
              {room.match_state?.duel && (
                  <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500 mb-6 relative">
                      <h3 className="text-center font-bold mb-4">Résultat du Duel</h3>
                      <div className="flex justify-between text-center">
                          <div>
                              <p className="font-bold">{room.match_state.duel.p1.name}</p>
                              <p className="text-3xl">🎲 {room.match_state.dice.p1}</p>
                              {room.match_state.hp.p1 && <p className="text-xs text-red-500 font-bold mt-1">HORS POSTE (-{room.match_state.dice.p1})</p>}
                              <p className="text-2xl text-emerald-400 font-bold mt-2">Total: {room.match_state.scores.p1}</p>
                          </div>
                          <div>
                              <p className="font-bold">{room.match_state.duel.p2.name}</p>
                              <p className="text-3xl">🎲 {room.match_state.dice.p2}</p>
                              {room.match_state.hp.p2 && <p className="text-xs text-red-500 font-bold mt-1">HORS POSTE (-{room.match_state.dice.p2})</p>}
                              <p className="text-2xl text-red-400 font-bold mt-2">Total: {room.match_state.scores.p2}</p>
                          </div>
                      </div>
                  </div>
              )}

              {/* Ton Équipe (Terrain) */}
              <div className="bg-green-800 p-4 rounded-xl border-4 border-white min-h-[400px]">
                  <p className="text-center font-bold text-white/50 mb-4">{me.tactic}</p>
                  <div className="grid grid-cols-3 gap-2">
                      {me.team.map((p: any) => {
                          const isUsed = me.used_players.includes(p.id);
                          const isHpWarning = isHorsPoste(p.pos, me.tactic);
                          
                          return (
                              <button 
                                  key={p.id} 
                                  disabled={isUsed || me.is_ready}
                                  onClick={() => selectMatchPlayer(p)}
                                  className={`bg-slate-900 border-2 rounded-lg p-2 text-center relative ${isUsed ? 'opacity-30 grayscale border-slate-700' : 'border-slate-500 hover:border-emerald-500'} ${me.is_ready && me.current_pick?.id === p.id ? 'ring-4 ring-yellow-400' : ''}`}
                              >
                                  <span className="text-xs font-bold bg-blue-600 px-1 rounded absolute top-1 left-1">{p.pos}</span>
                                  {isHpWarning && !isUsed && <span className="absolute top-1 right-1 text-xs bg-red-600 px-1 rounded rounded-full font-bold" title="Hors Poste !">⚠️</span>}
                                  <div className="font-bold mt-4 text-sm truncate">{p.name}</div>
                                  <div className="text-yellow-400 text-xs">{'⭐'.repeat(getStars(p.value))}</div>
                              </button>
                          )
                      })}
                  </div>
              </div>
          </div>
      )
  }

  return <div>Erreur de statut</div>
}