const fs = require('fs');
const path = require('path');

const outDir = 'c:/Users/C097731/Desktop/mayur.saitwal/public/assets/fruitmerge';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// All fruit bodies centered at (128, 128) with radius 122 (diameter 244 in 256x256 viewBox)
// This guarantees zero collision gap when scaled by (256 / 244)!

// 1. Cherry (Tier 1)
const cherrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="cherryGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff6b8b"/>
      <stop offset="60%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <!-- Fruit Body -->
  <circle cx="128" cy="128" r="122" fill="url(#cherryGrad)"/>
  <!-- Specular Highlight -->
  <ellipse cx="80" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.65" transform="rotate(-30 80 72)"/>
  <circle cx="110" cy="58" r="7" fill="#ffffff" opacity="0.75"/>
  <!-- Stem & Leaf -->
  <path d="M128,16 C138,4 155,2 170,8" fill="none" stroke="#65a30d" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="160" cy="10" rx="16" ry="8" fill="#84cc16" transform="rotate(-20 160 10)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="150" r="18" fill="#fb7185" opacity="0.65"/>
  <circle cx="186" cy="150" r="18" fill="#fb7185" opacity="0.65"/>
  <!-- Eyes -->
  <circle cx="90" cy="122" r="11" fill="#1e293b"/>
  <circle cx="86" cy="118" r="4" fill="#ffffff"/>
  <circle cx="166" cy="122" r="11" fill="#1e293b"/>
  <circle cx="162" cy="118" r="4" fill="#ffffff"/>
  <!-- Mouth (Cute Pout / Smile) -->
  <path d="M116,148 Q128,160 140,148" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 2. Strawberry (Tier 2)
const strawberrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="strawGrad" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#ff4d6d"/>
      <stop offset="65%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <!-- Berry Body (Centered circle filling r=122) -->
  <circle cx="128" cy="128" r="122" fill="url(#strawGrad)"/>
  <!-- Seeds -->
  <g fill="#fef08a" opacity="0.85">
    <ellipse cx="70" cy="80" rx="4" ry="7" transform="rotate(-15 70 80)"/>
    <ellipse cx="186" cy="80" rx="4" ry="7" transform="rotate(15 186 80)"/>
    <ellipse cx="50" cy="135" rx="4" ry="7" transform="rotate(-25 50 135)"/>
    <ellipse cx="206" cy="135" rx="4" ry="7" transform="rotate(25 206 135)"/>
    <ellipse cx="78" cy="195" rx="4" ry="7" transform="rotate(-10 78 195)"/>
    <ellipse cx="178" cy="195" rx="4" ry="7" transform="rotate(10 178 195)"/>
    <ellipse cx="128" cy="218" rx="4" ry="7"/>
    <ellipse cx="128" cy="75" rx="4" ry="7"/>
  </g>
  <!-- Highlights -->
  <ellipse cx="75" cy="65" rx="28" ry="12" fill="#ffffff" opacity="0.55" transform="rotate(-25 75 65)"/>
  <!-- Green Calyx Leaves Crown -->
  <path d="M128,25 L106,6 C100,20 82,18 70,22 C90,32 102,40 115,38 L128,25 Z" fill="#22c55e"/>
  <path d="M128,25 L150,6 C156,20 174,18 186,22 C166,32 154,40 141,38 L128,25 Z" fill="#16a34a"/>
  <ellipse cx="128" cy="24" rx="28" ry="9" fill="#15803d"/>
  <!-- Cheeks -->
  <circle cx="72" cy="152" r="18" fill="#fb7185" opacity="0.65"/>
  <circle cx="184" cy="152" r="18" fill="#fb7185" opacity="0.65"/>
  <!-- Angry / Cute Eyes -->
  <path d="M72,114 L102,128" stroke="#1e293b" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="90" cy="130" r="10" fill="#1e293b"/>
  <circle cx="86" cy="127" r="3.5" fill="#ffffff"/>
  <path d="M184,114 L154,128" stroke="#1e293b" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="166" cy="130" r="10" fill="#1e293b"/>
  <circle cx="162" cy="127" r="3.5" fill="#ffffff"/>
  <!-- Frown Mouth -->
  <path d="M115,160 Q128,148 141,160" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 3. Purple Grape / Mangosteen (Tier 3)
const grapeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="grapeGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="60%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#581c87"/>
    </radialGradient>
  </defs>
  <!-- Fruit Body -->
  <circle cx="128" cy="128" r="122" fill="url(#grapeGrad)"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.6" transform="rotate(-30 78 72)"/>
  <circle cx="106" cy="56" r="6" fill="#ffffff" opacity="0.7"/>
  <!-- 4-lobe Green Calyx Crown -->
  <g fill="#4ade80" stroke="#15803d" stroke-width="2.5">
    <ellipse cx="98" cy="20" rx="20" ry="11" transform="rotate(-25 98 20)"/>
    <ellipse cx="158" cy="20" rx="20" ry="11" transform="rotate(25 158 20)"/>
    <ellipse cx="128" cy="28" rx="24" ry="12"/>
    <circle cx="128" cy="12" r="7" fill="#15803d"/>
  </g>
  <!-- Cheeks -->
  <circle cx="70" cy="150" r="18" fill="#e879f9" opacity="0.55"/>
  <circle cx="186" cy="150" r="18" fill="#e879f9" opacity="0.55"/>
  <!-- Eyes -->
  <circle cx="90" cy="124" r="11" fill="#1e1b4b"/>
  <circle cx="86" cy="120" r="4" fill="#ffffff"/>
  <circle cx="166" cy="124" r="11" fill="#1e1b4b"/>
  <circle cx="162" cy="120" r="4" fill="#ffffff"/>
  <!-- Frown -->
  <path d="M115,155 Q128,142 141,155" fill="none" stroke="#1e1b4b" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 4. Yellow Dekopon / Lemon (Tier 4)
const lemonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="lemonGrad" cx="35%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="65%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </radialGradient>
  </defs>
  <!-- Fruit Body -->
  <circle cx="128" cy="128" r="122" fill="url(#lemonGrad)"/>
  <!-- Top Bump -->
  <ellipse cx="128" cy="10" rx="20" ry="10" fill="#facc15"/>
  <!-- Specular -->
  <ellipse cx="80" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.65" transform="rotate(-25 80 72)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="152" r="18" fill="#fb923c" opacity="0.55"/>
  <circle cx="186" cy="152" r="18" fill="#fb923c" opacity="0.55"/>
  <!-- Grumpy Eyes Looking Down -->
  <path d="M76,112 Q90,104 104,114" stroke="#713f12" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="90" cy="126" r="11" fill="#713f12"/>
  <circle cx="86" cy="122" r="4" fill="#ffffff"/>
  <path d="M180,112 Q166,104 152,114" stroke="#713f12" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="166" cy="126" r="11" fill="#713f12"/>
  <circle cx="162" cy="122" r="4" fill="#ffffff"/>
  <!-- Frown -->
  <path d="M115,158 Q128,145 141,158" fill="none" stroke="#713f12" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 5. Orange (Tier 5)
const orangeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="orangeGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="55%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#orangeGrad)"/>
  <!-- Green Stem & Leaf -->
  <path d="M128,18 C128,8 136,4 144,4" fill="none" stroke="#15803d" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="152" cy="8" rx="18" ry="9" fill="#22c55e" transform="rotate(-15 152 8)"/>
  <!-- Specular -->
  <ellipse cx="78" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.65" transform="rotate(-30 78 72)"/>
  <!-- Angry Cheeks -->
  <circle cx="70" cy="154" r="18" fill="#ea580c" opacity="0.65"/>
  <circle cx="186" cy="154" r="18" fill="#ea580c" opacity="0.65"/>
  <!-- Angry Angled Eyes (> <) -->
  <path d="M72,112 L102,126" stroke="#431407" stroke-width="6" stroke-linecap="round"/>
  <path d="M72,140 L102,126" stroke="#431407" stroke-width="6" stroke-linecap="round"/>
  <path d="M184,112 L154,126" stroke="#431407" stroke-width="6" stroke-linecap="round"/>
  <path d="M184,140 L154,126" stroke="#431407" stroke-width="6" stroke-linecap="round"/>
  <!-- Angry Frown -->
  <path d="M114,162 Q128,146 142,162" fill="none" stroke="#431407" stroke-width="6.5" stroke-linecap="round"/>
