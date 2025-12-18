"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, animate } from "framer-motion";
import { 
  Terminal, 
  Zap, 
  Cpu, 
  Shield, 
  ArrowRight, 
  ChevronRight 
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility for Tailwind classes ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Component: Spotlight Card ---
function SpotlightCard({ children, className = "" }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => setOpacity(1);
  const handleBlur = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      className={cn(
        "relative rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0, 255, 157, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative h-full z-20">{children}</div>
    </div>
  );
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// --- Component: Typewriter (Framer-powered) ---
function Typewriter({
  text,
  speed = 120, // ms per character – slower by default
  startDelay = 0.2,
  loop = true,
  repeatDelay = 1.0,
  className = "",
}) {
  const [display, setDisplay] = useState("");

  // Animate a number from 0 -> text.length and slice the string
  // to create a smooth, Framer-driven typewriter effect
  useEffect(() => {
    let controls;
    const timeout = setTimeout(() => {
      controls = animate(0, text.length, {
        duration: (text.length * speed) / 1000,
        ease: "linear",
        onUpdate: (latest) => {
          const i = Math.floor(latest);
          setDisplay(text.slice(0, i));
        },
        repeat: loop ? Infinity : 0,
        repeatDelay,
      });
    }, startDelay * 1000);

    return () => {
      clearTimeout(timeout);
      if (controls) controls.stop();
    };
  }, [text, speed, startDelay, loop, repeatDelay]);

  return (
    <span className={cn("whitespace-pre inline-block", className)}>
      {display}
      <motion.span
        aria-hidden
        className="ml-0.5"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        |
      </motion.span>
    </span>
  );
}

// --- Main Page Component ---
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00ff9d] selection:text-black overflow-x-hidden relative font-sans">
      
      {/* Background Grid Effect */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', 
          backgroundSize: '50px 50px' 
        }}
      />

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 font-bold text-xl tracking-tighter"
          >
            <div className="p-1.5 bg-[#00ff9d]/10 rounded-lg border border-[#00ff9d]/20">
              <Terminal className="w-5 h-5 text-[#00ff9d]" />
            </div>
            <span>CodeMentor<span className="text-[#00ff9d]">.AI</span></span>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition">
              Log In
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 text-sm font-bold bg-[#00ff9d] text-black rounded-md hover:bg-[#00ff9d]/90 transition shadow-[0_0_15px_rgba(0,255,157,0.4)]">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-6 text-center"
        >
          
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ff9d]/30 bg-[#00ff9d]/5 text-[#00ff9d] text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,157,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff9d]"></span>
              </span>
              v2.0 // System Online
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
            Code smarter, <br />
            <Typewriter 
              text="ship faster." 
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-cyan-400"
              speed={90}
              loop={true}
              repeatDelay={5.0}
              startDelay={0.8}
            />
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered code review platform that doesn't just fix bugs—it teaches you how to avoid them. <span className="text-white">Powered by Claude 3.5 & GPT-4.</span>
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="btn-analysis w-full sm:w-auto flex items-center justify-center gap-2">
                Start Analysis
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 border border-gray-700 text-gray-300 text-lg font-bold rounded-lg hover:border-[#00ff9d] hover:text-[#00ff9d] transition-colors flex items-center justify-center gap-2 group">
                Live Demo
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          {/* Code Visual */}
          <motion.div 
            variants={itemVariants}
            className="mt-24 relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff9d] to-cyan-500 rounded-2xl blur opacity-20"></div>
            <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden text-left">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0F0F0F]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="ml-4 text-xs text-gray-500 font-mono">review_engine.js</div>
              </div>
              <div className="p-8 font-mono text-sm overflow-x-auto">
                <div className="flex gap-4">
                  <div className="flex flex-col text-right text-gray-700 select-none border-r border-gray-800 pr-4">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                  <pre className="text-gray-300 pl-2">
                    <code>
                      <span className="text-pink-400">const</span> analyzeCode = <span className="text-[#00ff9d]">async</span> (snippet) ={'>'} {'{'} {'\n'}
                      {'  '}<span className="text-gray-500">// AI analyzing complexity...</span> {'\n'}
                      {'  '}<span className="text-pink-400">if</span> (snippet.complexity {'>'} <span className="text-orange-400">O(n^2)</span>) {'{'} {'\n'}
                      {'    '}<span className="text-[#00ff9d]">return</span> <span className="text-green-300">"Optimize with HashMap"</span>; {'\n'}
                      {'  '} {'}'} {'\n'}
                      {'}'}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>

      {/* Feature Section with Spotlight Cards */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            
            <SpotlightCard className="p-8">
              <div className="w-12 h-12 bg-[#00ff9d]/10 rounded-lg flex items-center justify-center mb-6 border border-[#00ff9d]/20">
                <Zap className="w-6 h-6 text-[#00ff9d]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Reviews</h3>
              <p className="text-gray-400 leading-relaxed">
                Get feedback in milliseconds. Our engine detects logical fallacies, security risks, and anti-patterns before you commit.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 border border-purple-500/20">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Context Aware</h3>
              <p className="text-gray-400 leading-relaxed">
                Unlike generic LLMs, CodeMentor remembers your previous mistakes and adapts its curriculum to your skill gap.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 border border-blue-500/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Enterprise Security</h3>
              <p className="text-gray-400 leading-relaxed">
                Your code runs in isolated sandboxes. We never train our base models on your proprietary code snippets.
              </p>
            </SpotlightCard>

          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 text-center bg-[#050505]">
        <p className="text-gray-500 text-sm">
          &copy; 2025 CodeMentor AI. System Status: <span className="text-[#00ff9d]">Operational</span>
        </p>
      </footer>
    </div>
  );
}