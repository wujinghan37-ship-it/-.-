import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, Star, Loader2, Palette, Moon, Sun, Hexagon, Download, Lock, Unlock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import { AppState, HandData, GestureType, MAJOR_ARCANA, TarotCardData } from '../types';
import { playShuffleSound, playFlipSound } from '../services/soundService';

interface TarotDeckProps {
  appState: AppState;
  handData: HandData;
  setAppState: (s: AppState) => void;
  designIndex: number;
}

const CARD_WIDTH = 180;
const CARD_HEIGHT = 280;
const LOCK_DURATION = 20; // seconds

// --- Custom SVGs for Designs ---

const MysticHand = ({ className, style, flipped = false }: { className?: string, style?: React.CSSProperties, flipped?: boolean }) => (
  <svg viewBox="0 0 100 140" className={className} style={{ ...style, transform: flipped ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor">
    <path d="M30 140 L30 110 Q30 90 20 80 L20 60" stroke="currentColor" strokeWidth="1" opacity="0.9"/>
    <path d="M70 140 L70 110 Q70 90 80 80 L80 65" stroke="currentColor" strokeWidth="1" opacity="0.9"/>
    <path d="M80 80 L85 50 L80 40 L75 50 L70 75" fill="none" strokeWidth="1.2" />
    <path d="M70 75 L72 30 L65 20 L58 30 L60 70" fill="none" strokeWidth="1.2" />
    <path d="M60 70 L62 20 L50 10 L38 20 L40 70" fill="none" strokeWidth="1.2" />
    <path d="M40 70 L42 30 L35 20 L28 30 L30 75" fill="none" strokeWidth="1.2" />
    <path d="M30 85 L20 60 L15 55 L10 65 L25 90" fill="none" strokeWidth="1.2" />
    <circle cx="50" cy="90" r="4" strokeWidth="1" />
    <circle cx="50" cy="90" r="1.5" fill="currentColor" />
  </svg>
);

const SunRays = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    {Array.from({ length: 16 }).map((_, i) => (
      <line 
        key={i}
        x1="50" y1="50" 
        x2="50" y2="5" 
        transform={`rotate(${i * 22.5} 50 50)`} 
        strokeWidth={i % 2 === 0 ? "1.5" : "0.5"} 
        strokeDasharray={i % 2 !== 0 ? "2 2" : "none"}
        opacity={i % 2 !== 0 ? 0.6 : 1}
      />
    ))}
  </svg>
);

const MoonPhases = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 20" className={className} fill="currentColor">
    <path d="M20 10 A 6 6 0 0 0 20 18 A 6 6 0 0 1 20 2 A 6 6 0 0 0 20 10" />
    <circle cx="60" cy="10" r="6" />
    <circle cx="60" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    <path d="M100 10 A 6 6 0 0 1 100 18 A 6 6 0 0 0 100 2 A 6 6 0 0 1 100 10" />
  </svg>
);

const CornerFlourish = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg viewBox="0 0 50 50" className={className} style={style} fill="none" stroke="currentColor">
    <path d="M2 2 L2 20 Q 2 35 15 35" strokeWidth="1.5" />
    <path d="M2 2 L20 2 Q 35 2 35 15" strokeWidth="1.5" />
    <circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const Constellation = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="20" cy="20" r="2" fill="currentColor" />
    <circle cx="50" cy="30" r="2" fill="currentColor" />
    <circle cx="80" cy="20" r="2" fill="currentColor" />
    <circle cx="30" cy="60" r="2" fill="currentColor" />
    <circle cx="70" cy="70" r="2" fill="currentColor" />
    <circle cx="50" cy="90" r="2" fill="currentColor" />
    <path d="M20 20 L50 30 L80 20" strokeWidth="0.5" opacity="0.6" />
    <path d="M20 20 L30 60 L50 90 L70 70 L80 20" strokeWidth="0.5" opacity="0.6" />
  </svg>
);

const AlchemyCircle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="1" />
    <path d="M50 5 L95 95 L5 95 Z" strokeWidth="1" />
    <circle cx="50" cy="65" r="20" strokeWidth="1" />
    <rect x="35" y="50" width="30" height="30" transform="rotate(45 50 65)" strokeWidth="0.5" />
  </svg>
);

