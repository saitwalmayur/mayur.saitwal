import * as THREE from 'three';

export type GameMode = 'ai' | 'practice' | 'pass_and_play';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type BallType = 'cue' | 'solid' | 'stripe' | 'eight';
export type TurnPlayer = 'player' | 'computer' | 'player2';
export type SuitType = 'solids' | 'stripes' | null;
export type CameraMode = 'aim' | 'top' | 'orbit';

export type GameState =
  | 'ready'
  | 'aiming'
  | 'shooting'
  | 'rolling'
  | 'ball_in_hand'
  | 'ai_thinking'
  | 'game_over';

export interface PoolBall {
  id: number;
  number: number;
  type: BallType;
  colorHex: number;
  stripeColorHex?: number;
  mesh: THREE.Mesh;
  shadowMesh?: THREE.Mesh;
  pos: THREE.Vector2; // X and Z coordinates on the table surface (table length is Z, width is X)
  vel: THREE.Vector2;
  spin: THREE.Vector2; // Spin / English vector
  isPotted: boolean;
  pottedOrder: number;
  isDropping: boolean;
  dropProgress: number;
}

export interface PocketDef {
  id: string;
  name: string;
  pos: THREE.Vector2; // 2D center on table plane (X, Z)
  radius: number;
  isCorner: boolean;
}

export interface CueConfig {
  id: string;
  name: string;
  price: number;
  tier: 'Standard' | 'Pro' | 'Elite' | 'Legendary' | 'Cyber' | 'Royal';
  power: number; // 0.5 to 1.0 multiplier
  aimGuide: number; // 1.0 to 2.5 length multiplier
  spinControl: number; // 0.5 to 1.0 spin sensitivity
  description: string;
  shaftWoodColor: string; // Hex for shaft wood
  buttWoodColor: string; // Hex for butt handle
  wrapColor: string; // Hex for grip wrap
  accentColor: string; // Metallic or glow accent
  glow: boolean;
  unlocked: boolean;
}

export interface PlayerData {
  coins: number;
  equippedCueId: string;
  unlockedCueIds: string[];
  winsVsAI: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalMatches: number;
  totalBallsPotted: number;
}

// =============================================================================
// TABLE GEOMETRY & PHYSICS CONSTANTS
// Standard 9ft tournament table ratio 2:1
// Coordinate system: X is width (-0.635 to +0.635), Z is length (-1.27 to +1.27), Y is up
// =============================================================================
export const TABLE_WIDTH = 1.27; // Playing surface width
export const TABLE_LENGTH = 2.54; // Playing surface length
export const HALF_WIDTH = TABLE_WIDTH / 2; // 0.635
export const HALF_LENGTH = TABLE_LENGTH / 2; // 1.27

export const BALL_RADIUS = 0.035; // ~57.15mm standard ball scaled for 3D realism
export const POCKET_RADIUS_CORNER = 0.082;
export const POCKET_RADIUS_SIDE = 0.088;
export const CUSHION_RESTITUTION = 0.82;
export const BALL_RESTITUTION = 0.96;
export const FRICTION_ROLLING = 0.988; // Substep rolling decay
export const VELOCITY_EPSILON = 0.0015; // Velocity threshold to consider ball stopped

// 6 Table Pockets (Coordinates on X-Z plane)
export const TABLE_POCKETS: PocketDef[] = [
  // 4 Corners (slightly indented to sit neatly inside cushion corners)
  { id: 'top_left', name: 'Top Left', pos: new THREE.Vector2(-HALF_WIDTH + 0.02, -HALF_LENGTH + 0.02), radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'top_right', name: 'Top Right', pos: new THREE.Vector2(HALF_WIDTH - 0.02, -HALF_LENGTH + 0.02), radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'bottom_left', name: 'Bottom Left', pos: new THREE.Vector2(-HALF_WIDTH + 0.02, HALF_LENGTH - 0.02), radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'bottom_right', name: 'Bottom Right', pos: new THREE.Vector2(HALF_WIDTH - 0.02, HALF_LENGTH - 0.02), radius: POCKET_RADIUS_CORNER, isCorner: true },
  // 2 Side Pockets
  { id: 'side_left', name: 'Center Left', pos: new THREE.Vector2(-HALF_WIDTH - 0.015, 0), radius: POCKET_RADIUS_SIDE, isCorner: false },
  { id: 'side_right', name: 'Center Right', pos: new THREE.Vector2(HALF_WIDTH + 0.015, 0), radius: POCKET_RADIUS_SIDE, isCorner: false },
];

