export enum AppState {
  INTRO = 'INTRO',
  STACKED = 'STACKED',
  SHUFFLING = 'SHUFFLING',
  SELECTING = 'SELECTING',
  REVEALED = 'REVEALED',
}

export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST',
  OPEN_PALM = 'OPEN_PALM',
  POINTING = 'POINTING',
}

export interface HandData {
  gesture: GestureType;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  velocity: { x: number; y: number };
  tilt: number; // For the "shake" detection (linear x offset)
  angle: number; // Rotation angle of index finger in degrees (0 is vertical)
}

export interface TarotCardData {
  id: number;
  name: string;
  image: string;
  meaning: string;
}

export const MAJOR_ARCANA: TarotCardData[] = [
  { id: 0, name: "The Fool", image: "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg", meaning: "New beginnings, innocence, spontaneity." },
  { id: 1, name: "The Magician", image: "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg", meaning: "Manifestation, resourcefulness, power." },
  { id: 2, name: "The High Priestess", image: "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg", meaning: "Intuition, sacred knowledge, divine feminine." },
  { id: 3, name: "The Empress", image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg", meaning: "Femininity, beauty, nature, nurturing." },
  { id: 4, name: "The Emperor", image: "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg", meaning: "Authority, establishment, structure." },
  { id: 5, name: "The Hierophant", image: "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg", meaning: "Spiritual wisdom, religious beliefs, conformity." },
  { id: 6, name: "The Lovers", image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/RWS_Tarot_06_Lovers.jpg", meaning: "Love, harmony, relationships, values alignment." },
  { id: 7, name: "The Chariot", image: "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg", meaning: "Control, willpower, success, action." },
  { id: 8, name: "Strength", image: "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg", meaning: "Strength, courage, persuasion, influence." },
  { id: 9, name: "The Hermit", image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg", meaning: "Soul-searching, introspection, being alone." },
  { id: 10, name: "Wheel of Fortune", image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg", meaning: "Good luck, karma, life cycles, destiny." },
  { id: 11, name: "Justice", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg", meaning: "Justice, fairness, truth, cause and effect." },
  { id: 12, name: "The Hanged Man", image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg", meaning: "Pause, surrender, letting go, new perspectives." },
  { id: 13, name: "Death", image: "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg", meaning: "Endings, change, transformation, transition." },
  { id: 14, name: "Temperance", image: "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg", meaning: "Balance, moderation, patience, purpose." },
  { id: 15, name: "The Devil", image: "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg", meaning: "Shadow self, attachment, addiction, restriction." },
  { id: 16, name: "The Tower", image: "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg", meaning: "Sudden change, upheaval, chaos, revelation." },
  { id: 17, name: "The Star", image: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg", meaning: "Hope, faith, purpose, renewal, spirituality." },
  { id: 18, name: "The Moon", image: "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg", meaning: "Illusion, fear, anxiety, subconscious, intuition." },
  { id: 19, name: "The Sun", image: "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg", meaning: "Positivity, fun, warmth, success, vitality." },
  { id: 20, name: "Judgement", image: "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg", meaning: "Judgement, rebirth, inner calling, absolution." },
  { id: 21, name: "The World", image: "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg", meaning: "Completion, integration, accomplishment, travel." },
];