</svg>`;

// 6. Apple (Tier 6)
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="appleGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff758f"/>
      <stop offset="60%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#9f1239"/>
    </radialGradient>
  </defs>
  <!-- Apple Body (Centered circle filling r=122) -->
  <circle cx="128" cy="128" r="122" fill="url(#appleGrad)"/>
  <!-- Dimple Crease at Top -->
  <path d="M110,8 Q128,26 146,8" fill="none" stroke="#881337" stroke-width="6" stroke-linecap="round"/>
  <!-- Stem & Leaf -->
  <path d="M128,18 C126,6 135,2 142,2" fill="none" stroke="#78350f" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="152" cy="8" rx="16" ry="8" fill="#22c55e" transform="rotate(-25 152 8)"/>
  <!-- Two Glossy Pill Highlights -->
  <ellipse cx="68" cy="85" rx="20" ry="36" fill="#ffffff" opacity="0.65" transform="rotate(-20 68 85)"/>
  <ellipse cx="202" cy="98" rx="14" ry="24" fill="#ffffff" opacity="0.45" transform="rotate(20 202 98)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="156" r="18" fill="#fb7185" opacity="0.65"/>
  <circle cx="186" cy="156" r="18" fill="#fb7185" opacity="0.65"/>
  <!-- Grumpy Squinty Eyes -->
  <path d="M72,120 Q88,108 104,124" stroke="#4c0519" stroke-width="6" stroke-linecap="round"/>
  <path d="M184,120 Q168,108 152,124" stroke="#4c0519" stroke-width="6" stroke-linecap="round"/>
  <!-- Deep Frown Mouth -->
  <path d="M112,165 Q128,146 144,165" fill="none" stroke="#4c0519" stroke-width="6.5" stroke-linecap="round"/>
</svg>`;

// 7. Peach (Tier 7)
const peachSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="peachGrad" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="55%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#peachGrad)"/>
  <!-- Peach Crease Cleft Line -->
  <path d="M128,8 C126,45 125,85 125,115" fill="none" stroke="#f472b6" stroke-width="5" opacity="0.65" stroke-linecap="round"/>
  <!-- Leaf -->
  <ellipse cx="140" cy="14" rx="18" ry="8" fill="#4ade80" transform="rotate(-30 140 14)"/>
  <!-- Highlight -->
  <ellipse cx="72" cy="76" rx="28" ry="14" fill="#ffffff" opacity="0.65" transform="rotate(-30 72 76)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="20" fill="#f472b6" opacity="0.65"/>
  <circle cx="188" cy="154" r="20" fill="#f472b6" opacity="0.65"/>
  <!-- Expressive Cute Closed Squint Eyes -->
  <path d="M74,124 Q90,136 106,124" fill="none" stroke="#831843" stroke-width="6" stroke-linecap="round"/>
  <path d="M182,124 Q166,136 150,124" fill="none" stroke="#831843" stroke-width="6" stroke-linecap="round"/>
  <!-- Little Pout / Frown -->
  <path d="M114,160 Q128,148 142,160" fill="none" stroke="#831843" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 8. Honeydew / Green Melon (Tier 8)
const melonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="melonGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="65%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#4d7c0f"/>
    </radialGradient>
  </defs>
  <!-- Fruit Body -->
  <circle cx="128" cy="128" r="122" fill="url(#melonGrad)"/>
  <!-- Faint Reticulation Web Lines -->
  <g fill="none" stroke="#ecfccb" stroke-width="3.5" opacity="0.45" stroke-linecap="round">
    <path d="M30,100 Q80,85 140,105 T226,100"/>
    <path d="M35,155 Q100,172 160,150 T220,160"/>
    <path d="M75,45 Q128,68 185,50"/>
    <path d="M80,215 Q128,195 180,215"/>
    <path d="M95,60 Q78,128 100,198"/>
    <path d="M160,60 Q178,128 155,198"/>
  </g>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.65" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#a3e635" opacity="0.75"/>
  <circle cx="188" cy="154" r="18" fill="#a3e635" opacity="0.75"/>
  <!-- Squinting Grumpy Eyes -->
  <path d="M72,118 L100,130" stroke="#1a2e05" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M72,136 L100,130" stroke="#1a2e05" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M184,118 L156,130" stroke="#1a2e05" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M184,136 L156,130" stroke="#1a2e05" stroke-width="5.5" stroke-linecap="round"/>
  <!-- Wavy Grumpy Mouth -->
  <path d="M110,162 Q120,152 128,158 T146,156" fill="none" stroke="#1a2e05" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 9. Coconut (Tier 9 - Exactly matching reference)
const coconutSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="cocoGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#a16207"/>
      <stop offset="60%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </radialGradient>
  </defs>
  <!-- Fruit Body -->
  <circle cx="128" cy="128" r="122" fill="url(#cocoGrad)"/>
  <!-- 3 Coconut Germination Pores / Eyes -->
  <circle cx="108" cy="62" r="7" fill="#451a03"/>
  <circle cx="132" cy="56" r="7" fill="#451a03"/>
  <circle cx="120" cy="76" r="7" fill="#451a03"/>
  <!-- Large Glossy White Highlight Specular Spot -->
  <ellipse cx="68" cy="80" rx="26" ry="16" fill="#ffffff" opacity="0.88" transform="rotate(-35 68 80)"/>
  <circle cx="98" cy="64" r="6" fill="#ffffff" opacity="0.95"/>
  <!-- Bright Orange-Tan Blush Cheeks -->
  <circle cx="68" cy="154" r="20" fill="#ea580c" opacity="0.65"/>
  <circle cx="188" cy="154" r="20" fill="#ea580c" opacity="0.65"/>
  <!-- Angry (> <) Eyes -->
  <path d="M70,114 L102,128" stroke="#1c1917" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M70,140 L102,128" stroke="#1c1917" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M186,114 L154,128" stroke="#1c1917" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M186,140 L154,128" stroke="#1c1917" stroke-width="6.5" stroke-linecap="round"/>
  <!-- Grumpy Curved Frown -->
  <path d="M108,165 Q128,144 148,165" fill="none" stroke="#1c1917" stroke-width="7" stroke-linecap="round"/>
</svg>`;

// 10. Half Watermelon (Tier 10)
const halfWatermelonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="wmHalfGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="65%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#wmHalfGrad)"/>
  <!-- Dark Green Watermelon Stripes -->
  <g fill="none" stroke="#166534" stroke-width="14" stroke-linecap="round">
    <path d="M35,75 Q65,128 38,185"/>
    <path d="M78,40 Q106,128 82,216"/>
    <path d="M128,18 Q140,128 128,238"/>
    <path d="M178,40 Q152,128 174,216"/>
    <path d="M221,75 Q192,128 218,185"/>
  </g>
  <!-- Highlight -->
  <ellipse cx="72" cy="72" rx="30" ry="15" fill="#ffffff" opacity="0.65" transform="rotate(-30 72 72)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#86efac" opacity="0.65"/>
  <circle cx="188" cy="154" r="18" fill="#86efac" opacity="0.65"/>
  <!-- Eyes Looking Sideways -->
  <circle cx="92" cy="126" r="12" fill="#052e16"/>
  <circle cx="87" cy="123" r="4" fill="#ffffff"/>
  <circle cx="164" cy="126" r="12" fill="#052e16"/>
  <circle cx="159" cy="123" r="4" fill="#ffffff"/>
  <!-- Eyebrows -->
  <path d="M78,108 L106,116" stroke="#052e16" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M178,108 L150,116" stroke="#052e16" stroke-width="5.5" stroke-linecap="round"/>
  <!-- Frown -->
  <path d="M112,158 Q128,142 144,158" fill="none" stroke="#052e16" stroke-width="6.5" stroke-linecap="round"/>
</svg>`;

