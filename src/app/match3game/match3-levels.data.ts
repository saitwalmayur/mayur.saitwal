export type ObjectiveType = 'score' | 'ice' | 'crates' | 'jelly' | 'collect';

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  current?: number;
  gemColor?: number; // For 'collect' objective (0: Ruby, 1: Sapphire, 2: Emerald, 3: Topaz, 4: Amethyst, 5: Diamond)
  label: string;
}

export interface LevelConfig {
  level: number;
  chapter: number;
  chapterName: string;
  name: string;
  rows: number;
  cols: number;
  moves: number;
  colors: number; // 4, 5, or 6
  targetScore: number;
  starThresholds: [number, number, number];
  objectives: LevelObjective[];
  // Grid layout definitions: (col, row) positions
  icePositions?: [number, number][];
  cratePositions?: [number, number][];
  jellyPositions?: [number, number][];
  holePositions?: [number, number][]; // blocked tiles
}

export interface PlayerLevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number;
  highScore: number;
}

// Procedural generator that creates 100 balanced, engaging levels
export function generate100Levels(): LevelConfig[] {
  const levels: LevelConfig[] = [];

  const chapterNames = [
    'Emerald Meadow',
    'Sapphire Cavern',
    'Amber Fortress',
    'Ruby Volcano',
    'Prismatic Citadel',
  ];

  for (let lvl = 1; lvl <= 100; lvl++) {
    const chapter = Math.min(5, Math.floor((lvl - 1) / 20) + 1);
    const chapterName = chapterNames[chapter - 1];

    const rows = 8;
    const cols = 8;

    // Moves gradually tighten from 32 down to 20
    const baseMoves = Math.max(18, Math.round(32 - (lvl / 100) * 12));
    const moves = (lvl % 5 === 0) ? baseMoves - 2 : baseMoves; // Boss/milestone levels have fewer moves

    // Colors: Levels 1-15: 4 colors; 16-60: 5 colors; 61-100: 6 colors
    const colors = lvl <= 15 ? 4 : (lvl <= 60 ? 5 : 6);

    // Target score scales up
    const targetScore = 1500 + lvl * 350 + (lvl % 10 === 0 ? 1500 : 0);
    const star1 = targetScore;
    const star2 = Math.round(targetScore * 1.4);
    const star3 = Math.round(targetScore * 1.9);

    const objectives: LevelObjective[] = [];
    const icePositions: [number, number][] = [];
    const cratePositions: [number, number][] = [];
    const jellyPositions: [number, number][] = [];
    const holePositions: [number, number][] = [];

    // Level names
    const subNames = [
      'Glimmering Path', 'Jeweled Garden', 'Crystal Springs', 'Gem Valley',
      'Whispering Chasm', 'Frosty Hollow', 'Sunken Depths', 'Glacial Verge',
      'Gilded Ramparts', 'Topaz Keep', 'Molten Hearth', 'Obsidian Forge',
      'Dragon Spire', 'Chrono Nexus', 'Apex of Light'
    ];
    const name = `${subNames[(lvl - 1) % subNames.length]} ${lvl > 15 ? 'II' : ''}`.trim();

    // Objective assignment based on chapter & level
    if (lvl <= 10) {
      // Intro levels: Pure score
      objectives.push({
        type: 'score',
        target: targetScore,
        label: `Score ${targetScore.toLocaleString()} pts`,
      });
    } else if (lvl <= 30) {
      // Chapter 1-2: Ice Blocks
      const numIce = Math.min(24, 6 + Math.floor((lvl - 10) * 0.9));
      // Place ice in symmetric patterns
      for (let c = 2; c <= 5; c++) {
        for (let r = 2; r <= 5; r++) {
          if (icePositions.length < numIce) {
            icePositions.push([c, r]);
          }
        }
      }
      if (icePositions.length < numIce) {
        for (let c = 1; c <= 6; c += 5) {
          for (let r = 1; r <= 6; r++) {
            if (icePositions.length < numIce) icePositions.push([c, r]);
          }
        }
      }

      objectives.push({
        type: 'ice',
        target: icePositions.length,
        label: `Break ${icePositions.length} Ice Blocks`,
      });
      objectives.push({
        type: 'score',
        target: Math.round(targetScore * 0.75),
        label: `Score ${Math.round(targetScore * 0.75).toLocaleString()} pts`,
      });
    } else if (lvl <= 50) {
      // Chapter 2-3: Wooden Crates & Ice
      const numCrates = Math.min(16, 4 + Math.floor((lvl - 30) * 0.6));
      // Place crates in corners and center clusters
      const crateCoords: [number, number][] = [
        [1, 1], [1, 2], [6, 1], [6, 2],
        [1, 5], [1, 6], [6, 5], [6, 6],
        [3, 3], [4, 3], [3, 4], [4, 4],
        [2, 3], [5, 3], [2, 4], [5, 4]
      ];
      for (let i = 0; i < Math.min(numCrates, crateCoords.length); i++) {
        cratePositions.push(crateCoords[i]);
      }

      objectives.push({
        type: 'crates',
        target: cratePositions.length,
        label: `Smash ${cratePositions.length} Crates`,
      });
      objectives.push({
        type: 'score',
        target: Math.round(targetScore * 0.7),
        label: `Score ${Math.round(targetScore * 0.7).toLocaleString()} pts`,
      });
    } else if (lvl <= 70) {
      // Chapter 3-4: Jelly clearing
      const numJelly = Math.min(28, 8 + Math.floor((lvl - 50) * 1.0));
      // Place jelly in middle zone
      for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 6; c++) {
          if (jellyPositions.length < numJelly) {
            jellyPositions.push([c, r]);
          }
        }
      }

      objectives.push({
        type: 'jelly',
        target: jellyPositions.length,
        label: `Cleanse ${jellyPositions.length} Jelly Tiles`,
      });
      objectives.push({
        type: 'score',
        target: Math.round(targetScore * 0.7),
        label: `Score ${Math.round(targetScore * 0.7).toLocaleString()} pts`,
      });
    } else if (lvl <= 85) {
      // Chapter 4: Gem Collection Quests + Obstacles
      const targetColor = (lvl % 6);
      const colorNames = ['Red Rubies', 'Blue Sapphires', 'Emeralds', 'Topaz Gems', 'Amethysts', 'Diamonds'];
      const collectCount = 20 + Math.floor((lvl - 70) * 1.5);

      objectives.push({
        type: 'collect',
        target: collectCount,
        gemColor: targetColor,
        label: `Collect ${collectCount} ${colorNames[targetColor]}`,
      });

      // Also add some crates or ice
      for (let i = 2; i <= 5; i++) {
        icePositions.push([i, 3]);
        icePositions.push([i, 4]);
      }
      objectives.push({
        type: 'ice',
        target: icePositions.length,
        label: `Clear ${icePositions.length} Ice Blocks`,
      });
    } else {
      // Chapter 5 (Levels 86-100): Grand Master Trials (Multi-Objective)
      const numCrates = 8;
      const numIce = 12;

      for (let i = 1; i <= 6; i += 5) {
        cratePositions.push([i, 1], [i, 2], [i, 5], [i, 6]);
      }
      for (let c = 2; c <= 5; c++) {
        for (let r = 2; r <= 4; r++) {
          if (icePositions.length < numIce) icePositions.push([c, r]);
        }
      }

      objectives.push({
        type: 'ice',
        target: icePositions.length,
        label: `Break ${icePositions.length} Ice`,
      });
      objectives.push({
        type: 'crates',
        target: cratePositions.length,
        label: `Smash ${cratePositions.length} Crates`,
      });
      objectives.push({
        type: 'score',
        target: targetScore,
        label: `Score ${targetScore.toLocaleString()} pts`,
      });
    }

    // Occasional corner hole cutouts on higher levels for interesting topology
    if (lvl >= 45 && lvl % 4 === 0) {
      holePositions.push([0, 0], [7, 0], [0, 7], [7, 7]);
    }

    levels.push({
      level: lvl,
      chapter,
      chapterName,
      name,
      rows,
      cols,
      moves,
      colors,
      targetScore,
      starThresholds: [star1, star2, star3],
      objectives,
      icePositions,
      cratePositions,
      jellyPositions,
      holePositions,
    });
  }

  return levels;
}