// --- Card Back Components ---

const CardBackMystic = () => (
  <div 
    className="absolute inset-0 backface-hidden rounded-xl border border-white/5 shadow-2xl overflow-hidden"
    style={{
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    }}
  >
    <div className="absolute inset-0 opacity-40 mix-blend-hard-light" style={{ background: 'radial-gradient(circle at 50% 30%, #1e3a8a 0%, transparent 60%), radial-gradient(circle at 80% 80%, #172554 0%, transparent 50%)' }} />
    <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />
    
    <div className="absolute inset-2 border-[1px] border-[#D4AF37] rounded-lg opacity-90 flex flex-col items-center justify-between py-2 overflow-hidden box-border">
       <CornerFlourish className="absolute top-1 left-1 w-6 h-6 text-[#D4AF37]" />
       <CornerFlourish className="absolute top-1 right-1 w-6 h-6 text-[#D4AF37] -scale-x-100" />
       <CornerFlourish className="absolute bottom-1 left-1 w-6 h-6 text-[#D4AF37] -scale-y-100" />
       <CornerFlourish className="absolute bottom-1 right-1 w-6 h-6 text-[#D4AF37] -scale-x-100 -scale-y-100" />

       <div className="relative w-full h-1/3 flex flex-col items-center justify-start pt-2">
           <MoonPhases className="w-20 h-4 text-[#D4AF37] opacity-80 mb-1" />
           <MysticHand className="h-24 w-auto text-[#D4AF37] drop-shadow-md" flipped={true} />
       </div>

       <div className="relative w-full flex-1 flex items-center justify-center">
           <div className="absolute w-32 h-32 animate-spin-slow" style={{ animationDuration: '60s' }}>
               <SunRays className="w-full h-full text-[#FCD34D] opacity-40" />
           </div>
           <div className="relative z-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#FCD34D] blur-xl opacity-20 transform scale-150" />
                <Eye size={40} strokeWidth={1.5} className="text-[#FCD34D] fill-[#0f172a]" />
                <div className="absolute w-1.5 h-1.5 bg-[#FCD34D] rounded-full shadow-[0_0_5px_#D4AF37]" />
           </div>
       </div>

       <div className="relative w-full h-1/3 flex flex-col items-center justify-end pb-2">
           <MysticHand className="h-24 w-auto text-[#D4AF37] drop-shadow-md" />
       </div>
    </div>
  </div>
);

const CardBackCelestial = () => (
    <div 
      className="absolute inset-0 backface-hidden rounded-xl border border-white/5 shadow-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />
      
      <div className="absolute inset-2 border-[1px] border-slate-400 rounded-lg opacity-80 flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Stars Background */}
        <div className="absolute inset-0">
             {[...Array(6)].map((_, i) => (
                 <Star key={i} size={8} className="absolute text-slate-300 opacity-60 animate-pulse" 
                       style={{ top: `${Math.random()*90}%`, left: `${Math.random()*90}%`, animationDelay: `${i*0.5}s` }} fill="currentColor" />
             ))}
        </div>

        <div className="absolute top-2 left-2"><Moon size={16} className="text-slate-300" /></div>
        <div className="absolute bottom-2 right-2"><Sun size={16} className="text-slate-300" /></div>

        <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-40 h-40 animate-spin-slow" style={{ animationDuration: '120s' }}>
                <Constellation className="w-full h-full text-cyan-200/40" />
            </div>
            <div className="absolute w-24 h-24 border border-slate-400/30 rounded-full" />
            <div className="absolute w-32 h-32 border border-slate-400/20 rounded-full border-dashed" />
            
            <Sparkles size={32} className="text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </div>
      </div>
    </div>
);