// 11. Giant Watermelon (Tier 11 - Exactly matching reference)
const giantWatermelonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="giantWmGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="50%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#14532d"/>
    </radialGradient>
  </defs>
  <!-- Outer Sphere Body (r=122, diameter=244) -->
  <circle cx="128" cy="128" r="122" fill="url(#giantWmGrad)"/>
  <!-- Wavy Jagged Watermelon Dark Green Stripes (Identical to reference screenshot) -->
  <g fill="none" stroke="#14532d" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">
    <path d="M26,80 Q44,105 34,128 Q44,152 28,180"/>
    <path d="M62,40 Q85,82 70,128 Q88,172 68,212"/>
    <path d="M104,14 Q126,70 108,128 Q126,182 108,238"/>
    <path d="M152,14 Q132,70 148,128 Q132,182 148,238"/>
    <path d="M194,40 Q172,82 186,128 Q168,172 190,212"/>
    <path d="M230,80 Q212,105 222,128 Q212,152 228,180"/>
  </g>
  <!-- Highlight Reflection -->
  <ellipse cx="70" cy="62" rx="32" ry="16" fill="#ffffff" opacity="0.7" transform="rotate(-30 70 62)"/>
  <circle cx="102" cy="46" r="6" fill="#ffffff" opacity="0.75"/>
  <!-- Cheeks -->
  <circle cx="65" cy="154" r="20" fill="#86efac" opacity="0.65"/>
  <circle cx="191" cy="154" r="20" fill="#86efac" opacity="0.65"/>
  <!-- Furrowed Grumpy Eyebrows -->
  <path d="M74,102 L114,118" stroke="#052e16" stroke-width="8" stroke-linecap="round"/>
  <path d="M182,102 L142,118" stroke="#052e16" stroke-width="8" stroke-linecap="round"/>
  <!-- Squinting Sideways Eyes (Matching reference) -->
  <circle cx="100" cy="128" r="14" fill="#052e16"/>
  <circle cx="94" cy="125" r="5" fill="#ffffff"/>
  <circle cx="156" cy="128" r="14" fill="#052e16"/>
  <circle cx="150" cy="125" r="5" fill="#ffffff"/>
  <!-- Deep Grumpy Frown -->
  <path d="M106,164 Q128,138 150,164" fill="none" stroke="#052e16" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const files = [
  { name: 'fruit_1_cherry.svg', content: cherrySvg },
  { name: 'fruit_2_strawberry.svg', content: strawberrySvg },
  { name: 'fruit_3_grape.svg', content: grapeSvg },
  { name: 'fruit_4_lemon.svg', content: lemonSvg },
  { name: 'fruit_5_orange.svg', content: orangeSvg },
  { name: 'fruit_6_apple.svg', content: appleSvg },
  { name: 'fruit_7_peach.svg', content: peachSvg },
  { name: 'fruit_8_melon.svg', content: melonSvg },
  { name: 'fruit_9_coconut.svg', content: coconutSvg },
  { name: 'fruit_10_half_watermelon.svg', content: halfWatermelonSvg },
  { name: 'fruit_11_giant_watermelon.svg', content: giantWatermelonSvg },
];

for (const file of files) {
  const filePath = path.join(outDir, file.name);
  fs.writeFileSync(filePath, file.content, 'utf8');
}

console.log('All 11 fruit SVGs re-generated with tight r=122 center!');
