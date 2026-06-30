import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Terminal as TerminalIcon, 
  Send, 
  Zap, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Loader2, 
  HelpCircle,
  Clock,
  ShieldCheck,
  Flame
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function CrisisTerminal() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "[STATUS: CRITICAL_OVERLOAD]\n[INITIALIZING COGNITIVE TRIAGE SEQUENCE...]\n\nWelcome to the ZEROHOUR Crisis Terminal. I am your mission control operator. The clock is ticking, and panic is a useless resource. \n\nInput your emergency, or trigger one of the high-velocity survival protocols below immediately.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userMessage: Message = {
      role: "user",
      content: textToSend.trim(),
      timestamp: userTime
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const customKey = localStorage.getItem("user_gemini_api_key");
      if (customKey) {
        headers["x-gemini-key"] = customKey;
      }

      // We need to pass the conversation history formatted nicely
      const payloadMessages = [...messages, userMessage].map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content
      }));

      const response = await fetch("/api/crisis-terminal", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: payloadMessages })
      });

      if (!response.ok) {
        throw new Error("Terminal link interrupted.");
      }

      const data = await response.json();
      const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        timestamp: assistantTime
      }]);
    } catch (err: any) {
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "[LINK_ERROR: ENCRYPTED FALLBACK TRIGGERED]\n\nProcrastination shields are unstable. Here is your baseline command:\n1. Open an empty workspace.\n2. Write down exactly one sentence of your task.\n3. Execute for 10 minutes. Go.",
        timestamp: errorTime
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const clearChat = () => {
    if (confirm("Reset terminal session? This will purge current telemetry logs.")) {
      setMessages([
        {
          role: "assistant",
          content: "[SYSTEM REBOOT COMPLETE]\n[TELEMETRY FLUSHED]\n\nReady for fresh tactical parameters. What's the block?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="w-full bg-slate-950 border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] text-slate-100 font-mono text-sm relative">
      {/* Terminal Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <TerminalIcon className="w-4 h-4 text-rose-500" />
            ZERO_HOUR_CRISIS_TERMINAL.EXE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1 text-[9px] bg-slate-950 border border-slate-800 text-rose-400 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse">
            <Flame className="w-3 h-3" /> Panic Stream Active
          </span>
          <button 
            onClick={clearChat}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-lg transition-all"
            title="Purge Telemetry Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Diagnostic Matrix Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-850 bg-slate-950/60 p-2.5 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 border-r border-slate-800/40 px-2">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>SYS_CLOCK: <span className="text-white font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></span>
        </div>
        <div className="flex items-center gap-1.5 border-r border-slate-800/40 px-2">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>DANGER_LBL: <span className="text-rose-400 font-bold">EXTREME</span></span>
        </div>
        <div className="flex items-center gap-1.5 border-r border-slate-800/40 px-2">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>KEY_LINK: <span className="text-emerald-400 font-bold">{localStorage.getItem('user_gemini_api_key') ? 'CUSTOM' : 'STUDIO'}</span></span>
        </div>
        <div className="flex items-center gap-1.5 px-2">
          <Zap className="w-3 h-3 text-indigo-400 animate-bounce" />
          <span>BUFFER_SPEED: <span className="text-indigo-400 font-bold">MAX</span></span>
        </div>
      </div>

      {/* Chat Display Logs */}
      <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-slate-950/90 selection:bg-rose-500 selection:text-white scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <span>{m.role === 'user' ? 'TACTICAL_OPERATOR' : 'CRISIS_MISSION_CONTROL'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-xl whitespace-pre-wrap leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-950/80 border border-indigo-500/30 text-indigo-100 rounded-tr-none shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'bg-slate-900/90 border border-slate-800 text-emerald-400 rounded-tl-none font-mono shadow-[0_0_15px_rgba(16,185,129,0.05)]'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <span>CRISIS_MISSION_CONTROL</span>
              <span>•</span>
              <span>CALCULATING TELEMETRY...</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 text-emerald-400 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span className="text-xs font-bold animate-pulse text-emerald-400/80">RUNNING RE-ROUTE ENGINE...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick-Reply Chips */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-850">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-500" /> Ready Tactical Sequences
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickReply("Draft an immediate extension excuse")}
            disabled={loading}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 hover:border-rose-500/50 text-rose-300 hover:text-white rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span className="animate-pulse">🚨</span> Draft extension excuse
          </button>
          <button
            onClick={() => handleQuickReply("Calm down my panic (CBT protocol)")}
            disabled={loading}
            className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-900/50 hover:border-amber-500/50 text-amber-300 hover:text-white rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>📉</span> Calm my panic (CBT)
          </button>
          <button
            onClick={() => handleQuickReply("I have 2 hours left. Triage my night.")}
            disabled={loading}
            className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-950/80 border border-emerald-900/50 hover:border-emerald-500/50 text-emerald-300 hover:text-white rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>⚡</span> Triage my 2 hours left
          </button>
        </div>
      </div>

      {/* Terminal Input Box */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inject tactical parameters here..."
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 text-white font-mono text-xs pl-8 pr-3 py-2.5 rounded-xl focus:outline-none placeholder-slate-600 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-xl transition-all flex items-center justify-center gap-1 font-bold text-xs cursor-pointer shadow-[0_0_10px_rgba(225,29,72,0.2)]"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
}