const CardBackAlchemy = () => (
    <div 
      className="absolute inset-0 backface-hidden rounded-xl border border-white/5 shadow-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #271c19 0%, #44403c 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: `radial-gradient(circle at center, #78350f 0%, transparent 70%)` }} />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />
      
      <div className="absolute inset-3 border-2 double border-amber-700 rounded-sm opacity-90 flex flex-col items-center justify-center overflow-hidden">
        <Hexagon className="absolute top-2 left-1/2 -translate-x-1/2 text-amber-800 opacity-50" size={16} />
        <Hexagon className="absolute bottom-2 left-1/2 -translate-x-1/2 text-amber-800 opacity-50" size={16} />

        <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-36 h-36 animate-spin-slow" style={{ animationDuration: '40s' }}>
                 <AlchemyCircle className="w-full h-full text-amber-600/60" />
            </div>
            <div className="absolute w-28 h-28 animate-spin-slow" style={{ animationDuration: '30s', animationDirection: 'reverse' }}>
                 <AlchemyCircle className="w-full h-full text-amber-500/40" />
            </div>
            <div className="w-4 h-4 bg-amber-600 rotate-45" />
        </div>
      </div>
    </div>
);

export const DESIGNS = [
    { id: 'mystic', name: 'The Mystic', component: CardBackMystic },
    { id: 'celestial', name: 'Celestial Void', component: CardBackCelestial },
    { id: 'alchemy', name: 'Alchemist', component: CardBackAlchemy },
];

