import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Expand, MousePointer2, Shuffle, RotateCw, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import HandTracker from './components/HandTracker';
import TarotDeck, { DESIGNS } from './components/TarotDeck';
import { AppState, GestureType, HandData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [handData, setHandData] = useState<HandData>({
    gesture: GestureType.NONE,
    x: 0.5,
    y: 0.5,
    velocity: { x: 0, y: 0 },
    tilt: 0,
    angle: 0
  });
  
  const [designIndex, setDesignIndex] = useState(0);

  const handleStart = () => {
    setAppState(AppState.STACKED);
  };

  const nextDesign = () => setDesignIndex((prev) => (prev + 1) % DESIGNS.length);
  const prevDesign = () => setDesignIndex((prev) => (prev - 1 + DESIGNS.length) % DESIGNS.length);

  const getInstructionText = () => {
    switch (appState) {
      case AppState.STACKED:
        return { text: "Open your hand to shuffle the deck.", icon: <Expand className="w-6 h-6 mb-2" /> };
      case AppState.SHUFFLING:
        return { text: "Move hand to shuffle. Point ☝️ to select a card.", icon: <MousePointer2 className="w-6 h-6 mb-2" /> };
      case AppState.SELECTING:
        return { text: "Shake your finger to reveal destiny.", icon: <RotateCw className="w-6 h-6 mb-2" /> };
      case AppState.REVEALED:
        return { text: "Open hand to restart.", icon: <Expand className="w-6 h-6 mb-2" /> };
      default:
        return { text: "", icon: null };
    }
  };

  const instruction = getInstructionText();
  const CurrentDesignComponent = DESIGNS[designIndex].component;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-black via-[#0a0a0c] to-[#1a1510] text-amber-50 selection:bg-amber-900/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-80 pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        
        {/* Intro Screen */}
        <AnimatePresence>
          {appState === AppState.INTRO && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-50 flex flex-col items-center text-center max-w-lg p-8"
            >
              <h1 className="font-cinzel text-5xl md:text-7xl mb-2 tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-800 drop-shadow-lg">
                ARCANUM
              </h1>
              <p className="font-serif text-lg text-gray-400 mb-8 italic">
                "Destiny lies in the palm of your hand."
              </p>
              
              {/* Deck Selection UI */}
              <div className="mb-8 flex flex-col items-center gap-4">
                 <div className="relative w-24 h-36 rounded-lg shadow-xl overflow-hidden border border-white/10 group">
                    <CurrentDesignComponent />
                    {/* Overlay to dim slightly */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <button onClick={prevDesign} className="p-2 text-white/50 hover:text-amber-200 transition-colors">
                         <ChevronLeft size={20} />
                     </button>
                     <span className="font-cinzel text-xs uppercase tracking-widest text-amber-100/80 w-32">
                         {DESIGNS[designIndex].name}
                     </span>
                     <button onClick={nextDesign} className="p-2 text-white/50 hover:text-amber-200 transition-colors">
                         <ChevronRight size={20} />
                     </button>
                 </div>
              </div>

              <button 
                onClick={handleStart}
                className="group relative px-8 py-4 bg-transparent overflow-hidden border border-amber-800/50 hover:border-amber-500 transition-colors duration-500"
              >
                <div className="absolute inset-0 w-0 bg-amber-900/20 transition-all duration-[250ms] ease-out group-hover:w-full opacity-50" />
                <span className="relative font-cinzel text-xl tracking-widest flex items-center gap-3">
                   <PlayCircle className="w-5 h-5" /> BEGIN
                </span>
              </button>

              <div className="mt-12 grid grid-cols-2 gap-8 text-xs text-gray-500 font-mono uppercase tracking-widest opacity-60">
                <div className="flex flex-col items-center gap-2">
                    <Hand className="w-6 h-6" />
                    <span>Gesture Control</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border rounded-full border-gray-500 flex items-center justify-center">?</div>
                    <span>Camera Required</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tarot Deck Area */}
        {appState !== AppState.INTRO && (
            <>
                <TarotDeck 
                    appState={appState} 
                    handData={handData} 
                    setAppState={setAppState} 
                    designIndex={designIndex}
                />

                {/* Hand Vision Monitor (Top Right) */}
                <HandTracker onHandUpdate={setHandData} />

                {/* Gesture Feedback UI (Bottom Center) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={appState} // Re-animate on state change
                    className="absolute bottom-12 flex flex-col items-center text-center"
                >
                    <div className="text-amber-500 animate-pulse">
                        {instruction.icon}
                    </div>
                    <p className="font-cinzel text-sm md:text-base tracking-widest text-amber-100/80 drop-shadow-md bg-black/40 px-4 py-2 rounded-full border border-amber-900/30 backdrop-blur-md">
                        {instruction.text}
                    </p>
                    
                    {/* Debug/Confidence Indicator - Subtle */}
                    <div className="mt-4 flex gap-4 text-[10px] text-gray-600 font-mono">
                        <span>GESTURE: <span className="text-amber-600">{handData.gesture}</span></span>
                        <span>VELOCITY: <span className="text-amber-600">{Math.abs(handData.velocity.x).toFixed(2)}</span></span>
                    </div>
                </motion.div>
            </>
        )}
      </main>
    </div>
  );
};

export default App;