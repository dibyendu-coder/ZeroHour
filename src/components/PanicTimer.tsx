import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Sparkles, Volume2, VolumeX, Bell } from 'lucide-react';
import { synth } from '../utils/synth';

export default function PanicTimer() {
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathTimerRef = useRef<NodeJS.Timeout | null>(null);

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
            alert("⏰ Emergency Focus Session Complete! Excellent effort. Take a quick moment to check in.");
            resetTimer();
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

  return (
    <div id="panic-timer" className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
      <div className="flex items-center justify-between mb-6">
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
    </div>
  );
}
