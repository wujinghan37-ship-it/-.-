import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { HandData, GestureType } from '../types';
import { detectGesture } from '../services/gestureService';
import { Loader2 } from 'lucide-react';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store previous position for velocity calc
  const prevPosRef = useRef<{ x: number, y: number } | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
      } catch (err) {
        console.error(err);
        setError("Failed to load hand tracking models.");
        setLoading(false);
      }
    };

    const startWebcam = () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Webcam not supported.");
        setLoading(false);
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError("Permission denied or no camera found.");
          setLoading(false);
        });
    };

    const predictWebcam = () => {
      if (!videoRef.current || !canvasRef.current || !handLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      const now = performance.now();
      const results = handLandmarker.detectForVideo(video, now);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const drawingUtils = new DrawingUtils(ctx);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Draw skeleton
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2
        });
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 1,
          radius: 3
        });

        // Analyze gesture
        const gesture = detectGesture(landmarks);
        
        // Calculate Center Mass (Palm center roughly)
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        const cx = (wrist.x + middleMCP.x) / 2;
        const cy = (wrist.y + middleMCP.y) / 2;

        // Calculate velocity
        let velocity = { x: 0, y: 0 };
        if (prevPosRef.current && lastTimeRef.current > 0) {
          const dt = (now - lastTimeRef.current) / 1000;
          if (dt > 0) {
            velocity = {
              x: (cx - prevPosRef.current.x) / dt,
              y: (cy - prevPosRef.current.y) / dt
            };
          }
        }
        
        // Calculate Index Finger 'Tilt' (linear offset)
        const indexTip = landmarks[8];
        const tilt = indexTip.x - wrist.x;

        // Calculate Precise Angle of Index Finger (0 deg = Vertical)
        // Vector from Wrist (0) to Index Tip (8)
        const dx = indexTip.x - wrist.x;
        const dy = indexTip.y - wrist.y;
        // atan2 returns angle in radians. 
        // We want 0 at top (negative Y). 
        // Note: Y increases downwards in canvas.
        // Vector pointing UP: dy is negative.
        // angle = atan2(dx, -dy) * 180/PI
        const angle = Math.atan2(dx, -dy) * (180 / Math.PI);

        prevPosRef.current = { x: cx, y: cy };
        lastTimeRef.current = now;

        onHandUpdate({
          gesture,
          x: 1 - cx, // Mirror horizontally
          y: cy,
          velocity: { x: -velocity.x, y: velocity.y }, // Mirror velocity x
          tilt,
          angle: -angle // Mirror angle
        });

      } else {
        // No hand
        onHandUpdate({
          gesture: GestureType.NONE,
          x: 0.5,
          y: 0.5,
          velocity: { x: 0, y: 0 },
          tilt: 0,
          angle: 0
        });
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setup();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, [onHandUpdate]);

  return (
    <div className="absolute top-4 right-4 z-50 border border-white/20 rounded-lg overflow-hidden bg-black/80 shadow-2xl backdrop-blur-sm w-48 h-36 transition-opacity duration-500 hover:opacity-100 opacity-80">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs p-2 text-center">
          {error}
        </div>
      )}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50 transform scale-x-[-1]" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" width={320} height={240} />
      <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center text-white/70 py-1 font-mono uppercase tracking-widest">
        Hand Vision Feed
      </div>
    </div>
  );
};

export default HandTracker;