import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Delete, Check, ShieldCheck, HelpCircle, Trophy, Users, User, XCircle, X, Info, ArrowRight, Star } from 'lucide-react';
import { Difficulty, GameState, ColorId, HistoryEntry, PlayerId, GameMode } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import { generateSecretCode, calculateFeedback } from './utils';
import Peg from './components/Peg';
import FeedbackDisplay from './components/FeedbackDisplay';

const App: React.FC = () => {
  // --- State ---
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE);
  const [activePlayer, setActivePlayer] = useState<PlayerId>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [winner, setWinner] = useState<PlayerId | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  
  const [secretCode, setSecretCode] = useState<ColorId[]>([]);
  
  // State Keyed by Player ID to support 2 distinct boards
  const [histories, setHistories] = useState<Record<PlayerId, HistoryEntry[]>>({ 1: [], 2: [] });
  const [guesses, setGuesses] = useState<Record<PlayerId, ColorId[]>>({ 1: [], 2: [] });
  
  // Scroll ref for history
  const historyEndRef = useRef<HTMLDivElement>(null);

  // --- Derived Constants ---
  const config = DIFFICULTY_CONFIG[difficulty];
  const currentHistory = histories[activePlayer];
  const currentGuess = guesses[activePlayer];
  
  // Check if current mode supports levels
  const isLevelMode = gameMode === GameMode.SINGLE && difficulty !== Difficulty.EASY;
  const maxLevels = 100;

  // --- Initialization ---
  useEffect(() => {
    startNewGame(difficulty, gameMode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Scroll to bottom on history update
  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [histories, activePlayer]);

  // --- Actions ---
  const startNewGame = (diff: Difficulty, mode: GameMode, resetLevel: boolean = true) => {
    const newConfig = DIFFICULTY_CONFIG[diff];
    setDifficulty(diff);
    setGameMode(mode);
    setSecretCode(generateSecretCode(newConfig.availableColors, newConfig.slots));
    
    // Reset Level if requested (e.g. changing difficulty or game over)
    if (resetLevel) {
      setCurrentLevel(1);
    }

    // Reset both players
    setHistories({ 1: [], 2: [] });
    setGuesses({ 1: [], 2: [] });
    
    setActivePlayer(1);
    setWinner(null);
    setGameState(GameState.PLAYING);
  };

  const handleNextLevel = () => {
    if (currentLevel < maxLevels) {
      setCurrentLevel(prev => prev + 1);
      startNewGame(difficulty, gameMode, false);
    }
  };

  const handleColorSelect = (color: ColorId) => {
    if (gameState !== GameState.PLAYING) return;
    
    // Rule: Unique colors only
    if (currentGuess.includes(color)) return;

    if (currentGuess.length < config.slots) {
      const newGuess = [...currentGuess, color];
      setGuesses(prev => ({ ...prev, [activePlayer]: newGuess }));
    }
  };

  const handleDelete = () => {
    if (gameState !== GameState.PLAYING) return;
    const newGuess = currentGuess.slice(0, -1);
    setGuesses(prev => ({ ...prev, [activePlayer]: newGuess }));
  };

  const handleSubmit = () => {
    if (gameState !== GameState.PLAYING) return;
    if (currentGuess.length !== config.slots) return;

    const feedback = calculateFeedback(secretCode, currentGuess);
    const newPlayerHistory = [...currentHistory, { guess: currentGuess, feedback }];
    
    setHistories(prev => ({ ...prev, [activePlayer]: newPlayerHistory }));
    setGuesses(prev => ({ ...prev, [activePlayer]: [] }));

    // 1. Check Win
    if (feedback.black === config.slots) {
      setWinner(activePlayer);
      
      // Level Progression Logic
      if (isLevelMode) {
        if (currentLevel >= maxLevels) {
          setGameState(GameState.MODE_COMPLETED);
        } else {
          setGameState(GameState.WON);
        }
      } else {
        setGameState(GameState.WON);
      }
      return;
    }

    // 2. Check Loss (Ran out of guesses)
    const p1Used = activePlayer === 1 ? newPlayerHistory.length : histories[1].length;
    const p2Used = activePlayer === 2 ? newPlayerHistory.length : histories[2].length;

    // In Single mode, lose if max guesses reached
    if (gameMode === GameMode.SINGLE) {
      if (newPlayerHistory.length >= config.maxGuesses) {
        setGameState(GameState.LOST);
      }
      return;
    }

    // In Multi mode, check if BOTH players lost
    if (gameMode === GameMode.MULTI) {
      const p1Lost = p1Used >= config.maxGuesses;
      const p2Lost = p2Used >= config.maxGuesses;

      if (p1Lost && p2Lost) {
        setGameState(GameState.LOST);
        return;
      }

      // Switch Turn logic
      // If the other player hasn't lost, switch to them
      const nextPlayer = activePlayer === 1 ? 2 : 1;
      const nextPlayerHistory = histories[nextPlayer];
      
      if (nextPlayerHistory.length < config.maxGuesses) {
        setActivePlayer(nextPlayer);
      }
    }
  };

  // --- UI Components ---

  const renderHistory = () => (
    <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0 bg-slate-900/30 rounded-xl border border-slate-800/50">
      {currentHistory.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
          <ShieldCheck className="w-12 h-12 mb-2" />
          <p className="text-sm font-medium">Bắt đầu đoán...</p>
        </div>
      )}
      {currentHistory.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-3 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs font-mono text-slate-500 w-5 text-right">{idx + 1}.</span>
          <div className="flex gap-2 flex-1 justify-center">
            {entry.guess.map((color, i) => (
              <Peg key={i} color={color} size={config.slots > 5 ? 'sm' : 'md'} />
            ))}
          </div>
          <div className="pl-3 border-l border-slate-700">
            <FeedbackDisplay feedback={entry.feedback} slots={config.slots} />
          </div>
        </div>
      ))}
      <div ref={historyEndRef} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="w-full max-w-md p-4 flex items-center justify-between border-b border-slate-800/50 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500 p-1.5 rounded-lg shadow-[0_0_12px_rgba(99,102,241,0.5)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Super Decoder
            </h1>
          </div>
          {isLevelMode && (
            <div className="flex items-center gap-1.5 mt-1 ml-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-yellow-400 tracking-wide uppercase">
                Level {currentLevel}/{maxLevels}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setShowRules(true)}
            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800"
            title="Hướng dẫn"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => startNewGame(difficulty, gameMode, true)}
            className="p-2 text-slate-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-800"
            title="New Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Mode & Difficulty Controls */}
      <div className="w-full max-w-md p-4 space-y-4">
        {/* Mode Tabs */}
        <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <button
            onClick={() => startNewGame(difficulty, GameMode.SINGLE, true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              gameMode === GameMode.SINGLE 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 1 Player
          </button>
          <button
            onClick={() => startNewGame(difficulty, GameMode.MULTI, true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              gameMode === GameMode.MULTI 
                ? 'bg-indigo-600/80 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> 2 Players (VS)
          </button>
        </div>

        {/* Player Switcher (Only visible in Multi) */}
        {gameMode === GameMode.MULTI && (
           <div className="flex items-center justify-between px-2">
             <div className={`flex items-center gap-2 text-sm transition-colors ${activePlayer === 1 ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                <div className={`w-2 h-2 rounded-full ${activePlayer === 1 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]' : 'bg-slate-700'}`} />
                Player 1
             </div>
             <div className="text-xs text-slate-500 font-mono">VS</div>
             <div className={`flex items-center gap-2 text-sm transition-colors ${activePlayer === 2 ? 'text-pink-400 font-bold' : 'text-slate-600'}`}>
                Player 2
                <div className={`w-2 h-2 rounded-full ${activePlayer === 2 ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,1)]' : 'bg-slate-700'}`} />
             </div>
           </div>
        )}

        {/* Difficulty Selector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.values(Difficulty).map((d) => (
            <button
              key={d}
              onClick={() => startNewGame(d, gameMode, true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                difficulty === d
                  ? 'bg-slate-100 text-slate-900 border-slate-100 shadow-md transform scale-105'
                  : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="w-full max-w-md flex-1 flex flex-col min-h-0 px-4 pb-4 overflow-hidden">
        {/* Stats Bar */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2 px-1">
          <span>{config.slots} SLOTS / {config.availableColors.length} COLORS</span>
          <span className={`${
            (config.maxGuesses - currentHistory.length) <= 3 ? 'text-red-400 animate-pulse' : ''
          }`}>
            REMAINING: {config.maxGuesses - currentHistory.length}
          </span>
        </div>

        {/* History List */}
        {renderHistory()}

        {/* Current Active Row */}
        <div className="mt-4 mb-2 bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-lg backdrop-blur">
          <div className="flex justify-center gap-3 mb-4">
             {Array.from({ length: config.slots }).map((_, i) => (
               <Peg 
                 key={i} 
                 color={currentGuess[i]} 
                 size={config.slots > 5 ? 'md' : 'lg'}
                 onClick={() => {
                   // Optional: Click to remove specific peg? For now, we use backspace logic
                 }}
               />
             ))}
             {currentGuess.length < config.slots && (
                <div className={`
                  flex items-center justify-center rounded-full border-2 border-dashed border-slate-600/50 animate-pulse
                  ${config.slots > 5 ? 'w-10 h-10' : 'w-12 h-12'}
                `}>
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                </div>
             )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
             <button
               onClick={handleDelete}
               disabled={currentGuess.length === 0}
               className="p-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-700/50 transition-all active:scale-95"
             >
               <Delete className="w-5 h-5" />
             </button>
             
             {/* Color Palette */}
             <div className="flex-1 flex flex-wrap justify-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
               {config.availableColors.map((color) => {
                 const isUsed = currentGuess.includes(color);
                 return (
                  <div key={color} className={`${isUsed ? 'opacity-20 grayscale pointer-events-none' : ''} transition-all`}>
                    <Peg 
                      color={color} 
                      size="md" 
                      onClick={() => handleColorSelect(color)} 
                    />
                  </div>
                 );
               })}
             </div>

             <button
               onClick={handleSubmit}
               disabled={currentGuess.length !== config.slots}
               className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-30 disabled:shadow-none disabled:hover:bg-indigo-600 transition-all active:scale-95"
             >
               <Check className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Rules Modal (Vietnamese) */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" /> Hướng dẫn cách chơi
            </h2>
            
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">🎯 Mục tiêu</h3>
                <p>Đoán chính xác <strong>Mã bí mật</strong> (gồm các ô màu) do máy tạo ra.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-100 mb-1">🔍 Phản hồi (Feedback)</h3>
                <div className="space-y-2 mt-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    <span><strong>Xanh lá:</strong> Đúng màu, đúng vị trí.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span><strong>Đỏ:</strong> Đúng màu, sai vị trí.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white border border-slate-500" />
                    <span><strong>Trắng:</strong> Sai màu hoàn toàn.</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-100 mb-1">⚡ Chế độ chơi</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>1 Player:</strong> Chinh phục 100 màn chơi (Medium+).</li>
                  <li><strong>2 Players:</strong> Thi đấu xem ai giải mã nhanh hơn.</li>
                  <li>Màu sắc trong mã bí mật <strong>không trùng lặp</strong>.</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
            >
              Đã hiểu!
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Win Modal */}
      {(gameState === GameState.WON || gameState === GameState.LOST || gameState === GameState.MODE_COMPLETED) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gameState === GameState.LOST ? 'from-red-500 via-orange-500 to-red-500' : 'from-green-500 via-emerald-400 to-green-500'}`} />
            
            {gameState === GameState.MODE_COMPLETED ? (
              <>
                 <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-yellow-500/10">
                  <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Hoàn Thành Chế Độ!</h2>
                <p className="text-slate-400 mb-6">
                  Chúc mừng! Bạn đã chinh phục 100 level của chế độ <strong>{difficulty}</strong>.
                </p>
              </>
            ) : gameState === GameState.WON ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-500/10">
                  <Trophy className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isLevelMode ? `Hoàn thành Level ${currentLevel}!` : 'Chiến thắng!'}
                </h2>
                <p className="text-slate-400 mb-6">
                  {gameMode === GameMode.SINGLE 
                    ? (isLevelMode ? "Sẵn sàng cho thử thách tiếp theo chưa?" : "Bạn đã giải mã thành công!")
                    : `Player ${winner} đã giành chiến thắng ngoạn mục!`}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-500/10">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Thất bại!</h2>
                <p className="text-slate-400 mb-6">
                  {gameMode === GameMode.SINGLE
                   ? (isLevelMode ? `Bạn đã dừng chân tại Level ${currentLevel}.` : "Bạn đã hết lượt đoán.")
                   : "Cả hai người chơi đều không giải được mã."}
                </p>
              </>
            )}

            {/* Reveal Code */}
            <div className="bg-slate-800/50 p-4 rounded-xl mb-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Mã Bí Mật</p>
              <div className="flex justify-center gap-3">
                {secretCode.map((c, i) => (
                  <Peg key={i} color={c} size="md" />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {gameState === GameState.WON && isLevelMode && currentLevel < maxLevels ? (
                 <button 
                  onClick={handleNextLevel}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  Màn tiếp theo <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => startNewGame(difficulty, gameMode, true)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  {gameState === GameState.MODE_COMPLETED ? 'Chơi lại từ đầu' : 'Chơi lại'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature */}
      <div className="w-full py-3 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity cursor-default select-none pb-safe">
        Được viết bởi Nguyễn Việt Tú
      </div>
    </div>
  );
};

export default App;