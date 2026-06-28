import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertOctagon, 
  Sparkles, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  Compass, 
  Flame, 
  Coffee, 
  Megaphone, 
  Volume2, 
  CheckCircle, 
  Calendar, 
  Smile, 
  ArrowRight, 
  Clock, 
  Clipboard, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  Lock,
  Mail,
  XCircle,
  HelpCircle
} from 'lucide-react';
import PanicTimer from './components/PanicTimer';
import { Task, SurvivalPlan, Habit, TriageResult, ProcrastinationRisk, ExcuseDraft, PepTalk } from './types';
import { pcmToWavBlob } from './utils/audio';
import { initAuth, googleSignIn, logout } from './utils/firebaseAuth';
import { listUpcomingEvents, createCalendarEvent, CalendarEvent } from './utils/calendarService';
import { User } from 'firebase/auth';

// Default tasks for an instant, engaging experience
const INITIAL_TASKS: Task[] = [];

// Default habits to showcase routine momentum
const INITIAL_HABITS: Habit[] = [];

export default function App() {
  // --- Persistent State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('saver_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('saver_habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  // --- UI and AI Output States ---
  const [activeTab, setActiveTab] = useState<'triage' | 'planner' | 'peptalk' | 'excuse' | 'risk' | 'calendar'>('triage');
  const [loading, setLoading] = useState<boolean>(false);
  
  // --- Google Calendar State ---
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(false);
  const [calendarSuccessMessage, setCalendarSuccessMessage] = useState<string | null>(null);
  const [calendarErrorMessage, setCalendarErrorMessage] = useState<string | null>(null);

  // Initialize Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        // Automatically fetch events if we have a token
        fetchCalendarEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchCalendarEvents = async (token: string) => {
    setCalendarLoading(true);
    setCalendarErrorMessage(null);
    try {
      const events = await listUpcomingEvents(token);
      setCalendarEvents(events);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      setCalendarErrorMessage('Could not load calendar events. Your access token may have expired. Please disconnect and reconnect.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setCalendarLoading(true);
    setCalendarErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        await fetchCalendarEvents(res.accessToken);
        setCalendarSuccessMessage('Successfully connected to Google Calendar!');
        setTimeout(() => setCalendarSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setCalendarErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setCalendarEvents([]);
      setCalendarSuccessMessage('Disconnected from Google Calendar.');
      setTimeout(() => setCalendarSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  const handleImportEventAsTask = (event: CalendarEvent) => {
    const title = event.summary || 'Google Calendar Event';
    const deadline = event.start.dateTime 
      ? new Date(event.start.dateTime).toISOString().slice(0, 16)
      : event.start.date
        ? new Date(event.start.date).toISOString().slice(0, 16)
        : new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16);

    const imported: Task = {
      id: `task-${Date.now()}`,
      title,
      deadline,
      difficulty: 'medium',
      panicLevel: 5,
      category: 'personal',
      completed: false,
      notes: `Imported from Google Calendar event. Location/details: ${event.description || 'None'}`
    };

    setTasks((prev) => [imported, ...prev]);
    setSelectedPlanTask((prev) => prev || imported);
    setCalendarSuccessMessage(`Imported "${title}" into your Crisis Queue!`);
    setTimeout(() => setCalendarSuccessMessage(null), 5000);
  };

  const handleExportDeadline = async (task: Task) => {
    if (!googleToken) {
      alert('Please connect to Google Calendar first.');
      return;
    }
    const confirmed = window.confirm(`Schedule task deadline "${task.title}" on your Google Calendar?`);
    if (!confirmed) return;

    setCalendarLoading(true);
    setCalendarSuccessMessage(null);
    setCalendarErrorMessage(null);

    try {
      const startIso = new Date(task.deadline).toISOString();
      // Schedule end time 30 mins after start
      const endIso = new Date(new Date(task.deadline).getTime() + 30 * 60 * 1000).toISOString();

      await createCalendarEvent(googleToken, {
        summary: `🚨 DEADLINE: ${task.title}`,
        description: `This is your critical deadline scheduled from ZeroHour. Notes: ${task.notes || 'None'}`,
        startTime: startIso,
        endTime: endIso
      });

      setCalendarSuccessMessage(`Successfully added "${task.title}" deadline to your Google Calendar!`);
      setTimeout(() => setCalendarSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setCalendarErrorMessage('Failed to export deadline. Please check your permissions.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleExportSurvivalPlan = async (task: Task, plan: SurvivalPlan) => {
    if (!googleToken) {
      alert('Please connect to Google Calendar first.');
      return;
    }
    const confirmed = window.confirm(`This will schedule all ${plan.steps.length} survival steps of your survival plan for "${task.title}" as calendar events starting today. Proceed?`);
    if (!confirmed) return;

    setCalendarLoading(true);
    setCalendarSuccessMessage(null);
    setCalendarErrorMessage(null);

    try {
      let currentStartTime = Date.now() + 10 * 60 * 1000; // start 10 minutes from now

      for (const step of plan.steps) {
        const stepStart = new Date(currentStartTime);
        const stepEnd = new Date(currentStartTime + step.durationMinutes * 60 * 1000);

        await createCalendarEvent(googleToken, {
          summary: `⚡ Survival Block: ${step.title} [${task.title}]`,
          description: `Focused time block created by ZeroHour.\n\nTask: ${task.title}\nStep Details: ${step.description}\nDuration: ${step.durationMinutes} minutes.`,
          startTime: stepStart.toISOString(),
          endTime: stepEnd.toISOString()
        });

        // Next step starts after a 5-minute break
        currentStartTime = stepEnd.getTime() + 5 * 60 * 1000;
      }

      setCalendarSuccessMessage(`Successfully scheduled ${plan.steps.length} survival blocks on your Google Calendar!`);
      setTimeout(() => setCalendarSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setCalendarErrorMessage('Failed to schedule survival plan blocks. Please try again.');
    } finally {
      setCalendarLoading(false);
    }
  };

  // New Task Input Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newTaskPanic, setNewTaskPanic] = useState<number>(5);
  const [newTaskCategory, setNewTaskCategory] = useState<Task['category']>('academic');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // New Habit Input Form State
  const [newHabitName, setNewHabitName] = useState('');

  // AI Generated Results
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [selectedPlanTask, setSelectedPlanTask] = useState<Task | null>(() => {
    const saved = localStorage.getItem('saver_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {}
    }
    return null;
  });
  const [survivalPlan, setSurvivalPlan] = useState<SurvivalPlan | null>(null);
  
  // Pep Talk State
  const [pepVibe, setPepVibe] = useState<'soothing' | 'tough-love' | 'energetic'>('soothing');
  const [pepTalk, setPepTalk] = useState<PepTalk | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Excuse Form State
  const [excuseTask, setExcuseTask] = useState<string>('');
  const [excuseReason, setExcuseReason] = useState<string>('unforeseen technical block');
  const [excuseVibe, setExcuseVibe] = useState<string>('tactful-professional');
  const [excuseDraft, setExcuseDraft] = useState<ExcuseDraft | null>(null);

  // Risk Score State
  const [riskAnalysis, setRiskAnalysis] = useState<ProcrastinationRisk | null>(null);

  // Copied alert helpers
  const [copiedText, setCopiedText] = useState<'draft' | 'excuse' | null>(null);

  // --- Synchronise State to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('saver_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('saver_habits', JSON.stringify(habits));
  }, [habits]);

  // Handle Clean Cleanup of Audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // --- Task Management CRUD ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const deadlineStr = newTaskDeadline || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16);

    const created: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      deadline: deadlineStr,
      difficulty: newTaskDifficulty,
      panicLevel: newTaskPanic,
      category: newTaskCategory,
      completed: false,
      notes: newTaskNotes.trim() || undefined
    };

    setTasks(prev => [created, ...prev]);
    
    // Auto select newly created task for planner
    setSelectedPlanTask(created);

    // Reset inputs
    setNewTaskTitle('');
    setNewTaskDeadline('');
    setNewTaskDifficulty('medium');
    setNewTaskPanic(5);
    setNewTaskNotes('');
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedPlanTask?.id === id) {
      setSelectedPlanTask(null);
    }
  };

  // --- Habit Management ---
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const created: Habit = {
      id: `habit-${Date.now()}`,
      name: newHabitName.trim(),
      frequency: 'daily',
      streak: 1
    };

    setHabits(prev => [...prev, created]);
    setNewHabitName('');
  };

  const handleIncrementStreak = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const todayStr = new Date().toDateString();
        if (h.lastCompleted === todayStr) {
          // Already completed today, toggling back
          return { ...h, streak: Math.max(0, h.streak - 1), lastCompleted: undefined };
        } else {
          return { ...h, streak: h.streak + 1, lastCompleted: todayStr };
        }
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // --- API Calls (Gemini Integrations) ---

  // 1. Triage Call
  const triggerAutoTriage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });
      const data = await response.json();
      if (response.ok) {
        setTriageResult(data);
        setActiveTab('triage');
      } else {
        alert("Server Error: " + (data.error || "Failed to analyze tasks"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error: Make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Plan Call
  const triggerSurvivalPlan = async (task: Task) => {
    setLoading(true);
    setSelectedPlanTask(task);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
      const data = await response.json();
      if (response.ok) {
        setSurvivalPlan(data);
        setActiveTab('planner');
      } else {
        alert("Server Error: " + (data.error || "Failed to build survival plan"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error generating survival plan.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Pep Talk Call (Includes TTS PCM audio)
  const triggerPepTalk = async () => {
    setLoading(true);
    setPepTalk(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const currentTaskTitle = selectedPlanTask ? selectedPlanTask.title : "your impending challenges";
    const currentPanicLevel = selectedPlanTask ? selectedPlanTask.panicLevel : 7;

    try {
      const response = await fetch('/api/peptalk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: currentTaskTitle,
          panicLevel: currentPanicLevel,
          vibe: pepVibe
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPepTalk(data);
        setActiveTab('peptalk');

        // Check if TTS base64 is available and prepare standard wav
        if (data.audioBase64) {
          try {
            const wavBlob = pcmToWavBlob(data.audioBase64, 24000);
            const blobUrl = URL.createObjectURL(wavBlob);
            setAudioUrl(blobUrl);
          } catch (e) {
            console.error("Failed to decode base64 audio payload to WAV", e);
          }
        }
      } else {
        alert("Server Error: " + (data.error || "Failed to generate pep talk"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error generating pep talk.");
    } finally {
      setLoading(false);
    }
  };

  // Playback of vocal file
  const playVocalAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    setIsPlayingAudio(true);
    audio.play();
    audio.onended = () => {
      setIsPlayingAudio(false);
    };
    audio.onerror = () => {
      setIsPlayingAudio(false);
      alert("Failed to play the synthesized vocal audio.");
    };
  };

  // 4. Excuse Apology Draft Call
  const triggerExcuseDraft = async () => {
    setLoading(true);
    try {
      const title = excuseTask || (selectedPlanTask ? selectedPlanTask.title : "the current project deliverables");
      const response = await fetch('/api/generate-excuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: title,
          reasonCategory: excuseReason,
          vibe: excuseVibe
        })
      });
      const data = await response.json();
      if (response.ok) {
        setExcuseDraft(data);
        setActiveTab('excuse');
      } else {
        alert("Server Error: " + (data.error || "Failed to draft extension email"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error generating draft.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Procrastination Risk CBT Call
  const triggerProcrastinationRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/procrastination-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, habits })
      });
      const data = await response.json();
      if (response.ok) {
        setRiskAnalysis(data);
        setActiveTab('risk');
      } else {
        alert("Server Error: " + (data.error || "Failed to analyze cognitive risk"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Network Error analyzing risk.");
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, type: 'draft' | 'excuse') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Initialize and load AI data on first launch if empty
  useEffect(() => {
    if (tasks.length > 0 && !triageResult) {
      // Perform initial background triage so the interface feels pre-analyzed
      triggerAutoTriage();
    }
  }, []);

  // Format Helper
  const formatDeadline = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMs = d.getTime() - Date.now();
      const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
      
      let badgeColor = "bg-slate-100 text-slate-700 border-slate-300";
      let timeStr = "";

      if (diffHrs < 0) {
        badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
        timeStr = `Overdue by ${Math.abs(diffHrs)}h`;
      } else if (diffHrs <= 12) {
        badgeColor = "bg-rose-500 text-white border-rose-600 animate-pulse";
        timeStr = `CRITICAL: ${diffHrs} hrs left!`;
      } else if (diffHrs <= 24) {
        badgeColor = "bg-amber-400 text-slate-950 border-amber-500";
        timeStr = `RUSH: ${diffHrs} hrs left`;
      } else {
        badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
        timeStr = `${Math.round(diffHrs / 24)} days left`;
      }

      return {
        formattedDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        urgencyBadge: (
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${badgeColor}`}>
            {timeStr}
          </span>
        )
      };
    } catch (e) {
      return { formattedDate: isoString, urgencyBadge: null };
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans p-4 md:p-8 selection:bg-emerald-300 selection:text-slate-950">
      {/* Header Command Bar */}
      <header className="max-w-7xl mx-auto mb-8 bg-slate-900 text-white rounded-2xl p-6 border-3 border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500 rounded-full filter blur-3xl opacity-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-500 rounded-xl border border-rose-400 animate-bounce">
                <AlertOctagon className="w-6 h-6 text-white" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight flex items-center gap-2">
                  ZEROHOUR
                </h1>
                <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest mt-1">
                  AI-Powered Emergency Command Center for impendent deadlines
                </p>
              </div>
            </div>
            <p className="text-slate-350 text-sm mt-3 max-w-2xl">
              Procrastinated yourself into a corner? Don't panic. Triage your active workload, generate step-by-step 
              survival blueprints with real starter text, listen to a custom voice pep-talk, and negotiate extensions tactfully.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={triggerAutoTriage}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-display font-black text-sm border-2 border-slate-950 transition-transform active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              {loading ? "SAVING YOUR LIFE..." : "RUN AI AUTO-TRIAGE"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Input, Custom Workspace, Habits) - Spans 5 cols */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section: Task Input & Manager */}
          <div className="bg-white border-2 border-slate-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-slate-100">
              <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-rose-500" />
                Active Crisis Queue ({tasks.length})
              </h2>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Local State
              </span>
            </div>

            {/* Simple Add Task Inline Form */}
            <form onSubmit={handleAddTask} className="space-y-4 mb-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Log Looming Deadline
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task or Deliverable Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101 Essay, Tax return, Marketing Slides"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border-2 border-slate-300 focus:border-slate-900 focus:outline-none bg-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Deadline</label>
                  <input
                    type="datetime-local"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full text-xs px-2 py-2 rounded-lg border-2 border-slate-300 focus:border-slate-900 focus:outline-none bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as Task['category'])}
                    className="w-full text-xs px-2 py-2 rounded-lg border-2 border-slate-300 focus:border-slate-900 focus:outline-none bg-white"
                  >
                    <option value="academic">🎓 Academic</option>
                    <option value="professional">💼 Professional</option>
                    <option value="personal">🏠 Personal</option>
                    <option value="household">⚡ Household/Bill</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Complexity</label>
                  <div className="flex gap-1">
                    {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNewTaskDifficulty(lvl)}
                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
                          newTaskDifficulty === lvl
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
                    <span>Panic Factor</span>
                    <span className="font-mono text-rose-500 font-bold">{newTaskPanic}/10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newTaskPanic}
                    onChange={(e) => setNewTaskPanic(Number(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Additional Context (Notes / Prompt Hints)</label>
                <textarea
                  placeholder="Mention what makes this hard or what content you need..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border-2 border-slate-300 focus:border-slate-900 focus:outline-none bg-white font-sans h-12 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-display text-xs font-bold rounded-lg border-2 border-slate-900 transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
              >
                Insert Task to Crisis Queue
              </button>
            </form>

            {/* Task List */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Smile className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No active tasks in your queue!</p>
                  <p className="text-xs text-slate-400 mt-1">Excellent job keeping your schedule clean.</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const dl = formatDeadline(task.deadline);
                  const isSelected = selectedPlanTask?.id === task.id;
                  return (
                    <div 
                      key={task.id}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]' 
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                      }`}
                      onClick={() => setSelectedPlanTask(task)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTaskCompleted(task.id);
                            }}
                            className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                          />
                          <div>
                            <p className={`text-sm font-display font-bold leading-tight ${task.completed ? 'line-through text-slate-400' : ''}`}>
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-450 mt-1 flex items-center gap-1 font-mono">
                              <span>{task.category === 'academic' ? '🎓' : task.category === 'professional' ? '💼' : task.category === 'personal' ? '🏠' : '⚡'}</span>
                              <span>• Diff: {task.difficulty}</span>
                              <span className="text-rose-400 font-bold">• Panic: {task.panicLevel}/10</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className={`p-1 rounded hover:bg-rose-100 ${isSelected ? 'text-rose-400 hover:text-rose-600' : 'text-slate-400 hover:text-rose-600'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-450 font-mono">
                          {dl.formattedDate}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {dl.urgencyBadge}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSurvivalPlan(task);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                              isSelected 
                                ? 'bg-emerald-400 border-emerald-500 text-slate-950 hover:bg-emerald-300' 
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            Plan ⚡
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Habit Tracker / Anti-Procrastination Momentum */}
          <div className="bg-white border-2 border-slate-950 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-emerald-500" />
              Momentum Pre-emptor
            </h2>
            <p className="text-xs text-slate-500 font-sans mb-4">
              Complete these protective micro-routines daily to clear your cognitive load and prevent tomorrow's emergencies.
            </p>

            <form onSubmit={handleAddHabit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New momentum trigger..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-lg border-2 border-slate-300 focus:border-slate-900 focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 px-3 rounded-lg text-xs font-bold"
              >
                Add
              </button>
            </form>

            <div className="space-y-2">
              {habits.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500">No habit triggers active</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Log custom daily actions to build proactive momentum!</p>
                </div>
              ) : (
                habits.map((h) => {
                  const todayStr = new Date().toDateString();
                  const isDoneToday = h.lastCompleted === todayStr;
                  return (
                    <div key={h.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-400 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleIncrementStreak(h.id)}
                          className={`p-1 rounded-md border-2 transition-all ${
                            isDoneToday 
                              ? 'bg-emerald-400 border-emerald-500 text-slate-950' 
                              : 'bg-white border-slate-300 hover:border-slate-900 text-slate-400 hover:text-slate-900'
                          }`}
                          title="Mark trigger completed for today"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <div>
                          <span className={`text-xs font-bold font-display ${isDoneToday ? 'line-through text-slate-400' : 'text-slate-850'}`}>
                            {h.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">Streak:</span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1 rounded flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-amber-500 stroke-none" />
                              {h.streak}d
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(h.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sticky Panic Timer and Deep Focus Breathing Column */}
          <PanicTimer />

        </div>

        {/* Right Column (AI Command Centers, Tabs & Outputs) - Spans 7 cols */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* AI Tab Selectors */}
          <div className="bg-slate-200 border-2 border-slate-950 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <button
              onClick={() => setActiveTab('triage')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'triage'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-500" />
              1. Auto-Triage Matrix
            </button>
            <button
              onClick={() => {
                if (selectedPlanTask && (!survivalPlan || survivalPlan.taskId !== selectedPlanTask.id)) {
                  triggerSurvivalPlan(selectedPlanTask);
                } else {
                  setActiveTab('planner');
                }
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'planner'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-500" />
              2. Survival Planner
            </button>
            <button
              onClick={() => setActiveTab('peptalk')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'peptalk'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <Megaphone className="w-4 h-4 text-amber-500" />
              3. Pep-Talk Coach
            </button>
            <button
              onClick={() => setActiveTab('excuse')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'excuse'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-500" />
              4. Apology Drafts
            </button>
            <button
              onClick={triggerProcrastinationRisk}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'risk'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <Coffee className="w-4 h-4 text-purple-500" />
              5. Cognitive Risk
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-display font-black border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                  : 'text-slate-700 border-transparent hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-rose-500" />
              6. Google Calendar Sync
            </button>
          </div>

          {/* AI Output Container */}
          <div className="bg-white border-2 border-slate-950 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] min-h-[400px] relative">
            
            {/* Global Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse absolute" />
                </div>
                <h3 className="text-lg font-display font-black text-slate-900">GEMINI CRITICAL RE-SCHEDULING...</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Slicing through deadlines with real-time mental support</p>
              </div>
            )}

            {/* TAB 1: AUTO-TRIAGE MATRIX */}
            {activeTab === 'triage' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-5 h-5 text-rose-500" />
                      Eisenhower Emergency Matrix
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Automatically calculated matrix categorizing tasks by hard-deadlines, complexity, and panic stress levels.
                    </p>
                  </div>
                  <button 
                    onClick={triggerAutoTriage}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Triage
                  </button>
                </div>

                {triageResult ? (
                  <>
                    {/* Global Analysis Card */}
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Smile className="w-24 h-24 text-emerald-900" />
                      </div>
                      <h4 className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest mb-1">
                        Crisis Coach Direct Assessment:
                      </h4>
                      <p className="text-sm text-slate-800 italic leading-relaxed">
                        "{triageResult.globalAnalysis}"
                      </p>
                    </div>

                    {/* Matrix Quadrants (2x2 Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quadrant: Do Now */}
                      <div className="p-4 bg-rose-50/50 border border-rose-300 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <h4 className="font-display font-bold text-sm text-rose-950 uppercase tracking-wide">
                            {triageResult.categories.emergency.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 italic">
                          {triageResult.categories.emergency.description}
                        </p>
                        <div className="space-y-1.5">
                          {triageResult.categories.emergency.taskIds.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No tasks in immediate emergency.</p>
                          ) : (
                            triageResult.categories.emergency.taskIds.map(tid => {
                              const t = tasks.find(x => x.id === tid);
                              if (!t) return null;
                              return (
                                <div 
                                  key={tid} 
                                  onClick={() => triggerSurvivalPlan(t)}
                                  className="p-2 bg-white hover:bg-rose-100 text-rose-950 border border-rose-200 hover:border-rose-400 rounded text-xs font-bold flex items-center justify-between cursor-pointer"
                                >
                                  <span>⚠️ {t.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Quadrant: Quick Wins */}
                      <div className="p-4 bg-amber-50/50 border border-amber-300 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <h4 className="font-display font-bold text-sm text-amber-950 uppercase tracking-wide">
                            {triageResult.categories.quickWins.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 italic">
                          {triageResult.categories.quickWins.description}
                        </p>
                        <div className="space-y-1.5">
                          {triageResult.categories.quickWins.taskIds.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No rapid momentum builders right now.</p>
                          ) : (
                            triageResult.categories.quickWins.taskIds.map(tid => {
                              const t = tasks.find(x => x.id === tid);
                              if (!t) return null;
                              return (
                                <div 
                                  key={tid} 
                                  onClick={() => triggerSurvivalPlan(t)}
                                  className="p-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-200 hover:border-amber-400 rounded text-xs font-bold flex items-center justify-between cursor-pointer"
                                >
                                  <span>🚀 {t.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Quadrant: Schedule / Plan */}
                      <div className="p-4 bg-blue-50/50 border border-blue-300 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h4 className="font-display font-bold text-sm text-blue-950 uppercase tracking-wide">
                            {triageResult.categories.schedule.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 italic">
                          {triageResult.categories.schedule.description}
                        </p>
                        <div className="space-y-1.5">
                          {triageResult.categories.schedule.taskIds.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nothing scheduled yet.</p>
                          ) : (
                            triageResult.categories.schedule.taskIds.map(tid => {
                              const t = tasks.find(x => x.id === tid);
                              if (!t) return null;
                              return (
                                <div 
                                  key={tid} 
                                  onClick={() => triggerSurvivalPlan(t)}
                                  className="p-2 bg-white hover:bg-blue-100 text-blue-950 border border-blue-200 hover:border-blue-400 rounded text-xs font-bold flex items-center justify-between cursor-pointer"
                                >
                                  <span>📅 {t.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Quadrant: Postpone / Negotiate */}
                      <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                          <h4 className="font-display font-bold text-sm text-slate-950 uppercase tracking-wide">
                            {triageResult.categories.postpone.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mb-3 italic">
                          {triageResult.categories.postpone.description}
                        </p>
                        <div className="space-y-1.5">
                          {triageResult.categories.postpone.taskIds.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No low-stress items.</p>
                          ) : (
                            triageResult.categories.postpone.taskIds.map(tid => {
                              const t = tasks.find(x => x.id === tid);
                              if (!t) return null;
                              return (
                                <div 
                                  key={tid} 
                                  onClick={() => triggerSurvivalPlan(t)}
                                  className="p-2 bg-white hover:bg-slate-200 text-slate-950 border border-slate-200 hover:border-slate-400 rounded text-xs font-bold flex items-center justify-between cursor-pointer"
                                >
                                  <span>💤 {t.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Immediate Top Action Items checklist */}
                    <div className="mt-4 p-4 bg-amber-500/10 border-2 border-dashed border-amber-400 rounded-xl">
                      <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <CheckCircle className="w-4 h-4 text-amber-600" /> Immediate Tactical Action checklist (Do Now!)
                      </h4>
                      <ul className="space-y-1.5">
                        {triageResult.topActionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                            <span className="text-amber-600">⚡</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-display font-bold text-slate-700">Triage Matrix Not Computed</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Let Gemini analyze your active workload, deadline proximity, and difficulty weights to build your personalized grid.
                    </p>
                    <button
                      onClick={triggerAutoTriage}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-display text-xs font-bold rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                    >
                      Analyze & Compute Matrix
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SURVIVAL PLANNER */}
            {activeTab === 'planner' && (
              <div className="space-y-6">
                <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-5 h-5 text-emerald-500" />
                      Survival Action Blueprint
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Select any active task on the left queue, then click "Generate Survival Plan".
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">Selected:</span>
                    <span className="text-xs font-mono bg-slate-150 border px-2 py-1 rounded max-w-[180px] truncate text-slate-800 font-bold">
                      {selectedPlanTask ? selectedPlanTask.title : "No task selected"}
                    </span>
                  </div>
                </div>

                {survivalPlan ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Reassurance Header */}
                    <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-xl">
                      <p className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Time Budget Strategy
                      </p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{survivalPlan.timeBudgetSummary}</p>
                    </div>

                    {/* Step-by-Step Focus Blocks */}
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Tactical Execution Steps
                      </h4>
                      <div className="space-y-3">
                        {survivalPlan.steps.map((step, index) => (
                          <div key={step.id} className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-400 transition-colors">
                            <div className="bg-slate-900 text-white font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-900 font-display">
                                  {step.title}
                                </h5>
                                <span className="bg-slate-200 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                                  ⏱️ {step.durationMinutes} Min
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="p-3.5 bg-amber-500/10 border-2 border-dashed border-amber-400 rounded-xl">
                      <p className="text-xs text-amber-800 font-bold font-mono">💡 Psychological Pro-Tip to maintain speed:</p>
                      <p className="text-xs text-slate-850 mt-1 italic font-semibold">"{survivalPlan.proTip}"</p>
                    </div>

                    {/* Starter Blueprint / Draft */}
                    <div className="border-2 border-slate-950 rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                          <span className="font-mono text-xs text-slate-300 ml-2 font-bold">{survivalPlan.draftTitle}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(survivalPlan.draftContent, 'draft')}
                          className="text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded border border-slate-700 flex items-center gap-1.5"
                        >
                          {copiedText === 'draft' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3 h-3" /> Copy Draft
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-400 h-[280px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {survivalPlan.draftContent}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-display font-bold text-slate-700">No Survival Plan Active</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Generate a step-by-step master strategy and customized starter blueprint (code scaffolding, study templates, outline thesis) for:
                    </p>
                    {selectedPlanTask ? (
                      <button
                        onClick={() => triggerSurvivalPlan(selectedPlanTask)}
                        className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-display text-xs font-black rounded-xl border-2 border-slate-950 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                      >
                        ⚡ Plan: "{selectedPlanTask.title}"
                      </button>
                    ) : (
                      <p className="text-xs text-rose-500 font-bold italic">
                        Please select or create an active task on the left first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PEP TALK COACH */}
            {activeTab === 'peptalk' && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    High-Performance Vocal Coach
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Feeling paralyzed by anxiety? Select your coach style, then click "Generate & Hear Coach".
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Select Coach Voice & Vibe</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'soothing', label: '🍃 Zephyr (Calm)', desc: 'Stress Reducer' },
                          { id: 'tough-love', label: '🔥 Fenrir (Tough)', desc: 'Anti-Excuse' },
                          { id: 'energetic', label: '⚡ Kore (Energy)', desc: 'Cheerleader' }
                        ].map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setPepVibe(v.id as any)}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                              pepVibe === v.id
                                ? 'bg-amber-500 border-slate-950 text-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <p className="text-xs font-bold font-display">{v.label}</p>
                            <p className="text-[9px] opacity-75 mt-0.5">{v.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={triggerPepTalk}
                      disabled={loading}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-display text-sm font-black rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    >
                      📣 GENERATE VOCAL COACH SPEECH
                    </button>
                  </div>

                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[180px] text-center">
                    {pepTalk ? (
                      <div className="w-full">
                        {/* Audio Wave Visualizer Simulation */}
                        {audioUrl ? (
                          <div className="mb-4">
                            <button
                              onClick={playVocalAudio}
                              className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 ${
                                isPlayingAudio ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-emerald-400 text-slate-950'
                              }`}
                            >
                              <Volume2 className="w-6 h-6" />
                            </button>
                            <p className="text-[10px] font-mono font-bold mt-2 text-slate-600 uppercase tracking-widest">
                              {isPlayingAudio ? "🎙️ Playing voice coach..." : "Click to play synthesized voice"}
                            </p>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic mb-4">
                            (WAV synthesized voice not fully supported on this frame context; reading only)
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                          <p className="text-sm font-display font-medium text-slate-800 italic leading-relaxed">
                            "{pepTalk.text}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Volume2 className="w-10 h-10 text-slate-350 mb-2 animate-pulse" />
                        <h4 className="font-display font-bold text-slate-650 text-sm">Vocal Pep-Talk Awaiting Trigger</h4>
                        <p className="text-xs text-slate-450 max-w-[240px] mt-1">
                          Gemini will write a specific mental boost text and speak it to you using real TTS audio synthesis.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXCUSE/APOLOGY DRAFTS */}
            {activeTab === 'excuse' && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-5 h-5 text-blue-500" />
                    Extension Request & Apology Builder
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Need extra time? Generate an extremely respectful, polite, professional draft to maximize success rates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3 md:col-span-1 bg-slate-50 border p-4 rounded-xl">
                    <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide">
                      Draft Inputs
                    </h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Select Task Context</label>
                      <select
                        value={excuseTask}
                        onChange={(e) => setExcuseTask(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border bg-white focus:outline-none"
                      >
                        <option value="">-- Active selection --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.title}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Reason Category</label>
                      <select
                        value={excuseReason}
                        onChange={(e) => setExcuseReason(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border bg-white focus:outline-none"
                      >
                        <option value="unforeseen technical block">⚡ Unexpected Tech/Coding Bug</option>
                        <option value="medical/mental exhaustion">🩺 Mental Exhaustion / Health</option>
                        <option value="high priority project collision">💼 Sudden Workspace Emergency</option>
                        <option value="general unexpected delays">📦 General Logistics Delay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Vibe / Style</label>
                      <select
                        value={excuseVibe}
                        onChange={(e) => setExcuseVibe(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border bg-white focus:outline-none"
                      >
                        <option value="tactful-professional">👔 Tactful Professional</option>
                        <option value="extremely-humble">🙇 Extremely Humble & Apologetic</option>
                        <option value="direct-and-honest">📢 Direct & Honest</option>
                        <option value="creative-but-professional">✨ Creative but Professional</option>
                      </select>
                    </div>

                    <button
                      onClick={triggerExcuseDraft}
                      disabled={loading}
                      className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-display text-xs font-bold rounded-lg border border-slate-900 transition-all hover:-translate-y-0.5"
                    >
                      Draft Email
                    </button>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    {excuseDraft ? (
                      <div className="space-y-4 animate-fade-in">
                        {/* Subject line bar */}
                        <div className="p-3 bg-slate-900 text-white rounded-xl border-2 border-slate-950 flex items-center justify-between text-xs font-mono">
                          <span className="truncate max-w-[80%]"><strong>Subject:</strong> {excuseDraft.subject}</span>
                          <button
                            onClick={() => copyToClipboard(`Subject: ${excuseDraft.subject}\n\n${excuseDraft.body}`, 'excuse')}
                            className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-[10px] shrink-0 border border-slate-700"
                          >
                            {copiedText === 'excuse' ? 'Copied!' : 'Copy Email'}
                          </button>
                        </div>

                        {/* Email text box */}
                        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl max-h-[220px] overflow-y-auto text-xs font-sans text-slate-850 leading-relaxed whitespace-pre-wrap select-all">
                          {excuseDraft.body}
                        </div>

                        {/* Tips */}
                        <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
                          <p className="text-[10px] font-mono font-bold text-blue-800 uppercase tracking-wide">💡 Delivery Tips:</p>
                          <p className="text-xs text-slate-750 mt-1 italic font-medium">{excuseDraft.tips}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center bg-slate-50/50">
                        <Mail className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="font-display font-bold text-slate-650 text-sm">Excuse Draft Awaiting Trigger</h4>
                        <p className="text-xs text-slate-450 max-w-[280px] mt-1 mx-auto">
                          Specify your target task context, reason for delay, and style of appeal above to write an elegant request.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: COGNITIVE RISK ANALYZER */}
            {activeTab === 'risk' && (
              <div className="space-y-6">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                      <Coffee className="w-5 h-5 text-purple-500" />
                      Procrastination Cognitive Risk Report
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      A psychological audit of your overall active task count, habit strengths, and panic velocity.
                    </p>
                  </div>
                  <button 
                    onClick={triggerProcrastinationRisk}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recalculate
                  </button>
                </div>

                {riskAnalysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Dial gauge or numeric breakdown */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-slate-950 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] text-center">
                      <h4 className="text-xs font-mono font-bold text-slate-550 uppercase tracking-widest mb-1">
                        Risk Score
                      </h4>
                      <div className={`text-6xl font-display font-black tracking-tighter ${
                        riskAnalysis.riskLevel === 'critical' ? 'text-rose-650 animate-pulse' :
                        riskAnalysis.riskLevel === 'high' ? 'text-rose-500' :
                        riskAnalysis.riskLevel === 'moderate' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {riskAnalysis.riskScore}%
                      </div>
                      <span className={`mt-2 px-3 py-0.5 text-xs font-mono font-black uppercase rounded-full border ${
                        riskAnalysis.riskLevel === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        riskAnalysis.riskLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        riskAnalysis.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        Level: {riskAnalysis.riskLevel}
                      </span>
                    </div>

                    {/* Detailed Analysis Explanation */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                        <h5 className="text-xs font-mono font-black text-slate-500 uppercase tracking-wider mb-1">Cognitive load analysis:</h5>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {riskAnalysis.analysis}
                        </p>
                      </div>

                      {/* Scientific CBT Tips */}
                      <div className="p-4 bg-purple-500/10 border-2 border-dashed border-purple-400 rounded-xl">
                        <h5 className="text-xs font-mono font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1 mb-2">
                          🧠 Behavioral Therapy (CBT) Interventions:
                        </h5>
                        <ul className="space-y-1.5">
                          {riskAnalysis.mitigationSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                              <span className="text-purple-600">🎯</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-display font-bold text-slate-700">Cognitive Audit Awaiting Execution</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Evaluate habit triggers, task deadlines, and difficulty profiles to analyze your overall procrastination vulnerability.
                    </p>
                    <button
                      onClick={triggerProcrastinationRisk}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-display text-xs font-bold rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]"
                    >
                      Audit Procrastination Risk
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: GOOGLE CALENDAR SYNC */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-black text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-rose-500" />
                      Google Calendar Integration
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      Connect your real Google account to import tasks and schedule survival blocks directly. No mock data.
                    </p>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {calendarSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{calendarSuccessMessage}</span>
                  </div>
                )}
                {calendarErrorMessage && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>{calendarErrorMessage}</span>
                  </div>
                )}

                {/* Connection Status Section */}
                {!googleToken || !googleUser ? (
                  <div className="border-2 border-slate-950 rounded-2xl p-8 text-center bg-slate-50 max-w-xl mx-auto space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <Lock className="w-12 h-12 text-slate-400 mx-auto" />
                    <h4 className="font-display font-black text-lg text-slate-900 uppercase">Connect Your Google Calendar</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                      Authorize access to see your upcoming appointments, import items straight to your Crisis Queue, and schedule tactical survival focus time on your real calendar.
                    </p>
                    
                    <button 
                      onClick={handleGoogleLogin} 
                      disabled={calendarLoading}
                      className="gsi-material-button mx-auto hover:scale-105 active:scale-95 transition-transform"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">Sign in with Google</span>
                      </div>
                    </button>
                    {calendarLoading && <p className="text-xs font-mono text-slate-400 animate-pulse">Initializing Secure Handshake...</p>}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Profile Info */}
                    <div className="p-4 bg-slate-100 border-2 border-slate-950 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {googleUser.photoURL ? (
                          <img src={googleUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-950" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-200 border-2 border-slate-950 flex items-center justify-center font-bold">
                            {googleUser.displayName?.charAt(0) || 'G'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-display font-black text-slate-900">
                            {googleUser.displayName || 'Authorized User'}
                          </p>
                          <p className="text-xs font-mono text-slate-500">{googleUser.email}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchCalendarEvents(googleToken)}
                          disabled={calendarLoading}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border-2 border-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${calendarLoading ? 'animate-spin' : ''}`} />
                          Refresh List
                        </button>
                        <button
                          onClick={handleGoogleLogout}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-400 rounded-xl text-xs font-bold transition-all"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Side: Import Events from Real Calendar */}
                      <div className="p-4 bg-white border-2 border-slate-950 rounded-2xl space-y-4">
                        <h4 className="text-sm font-display font-black text-slate-950 uppercase border-b-2 border-dashed border-slate-200 pb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-rose-500" />
                          Import Upcoming Events
                        </h4>
                        
                        <p className="text-[11px] text-slate-500 font-sans">
                          Select any upcoming item from your Google Calendar to log it directly into your local <strong>Active Crisis Queue</strong>.
                        </p>

                        {calendarLoading ? (
                          <div className="py-12 text-center text-xs text-slate-450 font-mono animate-pulse">
                            Scanning Google Calendars...
                          </div>
                        ) : calendarEvents.length === 0 ? (
                          <div className="py-12 text-center text-xs text-slate-450 italic">
                            No upcoming calendar events found.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {calendarEvents.map((evt) => {
                              const startStr = evt.start.dateTime || evt.start.date || '';
                              const formattedDate = startStr 
                                ? new Date(startStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : 'No time set';

                              return (
                                <div key={evt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-950 transition-colors flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <h5 className="text-xs font-bold text-slate-900 leading-snug">{evt.summary || '(No Title)'}</h5>
                                    <p className="text-[10px] font-mono text-slate-450 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formattedDate}
                                    </p>
                                    {evt.description && (
                                      <p className="text-[10px] text-slate-400 line-clamp-1">{evt.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleImportEventAsTask(evt)}
                                    className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-colors shrink-0"
                                  >
                                    Import ⚡
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right Side: Export Crisis Workload */}
                      <div className="p-4 bg-white border-2 border-slate-950 rounded-2xl space-y-4">
                        <h4 className="text-sm font-display font-black text-slate-950 uppercase border-b-2 border-dashed border-slate-200 pb-2 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-emerald-500" />
                          Export Crisis Queue
                        </h4>

                        <p className="text-[11px] text-slate-500 font-sans">
                          Push local deadlines and generated AI survival timelines directly onto your real calendar.
                        </p>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {tasks.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-450 italic">
                              Crisis Queue is empty! No tasks to export.
                            </div>
                          ) : (
                            tasks.map((task) => {
                              const dlDate = new Date(task.deadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                              // Check if we have an active survival plan in memory for this task
                              const hasPlan = survivalPlan && survivalPlan.taskId === task.id;

                              return (
                                <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h5 className="text-xs font-black text-slate-900">{task.title}</h5>
                                      <p className="text-[10px] font-mono text-rose-500 font-bold mt-0.5">Due: {dlDate}</p>
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                                      task.completed ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                                    }`}>
                                      {task.completed ? 'Done' : 'Active'}
                                    </span>
                                  </div>

                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => handleExportDeadline(task)}
                                      className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1"
                                    >
                                      🚨 Sync Deadline
                                    </button>

                                    {hasPlan ? (
                                      <button
                                        onClick={() => handleExportSurvivalPlan(task, survivalPlan!)}
                                        className="flex-1 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-slate-950 border border-emerald-500 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                                      >
                                        📅 Block Steps ({survivalPlan!.steps.length})
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedPlanTask(task);
                                          setActiveTab('planner');
                                          // Trigger survival plan generation
                                          triggerSurvivalPlan(task);
                                        }}
                                        className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-350 rounded-lg text-[10px] font-bold"
                                      >
                                        ⚡ Generate Plan
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Aesthetic humbleness footer */}
      <footer className="max-w-7xl mx-auto mt-16 pt-8 border-t-2 border-dashed border-slate-200 text-center pb-8">
        <p className="text-xs font-mono text-slate-450 tracking-wide uppercase">
          🚨 ZEROHOUR • A STRESS-FREE COMMAND DESK FOR HIGH PRESSURE MOMENTS
        </p>
        <p className="text-[10px] text-slate-400 font-sans mt-1">
          Designed off-center to prevent tech-larping logs and keep focus on real psychological action items.
        </p>
      </footer>
    </div>
  );
}