// Default 6 Cues in Shop
export const DEFAULT_CUES: CueConfig[] = [
  {
    id: 'cue_maple',
    name: 'Hardrock Maple',
    price: 0,
    tier: 'Standard',
    power: 0.70,
    aimGuide: 1.0,
    spinControl: 0.65,
    description: 'Classic American hardrock maple with smooth silk finish and Irish linen wrap. The tournament standard.',
    shaftWoodColor: '#eed9b3',
    buttWoodColor: '#3c2317',
    wrapColor: '#1e293b',
    accentColor: '#94a3b8',
    glow: false,
    unlocked: true,
  },
  {
    id: 'cue_carbon',
    name: 'Midnight Carbon',
    price: 250,
    tier: 'Pro',
    power: 0.82,
    aimGuide: 1.35,
    spinControl: 0.78,
    description: 'Aerospace-grade matte carbon fiber composite shaft with ultra-low deflection and titanium joint collar.',
    shaftWoodColor: '#27272a',
    buttWoodColor: '#09090b',
    wrapColor: '#18181b',
    accentColor: '#38bdf8',
    glow: false,
    unlocked: false,
  },
  {
    id: 'cue_emerald',
    name: 'Emerald Royale',
    price: 600,
    tier: 'Elite',
    power: 0.88,
    aimGuide: 1.65,
    spinControl: 0.85,
    description: 'Hand-crafted green-dyed curly maple with genuine mother-of-pearl inlays and polished brass rings.',
    shaftWoodColor: '#e2d3b5',
    buttWoodColor: '#064e3b',
    wrapColor: '#022c22',
    accentColor: '#10b981',
    glow: false,
    unlocked: false,
  },
  {
    id: 'cue_dragon',
    name: 'Crimson Dragon',
    price: 1200,
    tier: 'Legendary',
    power: 0.94,
    aimGuide: 1.95,
    spinControl: 0.90,
    description: 'Forged with crimson heartwood, fiery dragon flame carvings, and weighted tungsten core for explosive breaks.',
    shaftWoodColor: '#f1dfcd',
    buttWoodColor: '#7f1d1d',
    wrapColor: '#450a0a',
    accentColor: '#ef4444',
    glow: false,
    unlocked: false,
  },
  {
    id: 'cue_cyber',
    name: 'Cyberpunk Pulse',
    price: 2200,
    tier: 'Cyber',
    power: 0.98,
    aimGuide: 2.25,
    spinControl: 0.95,
    description: 'High-tech nano-composite cue with integrated holographic aim laser and animated pulsing cyan neon circuitry.',
    shaftWoodColor: '#0f172a',
    buttWoodColor: '#020617',
    wrapColor: '#0369a1',
    accentColor: '#00f2fe',
    glow: true,
    unlocked: false,
  },
  {
    id: 'cue_gold',
    name: '24K Sovereign Crown',
    price: 4500,
    tier: 'Royal',
    power: 1.0,
    aimGuide: 2.6,
    spinControl: 1.0,
    description: 'Pure 24K mirror-polished gold plating with encrusted royal sapphire gems. The supreme masterwork of billiards.',
    shaftWoodColor: '#fef3c7',
    buttWoodColor: '#78350f',
    wrapColor: '#451a03',
    accentColor: '#fbbf24',
    glow: true,
    unlocked: false,
  },
];

// Pool Ball Standard Specifications (1-15 + Cue Ball)
export interface BallConfigSpec {
  id: number;
  number: number;
  type: BallType;
  colorHex: number;
  stripeColorHex?: number;
  name: string;
}

export const BALLS_SPEC: BallConfigSpec[] = [
  { id: 0, number: 0, type: 'cue', colorHex: 0xf8fafc, name: 'Cue Ball' },
  // Solids (1-7)
  { id: 1, number: 1, type: 'solid', colorHex: 0xfacc15, name: '1 Solid Yellow' },
  { id: 2, number: 2, type: 'solid', colorHex: 0x2563eb, name: '2 Solid Blue' },
  { id: 3, number: 3, type: 'solid', colorHex: 0xdc2626, name: '3 Solid Red' },
  { id: 4, number: 4, type: 'solid', colorHex: 0x7c3aed, name: '4 Solid Purple' },
  { id: 5, number: 5, type: 'solid', colorHex: 0xf97316, name: '5 Solid Orange' },
  { id: 6, number: 6, type: 'solid', colorHex: 0x16a34a, name: '6 Solid Green' },
  { id: 7, number: 7, type: 'solid', colorHex: 0x7f1d1d, name: '7 Solid Maroon' },
  // 8-Ball
  { id: 8, number: 8, type: 'eight', colorHex: 0x111827, name: '8 Black Ball' },
  // Stripes (9-15)
  { id: 9, number: 9, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0xfacc15, name: '9 Stripe Yellow' },
  { id: 10, number: 10, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0x2563eb, name: '10 Stripe Blue' },
  { id: 11, number: 11, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0xdc2626, name: '11 Stripe Red' },
  { id: 12, number: 12, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0x7c3aed, name: '12 Stripe Purple' },
  { id: 13, number: 13, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0xf97316, name: '13 Stripe Orange' },
  { id: 14, number: 14, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0x16a34a, name: '14 Stripe Green' },
  { id: 15, number: 15, type: 'stripe', colorHex: 0xf8fafc, stripeColorHex: 0x7f1d1d, name: '15 Stripe Maroon' },
];
