import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Sparkles, Volume2, VolumeX, Bell, Trophy, Shield, ShieldAlert, Award, Flame, X, CheckCircle, Zap } from 'lucide-react';
import { synth } from '../utils/synth';
import { Task } from '../types';

interface PanicTimerProps {
  selectedTask?: Task | null;
  tasks?: Task[];
  onSelectTask?: (task: Task | null) => void;
}

const BADGES = {
  crisis_averted: {
    id: 'crisis_averted',
    name: 'Crisis Averted... Barely',
    description: 'Fled from a live Panic Mode session to preserve sanity. Hey, surviving is a strategy.',
    icon: '🛡️',
    color: 'border-amber-400 bg-amber-50 text-amber-800'
  },
  impenetrable_fortress: {
    id: 'impenetrable_fortress',
    name: 'Impenetrable Fortress',
    description: 'Completed a full Panic Mode session without switching tabs once. True steel focus.',
    icon: '🧠',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-800'
  },
  slightly_distracted: {
    id: 'slightly_distracted',
    name: 'Slightly Distracted Hero',
    description: "Completed focus but checked another tab. Curiosity is a superpower too, right?",
    icon: '🐈',
    color: 'border-sky-400 bg-sky-50 text-sky-850'
  },
  momentum_initiate: {
    id: 'momentum_initiate',
    name: 'Momentum Initiate',
    description: 'Reached 100+ total Momentum Points. The engine is warming up.',
    icon: '🔥',
    color: 'border-amber-500 bg-amber-50 text-amber-800'
  },
  zerohour_master: {
    id: 'zerohour_master',
    name: 'Zero Hour Master',
    description: 'Reached 500+ total Momentum Points. High-pressure situations are now your playground.',
    icon: '⚡',
    color: 'border-rose-500 bg-rose-50 text-rose-800'
  },
  regulator_intern: {
    id: 'regulator_intern',
    name: 'Regulator Intern',
    description: 'Activated the Breathing Regulator guide during a Panic Mode session.',
    icon: '🌀',
    color: 'border-purple-500 bg-purple-50 text-purple-800'
  }
};

