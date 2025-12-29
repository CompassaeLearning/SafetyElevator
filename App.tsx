
import React, { useState, useEffect, useRef } from 'react';
import { ControlLevel, Hazard, GameMessage, Choice, FloorData } from './types';
import { FLOORS, NEBOSH_DEFINITIONS } from './constants';
import { getFloorData, generateNewHazard } from './geminiService';

const App: React.FC = () => {
  const [hazard, setHazard] = useState<Hazard | null>(null);
  const [currentLevel, setCurrentLevel] = useState<ControlLevel>(ControlLevel.PPE);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [currentChoices, setCurrentChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'intro' | 'playing' | 'won'>('intro');
  const [dingEffect, setDingEffect] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Audio Context for sound effects
  const playSound = (type: 'ding' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'ding') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(110.00, audioCtx.currentTime); // A2
        oscillator.frequency.linearRampToValueAtTime(55.00, audioCtx.currentTime + 0.2); // A1
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'operator' | 'player', text: string) => {
    setMessages(prev => [...prev, { role, text, timestamp: Date.now() }]);
  };

  const loadFloor = async (hz: Hazard, lvl: ControlLevel, skipIntro?: boolean) => {
    setIsLoading(true);
    const floorData = await getFloorData(hz, lvl);
    if (!skipIntro) {
      addMessage('operator', floorData.intro);
    }
    setCurrentChoices(floorData.choices);
    setIsLoading(false);
  };

  const startGame = async () => {
    setIsLoading(true);
    const newHazard = await generateNewHazard();
    setHazard(newHazard);
    setCurrentLevel(ControlLevel.PPE);
    setMessages([]);
    setGameStatus('playing');
    
    // Consolidated starting message
    const welcomeText = `Welcome to the COMPASSA Safety Elevator! 🏢\n\nToday's hazard is **${newHazard.title}**: ${newHazard.description}.\n\nWe are starting on **Floor 1 (PPE)**. Always remember: PPE is our last resort! What's the best PPE solution here?`;
    addMessage('operator', welcomeText);
    
    // Load options immediately for the first floor
    await loadFloor(newHazard, ControlLevel.PPE, true);
  };

  const handleChoice = async (choice: Choice) => {
    if (isLoading || gameStatus !== 'playing') return;

    addMessage('player', choice.text);
    setIsLoading(true);

    if (choice.level === currentLevel) {
      playSound('ding');
      setDingEffect(true);
      setTimeout(() => setDingEffect(false), 1000);
      addMessage('operator', `✅ Correct! ${choice.explanation} *Ding!* Going up...`);
      
      if (currentLevel < ControlLevel.ELIMINATION) {
        const nextLevel = (currentLevel + 1) as ControlLevel;
        setCurrentLevel(nextLevel);
        if (hazard) await loadFloor(hazard, nextLevel);
      } else {
        setGameStatus('won');
        addMessage('operator', `🎉 **PENTHOUSE REACHED!**\n\nYou have mastered the Hierarchy for the ${hazard?.title}. You successfully worked from most 'reasonably practicable' down to full Elimination!`);
      }
    } else {
      playSound('error');
      const actualFloor = FLOORS.find(f => f.level === choice.level);
      addMessage('operator', `❌ Wrong Floor! That solution ("${choice.text}") is actually an **${actualFloor?.name}** measure.\n\nWe are currently looking for a solution for **Floor ${currentLevel}**. Try again!`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#deebf7] text-[#00376b] flex flex-col md:flex-row font-['Poppins']">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#00376b] p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-[#002a52] shrink-0 text-white shadow-2xl z-30">
        <div className="flex items-center gap-2 mb-8 select-none">
          <div className="relative flex items-center">
            {/* Custom SVG Logo matching branding */}
            <svg width="180" height="50" viewBox="0 0 180 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="25" r="18" stroke="white" strokeWidth="4" />
              <path d="M12 25C12 21 16 18 20 18C24 18 28 21 28 25C28 29 24 32 20 32C16 32 12 29 12 25Z" fill="#fcf13d" />
              <path d="M17 25C17 24 18.5 23 20 23C21.5 23 23 24 23 25C23 26 21.5 27 20 27C18.5 27 17 26 17 25Z" fill="white" />
              <text x="45" y="34" fill="white" fontSize="24" fontWeight="800" fontFamily="Poppins">MPASSA</text>
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative">
          <div className="absolute left-[2.45rem] top-0 bottom-0 w-1 bg-[#004a8f] rounded-full" />
          
          {FLOORS.map((floor) => {
            const isActive = currentLevel === floor.level;
            const isCompleted = currentLevel > floor.level;

            return (
              <div 
                key={floor.level}
                className={`relative flex items-start gap-4 p-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-[#004a8f] ring-2 ring-[#fcf13d] shadow-xl scale-105 z-10' : 'opacity-40'
                }`}
              >
                <div className={`
                  z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-500
                  ${isActive ? 'bg-[#fcf13d] text-[#00376b] shadow-[0_0_15px_rgba(252,241,61,0.5)]' : isCompleted ? 'bg-green-500 text-white' : 'bg-[#002a52] text-white'}
                  ${isActive && dingEffect ? 'animate-ding' : ''}
                `}>
                  {isCompleted ? '✓' : floor.level}
                </div>
                <div>
                  <div className={`font-bold text-sm flex items-center gap-2 ${isActive ? 'text-[#fcf13d]' : 'text-white'}`}>
                    {floor.emoji} {floor.name}
                  </div>
                  <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{floor.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <button 
            onClick={() => setIsNotepadOpen(true)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20"
          >
            <span className="text-xl">📓</span> Study Notes
          </button>
          {gameStatus === 'won' && (
            <button 
              onClick={startGame}
              className="w-full py-3 bg-[#fcf13d] hover:brightness-110 text-[#00376b] font-black rounded-xl transition-all shadow-lg"
            >
              Start New Challenge
            </button>
          )}
        </div>
      </aside>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-screen">
        {/* Header */}
        <div className="h-16 border-b border-[#00376b]/10 bg-white/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          {hazard ? (
            <div className="flex items-center gap-4">
              <span className="px-2 py-0.5 bg-[#00376b] text-[#fcf13d] rounded text-[10px] font-black uppercase tracking-widest">Active Hazard</span>
              <h2 className="font-bold text-[#00376b] truncate max-w-[200px] md:max-w-md">{hazard.title}</h2>
            </div>
          ) : (
            <h2 className="font-semibold text-slate-400 italic">Safety Skyscraper Elevator</h2>
          )}
          <div className="text-[10px] font-bold text-[#00376b]/50 uppercase tracking-widest hidden lg:block">NEBOSH Hierarchy of Controls</div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar scroll-smooth"
        >
          {gameStatus === 'intro' ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-8 p-6">
              <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl border-b-8 border-[#fcf13d] animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-[#00376b] rounded-full flex items-center justify-center text-5xl mb-8 mx-auto shadow-inner relative">
                  👷‍♂️
                  <div className="absolute -bottom-2 -right-2 bg-[#fcf13d] text-[#00376b] p-2 rounded-full text-xs font-bold ring-4 ring-white">!</div>
                </div>
                <h2 className="text-4xl font-black mb-4 text-[#00376b]">The Safety Skyscraper</h2>
                <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                  Welcome to Compass Safety Training. Reach the Penthouse by solving hazards using the <span className="font-bold text-[#00376b]">Hierarchy of Controls</span>. 
                  <br/><br/>
                  We start with PPE and work our way up to the gold standard: <span className="font-bold">Elimination</span>.
                </p>
                <button 
                  onClick={() => {
                    playSound('ding');
                    startGame();
                  }}
                  className="px-12 py-5 bg-[#00376b] hover:bg-[#002a52] text-[#fcf13d] text-xl font-black rounded-2xl transition-all hover:scale-105 shadow-xl shadow-navy-900/40"
                >
                  START GAME
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div 
                  key={m.timestamp + idx} 
                  className={`flex ${m.role === 'operator' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-[1.5rem] p-5 shadow-sm ${
                    m.role === 'operator' 
                      ? 'bg-white text-[#00376b] border border-slate-200' 
                      : 'bg-[#00376b] text-white'
                  }`}>
                    {m.role === 'operator' && (
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-[#00376b]/50 uppercase tracking-widest">
                         <span className="w-2 h-2 rounded-full bg-[#fcf13d] animate-pulse"></span>
                         System Operator
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl p-4 flex gap-2 border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 bg-[#00376b] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-[#00376b] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-[#00376b] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Multiple Choice Options */}
        {gameStatus === 'playing' && currentChoices.length > 0 && !isLoading && (
          <div className="p-6 bg-white/80 backdrop-blur-md border-t border-[#00376b]/10 shrink-0">
            <div className="max-w-4xl mx-auto">
              <p className="text-center mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#00376b]/60">Select the correct solution for Floor {currentLevel}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="p-4 bg-white border-2 border-[#deebf7] hover:border-[#fcf13d] hover:bg-[#deebf7] text-[#00376b] font-semibold rounded-2xl transition-all text-left group flex items-start gap-3 shadow-sm active:scale-95"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#deebf7] group-hover:bg-[#fcf13d] flex items-center justify-center text-[10px] font-black shrink-0 transition-colors">
                      {choice.id}
                    </span>
                    <span className="leading-snug">{choice.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Won State View */}
        {gameStatus === 'won' && (
          <div className="p-8 text-center bg-[#fcf13d]/20 border-t border-[#fcf13d] animate-in slide-in-from-bottom-8 shrink-0">
            <h3 className="text-3xl font-black text-[#00376b] mb-2 uppercase italic tracking-tighter">SAFETY CHAMPION!</h3>
            <p className="text-[#00376b] font-medium mb-6">You've successfully secured the workplace using all hierarchy levels.</p>
            <button 
              onClick={() => {
                playSound('ding');
                startGame();
              }}
              className="px-10 py-4 bg-[#00376b] hover:brightness-125 text-[#fcf13d] font-black rounded-2xl transition-all shadow-xl"
            >
              NEXT HAZARD
            </button>
          </div>
        )}
      </main>

      {/* Notepad Modal */}
      {isNotepadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00376b]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col border-4 border-[#fcf13d]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#deebf7]/30">
              <h3 className="text-2xl font-black text-[#00376b] flex items-center gap-3">
                <span className="text-3xl">📓</span> NEBOSH Study Notes
              </h3>
              <button 
                onClick={() => setIsNotepadOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-xs font-black text-[#00376b]/40 uppercase tracking-[0.2em] mb-4">Core Principles</h4>
                <div className="space-y-6">
                  {NEBOSH_DEFINITIONS.filter(d => !d.level).map((def, idx) => (
                    <div key={idx} className="group">
                      <h5 className="font-bold text-[#00376b] text-lg mb-1 group-hover:text-[#fcf13d] transition-colors">{def.term}</h5>
                      <p className="text-slate-600 leading-relaxed text-sm">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </section>
              
              <section>
                <h4 className="text-xs font-black text-[#00376b]/40 uppercase tracking-[0.2em] mb-4">The Hierarchy</h4>
                <div className="space-y-6">
                  {NEBOSH_DEFINITIONS.filter(d => d.level).sort((a,b) => (b.level || 0) - (a.level || 0)).map((def, idx) => (
                    <div key={idx} className="p-4 bg-[#deebf7]/30 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#00376b] text-[#fcf13d] px-2 py-0.5 rounded text-[10px] font-black">Level {def.level}</span>
                        <h5 className="font-bold text-[#00376b]">{def.term}</h5>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setIsNotepadOpen(false)}
                className="px-8 py-3 bg-[#00376b] text-white font-bold rounded-xl"
              >
                Close Notepad
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
