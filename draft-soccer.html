<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Draft Foot - V4 Live Multiplayer</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #111827; margin: 0; padding: 15px; color: white; }
        h1, h2, h3 { text-align: center; color: #f3f4f6; margin-top: 10px; }
        .container { max-width: 800px; margin: 0 auto; background: #1f2937; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); position: relative; }
        .hidden { display: none !important; }
        
        button { background-color: #3b82f6; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-bottom: 10px; font-weight: bold; }
        button:active { transform: scale(0.98); }
        .btn-green { background-color: #10b981; } 
        input { width: 100%; padding: 15px; font-size: 20px; text-align: center; border-radius: 8px; border: none; box-sizing: border-box; margin-bottom: 15px; text-transform: uppercase;}

        /* Loader & Overlay d'attente */
        .overlay { position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(17,24,39,0.9); z-index: 50; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px; }
        .spinner { border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 15px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* UI Draft */
        .header-draft { background: #111827; padding: 15px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 15px; text-align: center; }
        .budget-display { font-size: 24px; font-weight: bold; color: #4ade80; margin-top: 5px; }

        .players-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; } /* Mobile first: 2 colonnes */
        @media(min-width: 600px) { .players-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .player-card { border: 2px solid #374151; border-radius: 8px; padding: 10px; text-align: center; background: #1f2937; position: relative; transition: 0.2s;}
        .player-card.selected { border-color: #fbbf24; background: #451a03; }
        .player-card.disabled { opacity: 0.5; filter: grayscale(100%); pointer-events: none; }
        
        .player-card img { width: 60px; height: 60px; border-radius: 50%; margin-bottom: 5px; border: 2px solid #374151; }
        .pos-badge { background: #3b82f6; font-size: 11px; padding: 2px 6px; border-radius: 10px; font-weight: bold; }
        .price-tag { background: #e11d48; color: white; font-weight: bold; padding: 3px 6px; border-radius: 5px; font-size: 12px; margin-top: 5px; display: inline-block; }

        /* Quiz */
        #quiz-zone { background: #7f1d1d; padding: 20px; border-radius: 10px; text-align: center; margin-top: 20px; }
        .timer-bar { height: 10px; background: #10b981; border-radius: 5px; margin: 15px 0; transition: width 1s linear; }
        
        /* Terrain simplifié pour mobile */
        .pitch { background: #166534; border: 2px solid white; padding: 10px; border-radius: 5px; display: flex; flex-direction: column; justify-content: space-between; min-height: 400px; margin-top: 20px;}
        .pitch-line { display: flex; justify-content: space-around; align-items: center; width: 100%; }
        .pitch-player { text-align: center; width: 50px; }
        .pitch-player img { width: 35px; height: 35px; border-radius: 50%; border: 1px solid white; background: #374151; }
        .pitch-player span { display: block; font-size: 9px; background: rgba(0,0,0,0.8); padding: 2px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; }
    </style>
</head>
<body>

<div class="container" id="app">

    <div id="wait-overlay" class="overlay hidden">
        <div class="spinner"></div>
        <h3 id="wait-msg">En attente de l'adversaire...</h3>
    </div>

    <div id="screen-home" class="screen">
        <h1>⚽ Draft Mobile</h1>
        <div style="margin-top: 30px;">
            <button onclick="createRoom()" class="btn-green">Créer une partie</button>
            <h3 style="margin: 30px 0;">OU</h3>
            <input type="text" id="pin-input" placeholder="CODE PIN (ex: A4B2)" maxlength="4">
            <button onclick="joinRoom()">Rejoindre</button>
        </div>
    </div>

    <div id="screen-tactic" class="screen hidden">
        <h2>🛠️ Choix Tactique</h2>
        <p style="text-align: center; color: #9ca3af;">Code PIN : <strong id="display-pin" style="color:white; font-size: 20px;"></strong></p>
        <p style="text-align: center;">Choisis ta formation :</p>
        <div id="tactics-container"></div>
    </div>

    <div id="screen-draft" class="screen hidden">
        <div class="header-draft">
            <div style="color: #9ca3af;">Recherche : <strong id="current-pos" style="color: white; font-size: 20px;">Gardien</strong> (<span id="draft-progress"></span>)</div>
            <div class="budget-display">💰 <span id="current-budget">500</span> M€</div>
        </div>
        
        <div class="players-grid" id="draft-players"></div>

        <div style="margin-top: 20px;">
            <button onclick="lockPick()" class="btn-green" id="btn-lock">Confirmer mon choix</button>
        </div>
    </div>

    <div id="screen-quiz" class="screen hidden">
        <h1 style="color: #ef4444;">⚔️ DUEL !</h1>
        <h3 style="text-align: center;">Vous visez tous les deux : <br><span id="conflict-player" style="color: #fbbf24; font-size: 24px;"></span></h3>
        
        <div id="quiz-zone">
            <h2 id="quiz-question">Question ?</h2>
            <div id="timer-text" style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">12s</div>
            <div class="timer-bar" id="timer-bar" style="width: 100%;"></div>
            
            <div id="q-btns" style="margin-top: 20px;"></div>
        </div>
    </div>

    <div id="screen-pitch" class="screen hidden">
        <h2>🏟️ Résultat Final</h2>
        <h3 id="final-status" style="color: #4ade80;"></h3>
        <div class="pitch" id="my-pitch"></div>
    </div>

</div>

<script>
    // ==========================================
    // 1. CONFIGURATION SUPABASE (A REMPLIR !!!)
    // ==========================================
    const SUPABASE_URL = 'https://TON_PROJET.supabase.co';
    const SUPABASE_KEY = 'TA_CLE_ANON_PUBLIC';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // ==========================================
    // 2. BASES DE DONNEES LOCALES
    // ==========================================
    const tacticsDB = {
        "4-3-3": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "ATT", "ATT", "ATT"],
        "4-4-2": ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "ATT", "ATT"],
        "3-5-2": ["GK", "DEF", "DEF", "DEF", "MID", "MID", "MID", "MID", "MID", "ATT", "ATT"]
    };

    const playersDB = [
        { id: 1, name: "Mbappé", pos: "ATT", value: 180 }, { id: 2, name: "Haaland", pos: "ATT", value: 180 }, { id: 3, name: "Vinicius", pos: "ATT", value: 150 }, { id: 4, name: "Salah", pos: "ATT", value: 65 }, { id: 5, name: "Kane", pos: "ATT", value: 110 }, { id: 6, name: "Leao", pos: "ATT", value: 90 }, { id: 7, name: "Saka", pos: "ATT", value: 130 },
        { id: 13, name: "Bellingham", pos: "MID", value: 180 }, { id: 14, name: "De Bruyne", pos: "MID", value: 60 }, { id: 15, name: "Rodri", pos: "MID", value: 110 }, { id: 16, name: "Pedri", pos: "MID", value: 80 }, { id: 17, name: "Foden", pos: "MID", value: 130 }, { id: 18, name: "Wirtz", pos: "MID", value: 110 },
        { id: 27, name: "Dias", pos: "DEF", value: 80 }, { id: 28, name: "Saliba", pos: "DEF", value: 80 }, { id: 29, name: "Hakimi", pos: "DEF", value: 65 }, { id: 30, name: "Theo", pos: "DEF", value: 60 }, { id: 31, name: "Bastoni", pos: "DEF", value: 70 }, { id: 32, name: "Frimpong", pos: "DEF", value: 50 },
        { id: 41, name: "Alisson", pos: "GK", value: 35 }, { id: 42, name: "Donnarumma", pos: "GK", value: 40 }, { id: 43, name: "Maignan", pos: "GK", value: 40 }, { id: 44, name: "Courtois", pos: "GK", value: 30 }
    ];

    const questionsDB = [
        { q: "Qui a gagné la Coupe du Monde 2018 ?", ok: "France", bad: ["Brésil", "Allemagne", "Croatie"] },
        { q: "Quel club a remporté la LDC 2023 ?", ok: "Man City", bad: ["Real Madrid", "Inter Milan", "PSG"] },
        { q: "Où joue actuellement Cristiano Ronaldo ?", ok: "Al-Nassr", bad: ["Al-Hilal", "Sporting", "Inter Miami"] }
    ];

    // ==========================================
    // 3. ETAT DU JEU (STATE LOCAL)
    // ==========================================
    let myRoomId = null;
    let myPlayerId = null;
    let myPlayerNum = 0; // 1 = Host, 2 = Client
    let roomState = {};
    let playersState = []; // Les 2 joueurs
    let myLocalPick = null;
    let quizInterval = null;

    // ==========================================
    // 4. NAVIGATION & UI
    // ==========================================
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }

    function showWait(msg) {
        document.getElementById('wait-msg').innerText = msg;
        document.getElementById('wait-overlay').classList.remove('hidden');
    }

    function hideWait() {
        document.getElementById('wait-overlay').classList.add('hidden');
    }

    // ==========================================
    // 5. CONNEXION & MULTIJOUEUR
    // ==========================================
    function generatePIN() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    async function createRoom() {
        showWait("Création de la partie...");
        const pin = generatePIN();
        
        // Créer la room
        const { data: roomData } = await supabase.from('rooms').insert([{ pin_code: pin }]).select().single();
        myRoomId = roomData.id;
        
        // Me créer en tant que Joueur 1
        const { data: pData } = await supabase.from('players').insert([{ room_id: myRoomId, player_num: 1 }]).select().single();
        myPlayerId = pData.id;
        myPlayerNum = 1;

        subscribeToRoom();
        
        document.getElementById('display-pin').innerText = pin;
        hideWait();
        showScreen('screen-tactic');
        showWait("En attente du Joueur 2 (PIN: " + pin + ")"); // J1 attend J2
    }

    async function joinRoom() {
        const pin = document.getElementById('pin-input').value.toUpperCase();
        if(pin.length !== 4) return alert("PIN invalide.");
        
        showWait("Connexion...");
        // Trouver la room
        const { data: roomData } = await supabase.from('rooms').select('*').eq('pin_code', pin).single();
        if(!roomData) { hideWait(); return alert("Partie introuvable."); }
        
        myRoomId = roomData.id;
        
        // Me créer en tant que Joueur 2
        const { data: pData } = await supabase.from('players').insert([{ room_id: myRoomId, player_num: 2 }]).select().single();
        myPlayerId = pData.id;
        myPlayerNum = 2;

        subscribeToRoom();
        
        // P2 met à jour le statut pour lancer la partie
        await supabase.from('rooms').update({ status: 'tactic' }).eq('id', myRoomId);
        
        document.getElementById('display-pin').innerText = pin;
        hideWait();
        showScreen('screen-tactic');
        renderTactics();
    }

    // L'abonnement magique en temps réel
    function subscribeToRoom() {
        // Ecoute les changements sur MA room
        supabase.channel('room-updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${myRoomId}` }, payload => {
                roomState = payload.new;
                handleGameState();
            })
            .subscribe();

        // Ecoute les changements sur les joueurs de MA room
        supabase.channel('players-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${myRoomId}` }, async () => {
                // On recharge les données des joueurs à chaque modif
                const { data } = await supabase.from('players').select('*').eq('room_id', myRoomId);
                playersState = data;
                handleGameState();
            })
            .subscribe();
    }

    // ==========================================
    // 6. MACHINE A ETATS (LE CŒUR DU JEU)
    // ==========================================
    // Cette fonction est appelée à chaque fois que Supabase nous envoie une mise à jour
    async function handleGameState() {
        if(!playersState || playersState.length < 2) return; // Attend que P2 soit là

        const me = playersState.find(p => p.id === myPlayerId);
        const opponent = playersState.find(p => p.id !== myPlayerId);

        // --- PHASE TACTIQUE ---
        if(roomState.status === 'tactic') {
            hideWait();
            if(!me.is_ready) renderTactics(); // Si j'ai pas choisi
            else showWait("L'adversaire choisit sa tactique..."); // Si j'ai choisi mais pas lui

            // HOST SEULEMENT : Si les 2 sont prêts, on lance la Draft (Tour 0)
            if(myPlayerNum === 1 && me.is_ready && opponent.is_ready) {
                generateNextPool(me, opponent, 0);
            }
        }

        // --- PHASE DRAFT ---
        if(roomState.status === 'drafting') {
            hideWait();
            if(roomState.turn_number >= 11) {
                // Fin du jeu
                await supabase.from('rooms').update({ status: 'finished' }).eq('id', myRoomId);
                return;
            }

            if(!me.current_pick) {
                renderDraftScreen(me);
            } else {
                showWait("En attente de l'adversaire...");
            }

            // HOST SEULEMENT : Vérifier si les 2 ont pioché
            if(myPlayerNum === 1 && me.current_pick && opponent.current_pick) {
                resolveDraftPicks(me, opponent);
            }
        }

        // --- PHASE QUIZ ---
        if(roomState.status === 'quiz') {
            hideWait();
            if(!me.quiz_response) {
                renderQuizScreen();
            } else {
                showWait("L'adversaire répond à la question...");
            }

            // HOST SEULEMENT : Vérifier si les 2 ont répondu (ou timeout)
            if(myPlayerNum === 1 && me.quiz_response && opponent.quiz_response) {
                resolveQuiz(me, opponent);
            }
        }

        // --- PHASE FINISHED ---
        if(roomState.status === 'finished') {
            hideWait();
            renderPitch(me);
        }
    }

    // ==========================================
    // 7. LOGIQUE DE JEU & INTERFACE
    // ==========================================
    
    // -- TACTIQUE --
    function renderTactics() {
        showScreen('screen-tactic');
        const container = document.getElementById('tactics-container');
        container.innerHTML = '';
        Object.keys(tacticsDB).forEach(tId => {
            container.innerHTML += `<button onclick="selectTactic('${tId}')">${tId}</button>`;
        });
    }

    async function selectTactic(tId) {
        showWait("Validation...");
        await supabase.from('players').update({ tactic: tId, is_ready: true }).eq('id', myPlayerId);
    }

    // -- DRAFT --
    // Uniquement appelé par l'Host (Joueur 1) pour créer les cartes et les envoyer à Supabase
    async function generateNextPool(me, opponent, turnNum) {
        let tacticArr = tacticsDB[me.tactic]; // On se base sur la tactique de P1 pour le rythme
        let requiredPos = tacticArr[turnNum];

        let avail = playersDB.filter(p => p.pos === requiredPos);
        avail.sort(() => 0.5 - Math.random());
        let pool = avail.slice(0, 5);

        await supabase.from('rooms').update({ 
            status: 'drafting', 
            turn_number: turnNum, 
            current_pool: pool 
        }).eq('id', myRoomId);
    }

    function renderDraftScreen(me) {
        showScreen('screen-draft');
        myLocalPick = null;
        
        let tacticArr = tacticsDB[me.tactic];
        let requiredPos = tacticArr[roomState.turn_number];
        
        document.getElementById('current-pos').innerText = requiredPos;
        document.getElementById('draft-progress').innerText = `${roomState.turn_number + 1}/11`;
        document.getElementById('current-budget').innerText = me.budget;

        const container = document.getElementById('draft-players');
        container.innerHTML = '';

        roomState.current_pool.forEach(p => {
            let disabled = p.value > me.budget ? "disabled" : "";
            container.innerHTML += `
                <div class="player-card ${disabled}" onclick="selectPlayer(${p.id}, this)">
                    <span class="pos-badge">${p.pos}</span><br>
                    <img src="https://ui-avatars.com/api/?name=${p.name}&background=random&color=fff">
                    <br><strong style="font-size:12px;">${p.name}</strong><br>
                    <div class="price-tag">${p.value} M€</div>
                </div>
            `;
        });
    }

    function selectPlayer(id, element) {
        myLocalPick = roomState.current_pool.find(p => p.id === id);
        document.querySelectorAll('.player-card').forEach(c => c.classList.remove('selected'));
        element.classList.add('selected');
    }

    async function lockPick() {
        if(!myLocalPick) return alert("Choisis un joueur !");
        showWait("Envoi du choix...");
        await supabase.from('players').update({ current_pick: myLocalPick }).eq('id', myPlayerId);
    }

    // Uniquement Host : Compare les choix
    async function resolveDraftPicks(me, opponent) {
        if(me.current_pick.id === opponent.current_pick.id) {
            // CONFLIT ! On prépare un quiz
            let q = questionsDB[Math.floor(Math.random() * questionsDB.length)];
            let answers = [q.ok, ...q.bad].sort(() => 0.5 - Math.random());
            
            await supabase.from('rooms').update({
                status: 'quiz',
                quiz_data: { question: q.q, answers: answers, correct: q.ok, conflict_player: me.current_pick }
            }).eq('id', myRoomId);
        } else {
            // PAS DE CONFLIT ! On donne les joueurs, on paie, et on passe au tour suivant
            me.team.push(me.current_pick); me.budget -= me.current_pick.value;
            opponent.team.push(opponent.current_pick); opponent.budget -= opponent.current_pick.value;

            // Update Players
            await supabase.from('players').upsert([
                { id: me.id, room_id: myRoomId, player_num: 1, team: me.team, budget: me.budget, current_pick: null },
                { id: opponent.id, room_id: myRoomId, player_num: 2, team: opponent.team, budget: opponent.budget, current_pick: null }
            ]);

            generateNextPool(me, opponent, roomState.turn_number + 1);
        }
    }

    // -- QUIZ TIMED --
    function renderQuizScreen() {
        showScreen('screen-quiz');
        const qData = roomState.quiz_data;
        document.getElementById('conflict-player').innerText = qData.conflict_player.name;
        document.getElementById('quiz-question').innerText = qData.question;
        
        const container = document.getElementById('q-btns');
        container.innerHTML = '';
        qData.answers.forEach(ans => {
            container.innerHTML += `<button onclick="submitQuizAnswer('${ans}')" class="btn-ans">${ans}</button>`;
        });

        // Lancement du chrono 12 secondes
        let timeLeft = 120; // 120 décisecondes = 12.0s
        const bar = document.getElementById('timer-bar');
        const txt = document.getElementById('timer-text');
        
        clearInterval(quizInterval);
        quizInterval = setInterval(() => {
            timeLeft--;
            txt.innerText = (timeLeft / 10).toFixed(1) + "s";
            bar.style.width = (timeLeft / 120 * 100) + "%";

            if(timeLeft <= 0) {
                clearInterval(quizInterval);
                submitQuizAnswer("TIMEOUT"); // Force l'envoi si le temps est écoulé
            }
        }, 100);
    }

    async function submitQuizAnswer(selectedAns) {
        clearInterval(quizInterval);
        // Désactive les boutons
        document.querySelectorAll('.btn-ans').forEach(b => b.style.pointerEvents = 'none');
        
        const isCorrect = selectedAns === roomState.quiz_data.correct;
        const timeVal = parseFloat(document.getElementById('timer-text').innerText); // ex: 8.5
        
        showWait("Réponse enregistrée. Attente de l'adversaire...");
        await supabase.from('players').update({ 
            quiz_response: { isCorrect: isCorrect, timeLeft: timeVal } 
        }).eq('id', myPlayerId);
    }

    // Uniquement Host : Détermine le vainqueur du quiz
    async function resolveQuiz(me, opponent) {
        let winner = null;
        
        let mRes = me.quiz_response;
        let oRes = opponent.quiz_response;

        if (mRes.isCorrect && oRes.isCorrect) {
            // Les deux justes : le plus de temps restant gagne
            winner = mRes.timeLeft >= oRes.timeLeft ? me : opponent;
        } else if (mRes.isCorrect && !oRes.isCorrect) {
            winner = me;
        } else if (!mRes.isCorrect && oRes.isCorrect) {
            winner = opponent;
        } else {
            // Les 2 ont faux (ou timeout) : Tirage au sort
            winner = Math.random() > 0.5 ? me : opponent;
        }

        let loser = winner.id === me.id ? opponent : me;
        let conflictPlayer = roomState.quiz_data.conflict_player;

        // Assigner joueur au vainqueur
        winner.team.push(conflictPlayer);
        winner.budget -= conflictPlayer.value;

        // Donner un remplaçant gratuit ou un joueur restant au perdant
        let freeAgent = { id: 999+roomState.turn_number, name: "Joueur Libre", pos: conflictPlayer.pos, value: 0 };
        loser.team.push(freeAgent); // Pour faire simple sur le POC, le perdant a un joueur libre

        // Update DB
        await supabase.from('players').upsert([
            { id: winner.id, room_id: myRoomId, player_num: winner.player_num, team: winner.team, budget: winner.budget, current_pick: null, quiz_response: null },
            { id: loser.id, room_id: myRoomId, player_num: loser.player_num, team: loser.team, budget: loser.budget, current_pick: null, quiz_response: null }
        ]);

        // Retirer les données du quiz et passer au tour suivant
        await supabase.from('rooms').update({ quiz_data: null }).eq('id', myRoomId);
        
        generateNextPool(me, opponent, roomState.turn_number + 1);
    }

    // -- AFFICHAGE FIN --
    function renderPitch(me) {
        showScreen('screen-pitch');
        document.getElementById('final-status').innerText = `Il te reste ${me.budget} M€ !`;
        
        let html = '';
        ['ATT', 'MID', 'DEF', 'GK'].forEach(pos => {
            let linePlayers = me.team.filter(p => p.pos === pos);
            if(linePlayers.length > 0) {
                html += `<div class="pitch-line">`;
                linePlayers.forEach(p => {
                    let imgName = p.name === "Joueur Libre" ? "JL" : p.name;
                    html += `
                    <div class="pitch-player">
                        <img src="https://ui-avatars.com/api/?name=${imgName}&background=random&color=fff">
                        <span>${p.name}</span>
                    </div>`;
                });
                html += `</div>`;
            }
        });
        document.getElementById('my-pitch').innerHTML = html;
    }
</script>

</body>
</html>