export default function PanicTimer({ selectedTask = null, tasks = [], onSelectTask }: PanicTimerProps) {
  // Timer States
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [isMuted, setIsMuted] = useState(false);

  // Breathing Guide States
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)'>('Inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);

  // Gamification States
  const [isPanicModeActive, setIsPanicModeActive] = useState(false);
  const [hasSwitchedTabs, setHasSwitchedTabs] = useState(false);
  const [momentumPoints, setMomentumPoints] = useState<number>(() => {
    const saved = localStorage.getItem('zerohour_momentum_points');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [focusStreak, setFocusStreak] = useState<number>(() => {
    const saved = localStorage.getItem('zerohour_focus_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('zerohour_unlocked_badges');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAbortModal, setShowAbortModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    pointsEarned: number;
    streakBonus: number;
    flawless: boolean;
    streakIncremented: boolean;
  } | null>(null);

  const [customFocusGoal, setCustomFocusGoal] = useState('');
  const [completeTrigger, setCompleteTrigger] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State ref for timers to access without stale state closures
  const stateRef = useRef({
    isPanicModeActive,
    hasSwitchedTabs,
    momentumPoints,
    focusStreak,
    isMuted
  });

  useEffect(() => {
    stateRef.current = {
      isPanicModeActive,
      hasSwitchedTabs,
      momentumPoints,
      focusStreak,
      isMuted
    };
  }, [isPanicModeActive, hasSwitchedTabs, momentumPoints, focusStreak, isMuted]);

  // Handle badge unlocks helper
  const unlockBadge = (badgeId: string) => {
    setUnlockedBadges(prev => {
      if (prev.includes(badgeId)) return prev;
      const next = [...prev, badgeId];
      localStorage.setItem('zerohour_unlocked_badges', JSON.stringify(next));
      return next;
    });
  };

  // Completion Logic
  const handlePanicComplete = () => {
    const flawless = !hasSwitchedTabs;
    const basePoints = flawless ? 100 : 50;
    
    // Streak calculation
    let newStreak = focusStreak;
    if (flawless) {
      newStreak += 1;
    } else {
      newStreak = 0;
    }
    
    const streakBonus = flawless ? (focusStreak * 15) : 0; // +15 per previous streak days
    const totalEarned = basePoints + streakBonus;
    const newTotalPoints = momentumPoints + totalEarned;
    
    // Persist
    setMomentumPoints(newTotalPoints);
    localStorage.setItem('zerohour_momentum_points', String(newTotalPoints));
    
    setFocusStreak(newStreak);
    localStorage.setItem('zerohour_focus_streak', String(newStreak));
    
    // Unlock badges based on conditions
    if (flawless) {
      unlockBadge('impenetrable_fortress');
    } else {
      unlockBadge('slightly_distracted');
    }
    
    if (newTotalPoints >= 100) {
      unlockBadge('momentum_initiate');
    }
    if (newTotalPoints >= 500) {
      unlockBadge('zerohour_master');
    }
    
    setSuccessDetails({
      pointsEarned: basePoints,
      streakBonus,
      flawless,
      streakIncremented: flawless
    });
    
    setShowSuccessModal(true);
    setIsPanicModeActive(false);
    resetTimer();
  };

  useEffect(() => {
    if (completeTrigger > 0) {
      handlePanicComplete();
    }
  }, [completeTrigger]);

  // Tab switching monitoring
  useEffect(() => {
    if (!isPanicModeActive || !isRunning) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setHasSwitchedTabs(true);
        if (!isMuted) {
          synth.playTick(); // sound cue for broken shield
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPanicModeActive, isRunning, isMuted]);

  // Focus Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
          // Play a very subtle tick sound occasionally if not muted
          if (!isMuted && seconds % 5 === 0) {
            synth.playTick();
          }
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer Complete!
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (!isMuted) {
              synth.playZenChime();
            }
            
            if (stateRef.current.isPanicModeActive) {
              setCompleteTrigger(prev => prev + 1);
            } else {
              alert("⏰ Emergency Focus Session Complete! Excellent effort. Take a quick moment to check in.");
              resetTimer();
            }
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, minutes, seconds, isMuted]);

  // Breathing Box Meditation Logic
  useEffect(() => {
    if (isBreathingActive) {
      if (!isMuted) {
        synth.startBreathingDrone();
        synth.sweepDrone('in', 4);
      }

      breathTimerRef.current = setInterval(() => {
        setBreathCountdown(prev => {
          if (prev <= 1) {
            // Phase transition
            setBreathPhase(currentPhase => {
              let nextPhase: typeof breathPhase = 'Inhale';
              if (currentPhase === 'Inhale') {
                nextPhase = 'Hold (Full)';
                if (!isMuted) synth.sweepDrone('out', 4); // maintain state or slow release
              } else if (currentPhase === 'Hold (Full)') {
                nextPhase = 'Exhale';
                if (!isMuted) synth.sweepDrone('out', 4);
              } else if (currentPhase === 'Exhale') {
                nextPhase = 'Hold (Empty)';
              } else if (currentPhase === 'Hold (Empty)') {
                nextPhase = 'Inhale';
                if (!isMuted) synth.sweepDrone('in', 4);
              }
              return nextPhase;
            });
            return 4; // Reset to 4 seconds box breathing
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      synth.stopBreathingDrone();
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    }

    return () => {
      synth.stopBreathingDrone();
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [isBreathingActive, isMuted]);

  const toggleTimer = () => {
    // Initialise audio on click
    if (!isRunning && !isMuted) {
      synth.playTick();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(selectedDuration);
    setSeconds(0);
  };

  const changeDuration = (mins: number) => {
    setIsRunning(false);
    setSelectedDuration(mins);
    setMinutes(mins);
    setSeconds(0);
    if (!isMuted) {
      synth.playTick();
    }
  };

  const toggleBreathing = () => {
    if (!isBreathingActive && !isMuted) {
      synth.playZenChime();
    }
    setIsBreathingActive(!isBreathingActive);
    setBreathPhase('Inhale');
    setBreathCountdown(4);
  };

  const activatePanicMode = () => {
    setHasSwitchedTabs(false);
    setIsPanicModeActive(true);
    setMinutes(25);
    setSeconds(0);
    setIsRunning(true);
    if (!isMuted) {
      synth.playZenChime();
    }
  };

  const handleAbortPanic = () => {
    setIsRunning(false);
    setIsPanicModeActive(false);
    setFocusStreak(0);
    localStorage.setItem('zerohour_focus_streak', '0');
    unlockBadge('crisis_averted');
    setShowAbortModal(true);
    resetTimer();
  };

  // Render full screen dark/minimalist Panic Mode Overlay
  if (isPanicModeActive) {
    const activeTaskTitle = selectedTask ? selectedTask.title : (customFocusGoal || "Your Critical Focus Target");
    return (
      <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between p-6 md:p-12 font-sans select-none overflow-y-auto">
        {/* Top Header Row */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-400 tracking-widest uppercase">
              ZEROHOUR IMMERSIVE PANIC MODE
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tab monitoring status */}
            <div className={`text-[10px] md:text-xs font-mono px-2.5 py-1 rounded-full border ${
              hasSwitchedTabs 
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold' 
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-pulse font-bold'
            }`}>
              {hasSwitchedTabs 
                ? '⚠️ FOCUS BROKEN (Tab Switched)' 
                : '🛡️ FOCUS SHIELD ACTIVE (2.0x Multiplier)'
              }
            </div>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border border-slate-800 transition-colors ${
                isMuted ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Striking Countdown and Task Card */}
        <div className="max-w-xl w-full mx-auto flex flex-col items-center my-auto py-12">
          {/* Main striking digital clock */}
          <div className="text-8xl sm:text-9xl md:text-[11rem] font-mono font-black text-rose-500 tracking-tighter tabular-nums select-none drop-shadow-[0_0_35px_rgba(244,63,94,0.3)]">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Micro-task card */}
          <div className="w-full bg-slate-900/80 border-2 border-rose-500/30 rounded-2xl p-6 text-center shadow-[0_0_25px_rgba(244,63,94,0.1)] mt-8">
            <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">
              Current Emergency Target
            </span>
            <h3 className="text-lg md:text-xl font-display font-bold mt-2 text-white">
              "{activeTaskTitle}"
            </h3>
            {selectedTask?.notes && (
              <p className="text-xs text-slate-400 mt-2 italic line-clamp-2 max-w-md mx-auto">
                Notes: {selectedTask.notes}
              </p>
            )}
          </div>

          {/* Tactical breathing widget inline */}
          <div className="mt-8 w-full flex flex-col items-center">
            {isBreathingActive ? (
              <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Regulator Phase: <span className="text-emerald-400 font-bold">{breathPhase}</span> ({breathCountdown}s)
                  </span>
                </div>
                <button 
                  onClick={toggleBreathing} 
                  className="text-[10px] font-mono uppercase bg-rose-950/50 text-rose-400 px-2 py-0.5 rounded border border-rose-900/50 hover:bg-rose-900/50"
                >
                  Stop
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  toggleBreathing();
                  unlockBadge('regulator_intern');
                }}
                className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors group bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800"
              >
                <Wind className="w-3.5 h-3.5 group-hover:animate-pulse" />
                Activate Breath Regulator to Lower Cortisol
              </button>
            )}
          </div>
        </div>

        {/* Bottom Control Buttons */}
        <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6 mt-auto">
          <div className="text-xs font-mono text-slate-500">
            Streak: <span className="font-bold text-amber-500">{focusStreak}d</span> • Points: <span className="font-bold text-emerald-400">{momentumPoints}</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold border-2 border-white text-slate-950 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] ${
                isRunning ? 'bg-amber-100 hover:bg-amber-200 border-amber-400' : 'bg-emerald-400 hover:bg-emerald-500 border-emerald-500'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
              {isRunning ? 'Pause Protocol' : 'Resume Protocol'}
            </button>

            <button
              onClick={handleAbortPanic}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-rose-950/30 text-rose-400 border-2 border-rose-500/30 hover:border-rose-500 transition-all font-display font-bold text-sm"
            >
              Abort Crisis Protocol
            </button>
          </div>
          
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest hidden md:block">
            Mute notifications & stay on this page
          </div>
        </div>
      </div>
    );
  }

  // Standard (Non-Panic) Mode Card UI
  return (
    <div id="panic-timer" className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            Crisis Control Focus Block
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Mute notifications, sync your breathing, and tackle one thing.
          </p>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-lg border-2 border-slate-900 transition-colors ${
            isMuted ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
          title={isMuted ? 'Unmute Focus Sounds' : 'Mute Focus Sounds'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Pomodoro Timer Half */}
        <div className="flex flex-col items-center bg-slate-50 border-2 border-slate-950 rounded-xl p-6">
          <div className="flex gap-2 mb-4">
            {[15, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => changeDuration(mins)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md border-2 transition-all ${
                  selectedDuration === mins
                    ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                }`}
              >
                {mins} Min
              </button>
            ))}
          </div>

          <div className="text-5xl font-mono font-bold text-slate-900 my-4 tracking-tight">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-display font-bold border-2 border-slate-900 transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                isRunning ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-emerald-400 hover:bg-emerald-500 text-slate-950'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" /> Pause Block
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="flex items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-900 hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Box Breathing Half */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-amber-50/20">
          <div className="flex flex-col items-center justify-center h-48 w-full relative">
            {isBreathingActive ? (
              <div className="flex flex-col items-center justify-center">
                {/* Expanding Breathing Circle */}
                <div
                  className={`rounded-full border-4 border-slate-900 bg-emerald-400/20 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
                    breathPhase === 'Inhale'
                      ? 'w-36 h-36 scale-110'
                      : breathPhase === 'Hold (Full)'
                      ? 'w-36 h-36 scale-110 border-amber-400 bg-amber-400/20'
                      : breathPhase === 'Exhale'
                      ? 'w-24 h-24 scale-90'
                      : 'w-24 h-24 scale-90 border-blue-400 bg-blue-400/20'
                  }`}
                >
                  <Wind className={`w-8 h-8 text-slate-900 ${breathPhase === 'Inhale' || breathPhase === 'Exhale' ? 'animate-pulse' : ''}`} />
                  <span className="font-mono text-xl font-bold mt-1 text-slate-900">{breathCountdown}s</span>
                </div>

                <div className="text-center mt-3">
                  <span className="font-display font-bold text-sm uppercase tracking-wider text-slate-800 bg-white px-3 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    {breathPhase}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Wind className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-display font-bold text-slate-800 text-sm">Heart Racing? Try Box Breathing</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                  A scientific 4-4-4-4 rhythm to slow down cortisol and sharpen deep cognitive focus.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleBreathing}
            className={`w-full mt-2 py-2 px-4 rounded-lg font-display text-xs font-bold border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 active:translate-y-0 ${
              isBreathingActive
                ? 'bg-rose-400 hover:bg-rose-500 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isBreathingActive ? 'Stop Breathing Guide' : 'Activate Calm Regulator'}
          </button>
        </div>
      </div>

      {/* Gamified Immersive Focus Setup */}
      <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            High-Stakes Focus Engine
          </h3>
        </div>

        {selectedTask ? (
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">Active Session Target</span>
              <p className="text-xs font-bold text-slate-800 truncate">"{selectedTask.title}"</p>
            </div>
            {tasks.length > 1 && onSelectTask && (
              <select
                value={selectedTask.id}
                onChange={(e) => {
                  const found = tasks.find(t => t.id === e.target.value);
                  if (found) onSelectTask(found);
                }}
                className="text-[10px] bg-slate-50 border border-slate-300 rounded p-1 font-sans focus:outline-none focus:border-slate-900 max-w-[120px]"
              >
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-slate-500 uppercase font-semibold block">
              What is your focus target for this session?
            </label>
            <input
              type="text"
              value={customFocusGoal}
              onChange={(e) => setCustomFocusGoal(e.target.value)}
              placeholder="e.g., Drafting marketing slides, reading chap 4..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-sans placeholder-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
        )}

        <button
          onClick={activatePanicMode}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] font-display font-black tracking-tight text-xs uppercase transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          ⚠️ ACTIVATE PANIC MODE
        </button>
      </div>

      {/* Survival Profile Section */}
      <div className="border-t border-slate-150 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-display font-bold text-slate-900 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Your Survival Profile
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              {momentumPoints} pts
            </span>
            <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-amber-500 stroke-none animate-pulse" />
              {focusStreak}d streak
            </span>
          </div>
        </div>

        {/* Unlocked Badges Row */}
        <div>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Unlocked Badges ({unlockedBadges.length} / {Object.keys(BADGES).length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(BADGES).map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-sans transition-all relative group ${
                    isUnlocked 
                      ? badge.color + ' opacity-100 border-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)] font-medium' 
                      : 'border-slate-200 bg-slate-50 text-slate-400 opacity-45 grayscale'
                  }`}
                >
                  <span className="text-xs">{badge.icon}</span>
                  <span className="font-semibold">{badge.name}</span>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 bg-slate-900 text-white text-[9px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-lg text-center font-normal leading-normal">
                    {badge.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Humorous Abort Modal */}
      {showAbortModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-950 p-6 rounded-2xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 border-2 border-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🛡️
            </div>
            <h3 className="text-xl font-display font-black text-slate-950 uppercase tracking-tight">
              CRISIS AVERTED... BARELY
            </h3>
            <p className="text-sm text-slate-600 mt-2 font-sans leading-relaxed">
              "Fled from a live Panic Mode session to preserve sanity. Hey, surviving to fight another day is also a strategy."
            </p>
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 my-4 text-left">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
                Consequence
              </span>
              <p className="text-xs text-rose-600 font-bold font-mono">
                • Focus Streak reset to 0d (curb your flight instinct next time!)
              </p>
              <p className="text-xs text-emerald-600 font-bold font-mono mt-0.5">
                • Unlocked New Badge: Crisis Averted... Barely!
              </p>
            </div>
            <button
              onClick={() => setShowAbortModal(false)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white border-2 border-slate-950 rounded-xl font-display font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all active:translate-y-0.5"
            >
              Acknowledge & Regroup
            </button>
          </div>
        </div>
      )}

      {/* Grand Success Modal */}
      {showSuccessModal && successDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-950 p-6 rounded-2xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 border-2 border-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🏆
            </div>
            <h3 className="text-xl font-display font-black text-slate-950 uppercase tracking-tight">
              MISSION ACCOMPLISHED!
            </h3>
            <p className="text-sm text-slate-600 mt-2 font-sans leading-relaxed">
              You completely conquered the Zero Hour block! Outstanding discipline under extreme pressure.
            </p>
            
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 my-4 text-left space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <span className="text-xs font-semibold text-slate-700">Base Reward:</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">+{successDetails.pointsEarned} pts</span>
              </div>
              {successDetails.streakBonus > 0 && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="text-xs font-semibold text-slate-700">Streak Multiplier Bonus:</span>
                  <span className="text-xs font-bold text-amber-600 font-mono">+{successDetails.streakBonus} pts</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-xs font-bold text-slate-900">Total Momentum Earned:</span>
                <span className="text-sm font-black text-emerald-600 font-mono">
                  +{successDetails.pointsEarned + successDetails.streakBonus} pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2">
                <span className="text-[9px] font-mono text-amber-700 block uppercase">New Streak</span>
                <span className="text-base font-bold text-amber-900 font-mono">{focusStreak}d</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                <span className="text-[9px] font-mono text-emerald-700 block uppercase">Total Balance</span>
                <span className="text-base font-bold text-emerald-900 font-mono">{momentumPoints} pts</span>
              </div>
            </div>

            {successDetails.flawless ? (
              <div className="bg-emerald-50 text-emerald-800 text-[9px] font-mono py-1 px-3 rounded-full border border-emerald-300 inline-block mb-4">
                🛡️ IMPENETRABLE FORTRESS ACTIVE: 0 tab switches detected!
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-600 text-[9px] font-mono py-1 px-3 rounded-full border border-slate-300 inline-block mb-4">
                🐈 VICTORIOUS DISTRACTION: Complete with minor tab-switching
              </div>
            )}

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white border-2 border-slate-950 rounded-xl font-display font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all active:translate-y-0.5"
            >
              Claim Rewards & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
