import { GestureType } from '../types';

// Simple distance helper
const dist = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const detectGesture = (landmarks: any[]): GestureType => {
  if (!landmarks || landmarks.length === 0) return GestureType.NONE;

  // Key landmarks
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexPip = landmarks[6]; // PIP joint
  const middlePip = landmarks[10];
  const ringPip = landmarks[14];
  const pinkyPip = landmarks[18];

  // Helper to check if finger is extended (Tip is further from wrist than PIP)
  // Note: This is a rough heuristic. A robust one uses vectors.
  const isExtended = (tip: any, pip: any) => dist(tip, wrist) > dist(pip, wrist) * 1.2;

  const indexOpen = isExtended(indexTip, indexPip);
  const middleOpen = isExtended(middleTip, middlePip);
  const ringOpen = isExtended(ringTip, ringPip);
  const pinkyOpen = isExtended(pinkyTip, pinkyPip);
  
  // Thumb is tricky, let's check distance from index MCP
  const thumbOpen = dist(thumbTip, landmarks[5]) > 0.1;

  // Logic Tree
  if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
    return GestureType.OPEN_PALM;
  }

  if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    return GestureType.POINTING;
  }

  if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    return GestureType.FIST;
  }

  return GestureType.NONE;
};