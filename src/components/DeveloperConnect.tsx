import React, { useState } from "react";
import { PulseBeams, type BeamPath } from "@/components/ui/pulse-beams";
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  User, 
  Sparkles, 
  Code,
  ArrowLeft,
  Briefcase,
  Layers,
  Terminal,
  Heart
} from "lucide-react";

const beams: BeamPath[] = [
  {
    path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: Math.random() * 2,
      },
    },
    connectionPoints: [
      { cx: 6.5, cy: 398.5, r: 6 },
      { cx: 269, cy: 220.5, r: 6 }
    ]
  },
  {
    path: "M568 200H841C846.523 200 851 195.523 851 190V40",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: Math.random() * 2,
      },
    },
    connectionPoints: [
      { cx: 851, cy: 34, r: 6.5 },
      { cx: 568, cy: 200, r: 6 }
    ]
  },
  {
    path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: Math.random() * 2,
      },
    },
    connectionPoints: [
      { cx: 142, cy: 427, r: 6.5 },
      { cx: 425.5, cy: 274, r: 6 }
    ]
  },
  {
    path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
    gradientConfig: {
      initial: {
        x1: "40%",
        x2: "50%",
        y1: "160%",
        y2: "180%",
      },
      animate: {
        x1: "0%",
        x2: "10%",
        y1: "-40%",
        y2: "-20%",
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: Math.random() * 2,
      },
    },
    connectionPoints: [
      { cx: 770, cy: 427, r: 6.5 },
      { cx: 493, cy: 274, r: 6 }
    ]
  },
  {
    path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
    gradientConfig: {
      initial: {
        x1: "-40%",
        x2: "-10%",
        y1: "0%",
        y2: "20%",
      },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: Math.random() * 2,
      },
    },
    connectionPoints: [
      { cx: 420.5, cy: 6.5, r: 6 },
      { cx: 380, cy: 168, r: 6 }
    ]
  }
];

const gradientColors = {
  start: "#10b981", // Emerald start
  middle: "#6366f1", // Indigo middle
  end: "#a855f7" // Purple end
};

export default function DeveloperConnect() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="w-full relative min-h-[500px] border-2 border-slate-950 rounded-2xl overflow-hidden bg-slate-950">
      
      {/* Background Pulse Beams */}
      <PulseBeams
        beams={beams}
        gradientColors={gradientColors}
        width={858}
        height={450}
        baseColor="rgba(30, 41, 59, 0.4)"
        accentColor="rgba(99, 102, 241, 0.6)"
        className="absolute inset-0 w-full h-full"
      >
        <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto select-none">
          
          {!connected ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase shadow-inner">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Network Signal Active
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-display font-black text-white tracking-tight uppercase">
                  Establish Connection
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Initialize a secure, low-latency handshake to connect with the principal system architect.
                </p>
              </div>

              {/* Glowing Interactive Pulse Button */}
              <button
                onClick={() => setConnected(true)}
                className="bg-slate-900 hover:bg-slate-800 w-[240px] h-[80px] group cursor-pointer relative shadow-[0px_0px_30px_0px_rgba(99,102,241,0.25)] hover:shadow-[0px_0px_40px_0px_rgba(16,185,129,0.4)] rounded-full p-px text-xs font-semibold leading-6 text-white inline-block transition-all duration-300 active:scale-95"
              >
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(16,185,129,0.6)_0%,rgba(16,185,129,0)_75%)] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                </span>
                <div className="relative flex justify-center w-full text-center space-x-2 h-full items-center z-10 rounded-full bg-slate-950 py-0.5 px-4 ring-1 ring-white/10 group-hover:ring-emerald-500/30 transition-all">
                  <Sparkles className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
                  <span className="text-lg font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-emerald-400 to-emerald-100 uppercase">
                    Connect
                  </span>
                </div>
              </button>

              <div className="text-[10px] text-slate-500 font-mono">
                CRC32: OK • PORT: SECURE • AGENT: ONLINE
              </div>
            </div>
          ) : (
            <div className="w-[360px] md:w-[420px] bg-slate-900/90 backdrop-blur-md border-2 border-slate-800 p-6 rounded-3xl space-y-6 text-left shadow-2xl animate-in zoom-in-95 duration-300 relative">
              
              {/* Back to handshaking */}
              <button 
                onClick={() => setConnected(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all text-[10px] font-mono flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                Disconnect
              </button>

              {/* Header profile info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-indigo-500 to-purple-600 p-0.5 shadow-md flex-shrink-0 animate-pulse">
                  <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                    <User className="w-7 h-7 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[9px] rounded-md font-bold uppercase">
                    Creator Profile
                  </div>
                  <h4 className="text-lg font-display font-black text-white tracking-tight mt-0.5">
                    Dibyendu Chatterjee
                  </h4>
                  <p className="text-xs text-slate-400 font-sans flex items-center gap-1">
                    <Code className="w-3 h-3 text-emerald-500" />
                    Full Stack Developer & AI Architect
                  </p>
                </div>
              </div>

              {/* Status parameters */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-950/80 border border-slate-850 rounded-xl font-mono text-[10px]">
                <div className="text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-purple-400" />
                  Role: <span className="text-white font-bold">Developer</span>
                </div>
                <div className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  Stack: <span className="text-white font-bold">React/TS/Node</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                  Feel free to reach out to initiate collaboration, request new features, or integrate AI agents into your business logic. 
                </p>

                {/* Direct action links */}
                <div className="space-y-2 pt-1">
                  {/* LinkedIn */}
                  <a 
                    href="https://www.linkedin.com/in/dibyendu-chatterjee-5a218b330/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-sans font-bold text-white group-hover:text-blue-400 transition-colors">LinkedIn Profile</div>
                        <div className="text-[9px] font-mono text-slate-500">linkedin.com/in/dibyendu-chatterjee</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  {/* GitHub */}
                  <a 
                    href="https://github.com/dibyendu-coder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                        <Github className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-sans font-bold text-white group-hover:text-emerald-400 transition-colors">GitHub Repository</div>
                        <div className="text-[9px] font-mono text-slate-500">github.com/dibyendu-coder</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  {/* Gmail */}
                  <a 
                    href="mailto:chatterjeedibyendu166@gmail.com"
                    className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-sans font-bold text-white group-hover:text-red-400 transition-colors">Email Directly</div>
                        <div className="text-[9px] font-mono text-slate-500">chatterjeedibyendu166@gmail.com</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>

              {/* Footer quote */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-850/50 text-[9px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> in AI Studio
                </span>
                <span>v1.2.0 • PROD</span>
              </div>

            </div>
          )}

        </div>
      </PulseBeams>
    </div>
  );
}