const TarotDeck: React.FC<TarotDeckProps> = ({ appState, handData, setAppState, designIndex }) => {
  const [cards] = useState<TarotCardData[]>(MAJOR_ARCANA);
  const [positions, setPositions] = useState<{ x: number; y: number; r: number }[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const angleHistory = useRef<number[]>([]);
  const lastSoundTime = useRef(0);
  const interpretationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newPositions = MAJOR_ARCANA.map(() => ({
      x: (Math.random() - 0.5) * window.innerWidth * 1.2,
      y: (Math.random() - 0.5) * window.innerHeight * 1.2,
      r: (Math.random() - 0.5) * 180
    }));
    setPositions(newPositions);
  }, []);

  const generateReading = async (card: TarotCardData) => {
    if (!process.env.API_KEY) return;
    try {
        setIsGenerating(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a mystical Tarot reader. The user has drawn "${card.name}". 
            Provide a profound, poetic, and slightly mysterious interpretation of this card for their current moment. 
            Response must be in Chinese.
            Keep it concise (under 50 words). 
            Speak directly to the user.`
        });
        setAiInterpretation(response.text);
    } catch (e) {
        console.error("AI Generation failed", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveToDesktop = async () => {
      if (!interpretationRef.current) return;
      
      try {
          const canvas = await html2canvas(interpretationRef.current, {
              backgroundColor: null,
              scale: 2, // Higher resolution
              useCORS: true
          });
          
          const link = document.createElement('a');
          link.download = `arcanum-reading-${new Date().toISOString().slice(0,10)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (err) {
          console.error("Failed to save image:", err);
      }
  };

  // Timer for Lockout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFlipped && appState === AppState.REVEALED) {
      setIsLocked(true);
      setTimeLeft(LOCK_DURATION);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsLocked(false);
      setTimeLeft(0);
    }
    return () => clearInterval(timer);
  }, [isFlipped, appState]);

  useEffect(() => {
    if (appState === AppState.STACKED) {
      if (handData.gesture === GestureType.OPEN_PALM) {
        playShuffleSound();
        setAppState(AppState.SHUFFLING);
      }
    } else if (appState === AppState.SHUFFLING) {
      const velMag = Math.sqrt(handData.velocity.x ** 2 + handData.velocity.y ** 2);
      const now = Date.now();
      if (velMag > 0.8 && now - lastSoundTime.current > 200) {
        playShuffleSound();
        lastSoundTime.current = now;
      }
      if (handData.gesture === GestureType.POINTING) {
        const randomIndex = Math.floor(Math.random() * cards.length);
        setSelectedCardIndex(randomIndex);
        setAppState(AppState.SELECTING);
      } else if (handData.gesture === GestureType.FIST) {
        setAppState(AppState.STACKED);
      }
    } else if (appState === AppState.SELECTING) {
      if (handData.gesture === GestureType.POINTING) {
         angleHistory.current.push(handData.angle);
         if (angleHistory.current.length > 20) angleHistory.current.shift();
         const minAngle = Math.min(...angleHistory.current);
         const maxAngle = Math.max(...angleHistory.current);
         if (maxAngle - minAngle > 20) {
            if (!isFlipped) {
                setIsFlipped(true);
                playFlipSound();
                setAppState(AppState.REVEALED);
                angleHistory.current = [];
                if (selectedCardIndex !== null) generateReading(cards[selectedCardIndex]);
            }
         }
      } else if (handData.gesture === GestureType.OPEN_PALM) {
          setIsFlipped(false);
          setSelectedCardIndex(null);
          setAiInterpretation(null);
          setIsGenerating(false);
          playShuffleSound();
          setAppState(AppState.SHUFFLING);
      }
    } else if (appState === AppState.REVEALED) {
      // ONLY ALLOW EXIT IF NOT LOCKED
      if (!isLocked) {
        if (handData.gesture === GestureType.OPEN_PALM) {
          setIsFlipped(false);
          setSelectedCardIndex(null);
          setAiInterpretation(null);
          setIsGenerating(false);
          playShuffleSound();
          setAppState(AppState.SHUFFLING);
        } else if (handData.gesture === GestureType.FIST) {
          setIsFlipped(false);
          setSelectedCardIndex(null);
          setAiInterpretation(null);
          setIsGenerating(false);
          setAppState(AppState.STACKED);
        }
      }
    }
  }, [handData.gesture, handData.angle, appState, cards.length, setAppState, isFlipped, selectedCardIndex, isLocked]);

  const getCardStyle = (index: number) => {
    let x = 0, y = 0, rotate = 0, scale = 1, zIndex = index, opacity = 1, filter = 'none';
    const basePos = positions[index] || { x: 0, y: 0, r: 0 };

    if (appState === AppState.STACKED) {
      x = index * 0.2; y = -index * 0.2; rotate = index * 0.1; scale = 0.8;
    } else if (appState === AppState.SHUFFLING) {
      // SHUFFLE STATE: Advanced Physics
      const velX = handData.velocity.x;
      const velY = handData.velocity.y;
      const velMag = Math.sqrt(velX * velX + velY * velY);
      const normalizedIndex = index / cards.length;
      const handPxX = (handData.x - 0.5) * window.innerWidth; 
      const handPxY = (handData.y - 0.5) * window.innerHeight;
      const followFactor = 0.8 - (normalizedIndex * 0.4); 
      const scatterFactor = 1 + (velMag * 2.5); 
      const dragX = -velX * 150 * normalizedIndex; 
      const dragY = velY * 150 * normalizedIndex;

      x = (basePos.x * scatterFactor * 0.4) + (handPxX * followFactor) + dragX;
      y = (basePos.y * scatterFactor * 0.4) + (handPxY * followFactor) + dragY;
      rotate = basePos.r + (velX * 60 * (1 - normalizedIndex));
      scale = 0.8 + Math.min(velMag * 0.15, 0.3);

    } else if (appState === AppState.SELECTING || appState === AppState.REVEALED) {
      if (index === selectedCardIndex) {
        // RESPONSIVE LOGIC: Shift Left for Desktop to make room for Text
        const isDesktop = window.innerWidth >= 768;
        if (appState === AppState.REVEALED && isDesktop) {
            x = -window.innerWidth * 0.12; // Shift left
            y = 0;
            scale = 1.2;
        } else if (appState === AppState.REVEALED && !isDesktop) {
            x = 0;
            y = -40; // Shift up slightly on mobile
            scale = 1.1;
        } else {
            // SELECTING
            x = 0; y = 0; scale = 1.4;
        }
        zIndex = 1000; rotate = 0; opacity = 1;
      } else {
        x = basePos.x * 2; y = basePos.y * 2; scale = 0.5; opacity = 0.3; filter = 'blur(8px)';
      }
    }
    return { x, y, rotate, scale, zIndex, opacity, filter };
  };

  const CurrentDesignComponent = DESIGNS[designIndex].component;

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-[1200px]">
      
      {cards.map((card, index) => {
        const style = getCardStyle(index);
        const isSelected = index === selectedCardIndex;
        let transition = {};
        if (appState === AppState.SHUFFLING) {
             // Physics-based spring transition for SHUFFLING
             transition = { 
                 type: "spring", 
                 stiffness: 240, 
                 damping: 18,
                 mass: 0.5 + (index * 0.04) // Progressive mass for "trail" effect
             };
        }
        else if (isSelected && appState === AppState.SELECTING) transition = { duration: 1.2, ease: "easeInOut" };
        else transition = { duration: 0.8 };

        return (
          <motion.div
            key={card.id}
            initial={false}
            animate={{
              x: style.x, y: style.y, rotate: style.rotate, scale: style.scale, zIndex: style.zIndex, opacity: style.opacity, filter: style.filter
            }}
            transition={transition}
            className="absolute rounded-xl shadow-2xl preserve-3d"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transformStyle: "preserve-3d" }}
          >
             {isSelected && appState !== AppState.SHUFFLING && (
                <motion.div 
                    className="absolute -inset-2 rounded-2xl z-[-1]"
                    style={{ background: 'radial-gradient(circle, rgba(200,160,50,0.5) 0%, rgba(0,0,0,0) 70%)', border: '2px solid rgba(212,175,55,0.3)' }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
             )}
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: isSelected && isFlipped ? 180 : 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <CurrentDesignComponent />

              <div 
                className="absolute inset-0 backface-hidden rounded-xl bg-slate-900 border border-amber-700 overflow-hidden"
                style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <img src={card.image} alt={card.name} className="w-full h-full object-cover opacity-90 mix-blend-luminosity" />
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")` }} />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none mix-blend-overlay" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 flex flex-col justify-end text-center">
                    <h3 className="font-cinzel text-2xl text-amber-50 mb-2 drop-shadow-md">{card.name}</h3>
                </div>
              </div>
            </motion.div>

            {/* Interpretation Text Displayed using a wrapper for positioning */}
            {isSelected && isFlipped && (
               <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-[280px] md:top-1/2 md:left-[110%] md:translate-x-0 md:-translate-y-1/2 md:w-[350px] z-50">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="w-full"
                  >
                      <div ref={interpretationRef} className="bg-black/80 backdrop-blur-xl p-5 rounded-xl border border-amber-900/50 text-amber-50 shadow-2xl relative overflow-hidden group max-h-[60vh] overflow-y-auto">
                          
                          {/* Interaction Lock Progress Bar */}
                          {isLocked && (
                              <div className="absolute top-0 left-0 h-1 bg-amber-600 transition-all duration-1000 ease-linear z-20 sticky"
                                   style={{ width: `${(timeLeft / LOCK_DURATION) * 100}%` }} />
                          )}

                          {/* Decorative elements for the card snapshot */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50 sticky" />
                          
                          {/* Header for snapshot context */}
                          <div className="mb-2 pb-2 border-b border-amber-500/10 flex flex-col items-center">
                              <span className="text-[10px] font-mono tracking-widest text-amber-500/60 uppercase">Mystic Hand Reading</span>
                              <span className="font-cinzel text-amber-200">{card.name}</span>
                          </div>
                          
                          {/* Timer / Lock Status */}
                          <div className="mb-3">
                              {isLocked ? (
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500/80 justify-center">
                                      <Lock size={12} />
                                      <span>Reading... ({timeLeft}s)</span>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-green-500/80 justify-center animate-pulse">
                                      <Unlock size={12} />
                                      <span>Gestures Unlocked</span>
                                  </div>
                              )}
                          </div>

                          {isGenerating ? (
                              <div className="flex items-center justify-center gap-2 text-amber-200/50 text-sm py-4">
                                  <Loader2 className="animate-spin w-4 h-4" />
                                  <span>正在解读星象...</span>
                              </div>
                          ) : (
                              <>
                                <p className="text-sm leading-relaxed text-amber-100 font-serif text-shadow-sm mb-4 text-left">
                                    {aiInterpretation || card.meaning}
                                </p>
                                
                                <button 
                                    onClick={handleSaveToDesktop}
                                    data-html2canvas-ignore
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-amber-900/20 hover:bg-amber-800/40 border border-amber-700/30 rounded-lg text-xs font-cinzel text-amber-200 transition-all cursor-pointer sticky bottom-0"
                                >
                                    <Download size={14} />
                                    保存到桌面
                                </button>
                              </>
                          )}
                      </div>
                  </motion.div>
               </div>
            )}

          </motion.div>
        );
      })}
    </div>
  );
};

export default TarotDeck;