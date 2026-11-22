const fs = require('fs');
const path = require('path');

const outDir = 'c:/Users/C097731/Desktop/mayur.saitwal/public/assets/fruitmerge';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Cherry (Tier 1)
const cherrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="cherryGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff6b8b"/>
      <stop offset="60%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#9f1239"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#4c0519" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- Stem & Leaf -->
  <path d="M128,45 C135,15 155,10 170,18" fill="none" stroke="#65a30d" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="160" cy="18" rx="14" ry="7" fill="#84cc16" transform="rotate(-20 160 18)"/>
  <!-- Fruit Body -->
  <circle cx="128" cy="138" r="95" fill="url(#cherryGrad)" filter="url(#shadow)"/>
  <!-- Specular Highlight -->
  <ellipse cx="90" cy="85" rx="22" ry="12" fill="#ffffff" opacity="0.65" transform="rotate(-30 90 85)"/>
  <circle cx="112" cy="74" r="5" fill="#ffffff" opacity="0.7"/>
  <!-- Cheeks -->
  <circle cx="82" cy="155" r="14" fill="#fb7185" opacity="0.6"/>
  <circle cx="174" cy="155" r="14" fill="#fb7185" opacity="0.6"/>
  <!-- Eyes -->
  <circle cx="98" cy="134" r="9" fill="#1e293b"/>
  <circle cx="95" cy="131" r="3" fill="#ffffff"/>
  <circle cx="158" cy="134" r="9" fill="#1e293b"/>
  <circle cx="155" cy="131" r="3" fill="#ffffff"/>
  <!-- Mouth (Cute Little Smile / Pout) -->
  <path d="M118,155 Q128,165 138,155" fill="none" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 2. Strawberry (Tier 2)
const strawberrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="strawGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff4d6d"/>
      <stop offset="65%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <!-- Berry Body -->
  <path d="M128,38 C195,38 226,105 205,185 C185,232 145,248 128,248 C111,248 71,232 51,185 C30,105 61,38 128,38 Z" fill="url(#strawGrad)"/>
  <!-- Seeds -->
  <g fill="#fef08a" opacity="0.85">
    <ellipse cx="80" cy="95" rx="3" ry="5" transform="rotate(-15 80 95)"/>
    <ellipse cx="176" cy="95" rx="3" ry="5" transform="rotate(15 176 95)"/>
    <ellipse cx="65" cy="145" rx="3" ry="5" transform="rotate(-25 65 145)"/>
    <ellipse cx="191" cy="145" rx="3" ry="5" transform="rotate(25 191 145)"/>
    <ellipse cx="90" cy="205" rx="3" ry="5" transform="rotate(-10 90 205)"/>
    <ellipse cx="166" cy="205" rx="3" ry="5" transform="rotate(10 166 205)"/>
    <ellipse cx="128" cy="225" rx="3" ry="5"/>
  </g>
  <!-- Highlights -->
  <ellipse cx="88" cy="65" rx="20" ry="8" fill="#ffffff" opacity="0.45" transform="rotate(-20 88 65)"/>
  <!-- Green Calyx Leaves Crown -->
  <path d="M128,45 L110,12 C105,30 85,25 75,32 C95,45 105,52 118,52 L128,45 Z" fill="#22c55e"/>
  <path d="M128,45 L146,12 C151,30 171,25 181,32 C161,45 151,52 138,52 L128,45 Z" fill="#16a34a"/>
  <path d="M128,45 L128,8 C123,25 133,25 128,45 Z" fill="#15803d"/>
  <ellipse cx="128" cy="46" rx="25" ry="8" fill="#22c55e"/>
  <!-- Cheeks -->
  <circle cx="85" cy="158" r="14" fill="#fb7185" opacity="0.6"/>
  <circle cx="171" cy="158" r="14" fill="#fb7185" opacity="0.6"/>
  <!-- Angry / Cute Eyes -->
  <path d="M85,128 L108,138" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="98" cy="140" r="8" fill="#1e293b"/>
  <circle cx="95" cy="138" r="2.5" fill="#ffffff"/>
  <path d="M171,128 L148,138" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="158" cy="140" r="8" fill="#1e293b"/>
  <circle cx="155" cy="138" r="2.5" fill="#ffffff"/>
  <!-- Frown Mouth -->
  <path d="M118,168 Q128,158 138,168" fill="none" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
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
  <circle cx="128" cy="138" r="96" fill="url(#grapeGrad)"/>
  <!-- Highlight -->
  <ellipse cx="85" cy="85" rx="26" ry="13" fill="#ffffff" opacity="0.55" transform="rotate(-30 85 85)"/>
  <circle cx="110" cy="72" r="5" fill="#ffffff" opacity="0.6"/>
  <!-- 4-lobe Green Calyx Crown -->
  <g fill="#4ade80" stroke="#15803d" stroke-width="2">
    <ellipse cx="100" cy="50" rx="18" ry="10" transform="rotate(-30 100 50)"/>
    <ellipse cx="156" cy="50" rx="18" ry="10" transform="rotate(30 156 50)"/>
    <ellipse cx="128" cy="58" rx="22" ry="11"/>
    <circle cx="128" cy="42" r="6" fill="#15803d"/>
  </g>
  <!-- Cheeks -->
  <circle cx="82" cy="156" r="15" fill="#e879f9" opacity="0.5"/>
  <circle cx="174" cy="156" r="15" fill="#e879f9" opacity="0.5"/>
  <!-- Eyes -->
  <circle cx="98" cy="135" r="9.5" fill="#1e1b4b"/>
  <circle cx="95" cy="132" r="3.5" fill="#ffffff"/>
  <circle cx="158" cy="135" r="9.5" fill="#1e1b4b"/>
  <circle cx="155" cy="132" r="3.5" fill="#ffffff"/>
  <!-- Frown -->
  <path d="M116,162 Q128,150 140,162" fill="none" stroke="#1e1b4b" stroke-width="5" stroke-linecap="round"/>
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
  <!-- Little Top Nodule / Bump -->
  <ellipse cx="128" cy="42" rx="16" ry="10" fill="#facc15"/>
  <!-- Fruit Body -->
  <ellipse cx="128" cy="140" rx="98" ry="94" fill="url(#lemonGrad)"/>
  <!-- Specular -->
  <ellipse cx="88" cy="85" rx="25" ry="13" fill="#ffffff" opacity="0.6" transform="rotate(-25 88 85)"/>
  <!-- Cheeks -->
  <circle cx="82" cy="156" r="14" fill="#fb923c" opacity="0.5"/>
  <circle cx="174" cy="156" r="14" fill="#fb923c" opacity="0.5"/>
  <!-- Grumpy Eyes Looking Down -->
  <path d="M86,128 Q98,122 108,130" stroke="#713f12" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="98" cy="138" r="9" fill="#713f12"/>
  <circle cx="95" cy="135" r="3" fill="#ffffff"/>
  <path d="M170,128 Q158,122 148,130" stroke="#713f12" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="158" cy="138" r="9" fill="#713f12"/>
  <circle cx="155" cy="135" r="3" fill="#ffffff"/>
  <!-- Frown -->
  <path d="M116,164 Q128,154 140,164" fill="none" stroke="#713f12" stroke-width="5" stroke-linecap="round"/>
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
  <!-- Green Stem & Leaf -->
  <path d="M128,48 C128,30 134,22 142,20" fill="none" stroke="#15803d" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="150" cy="24" rx="16" ry="8" fill="#22c55e" transform="rotate(-15 150 24)"/>
  <!-- Body -->
  <circle cx="128" cy="138" r="98" fill="url(#orangeGrad)"/>
  <!-- Specular -->
  <ellipse cx="85" cy="85" rx="26" ry="14" fill="#ffffff" opacity="0.6" transform="rotate(-30 85 85)"/>
  <!-- Angry Cheeks -->
  <circle cx="82" cy="158" r="16" fill="#ea580c" opacity="0.6"/>
  <circle cx="174" cy="158" r="16" fill="#ea580c" opacity="0.6"/>
  <!-- Angry Angled Eyes (> <) -->
  <path d="M84,124 L108,138" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
  <path d="M84,146 L108,138" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
  <path d="M172,124 L148,138" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
  <path d="M172,146 L148,138" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
  <!-- Angry Frown -->
  <path d="M115,166 Q128,152 141,166" fill="none" stroke="#431407" stroke-width="5.5" stroke-linecap="round"/>
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
  <!-- Stem & Leaf -->
  <path d="M128,52 C126,25 138,15 145,12" fill="none" stroke="#78350f" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="152" cy="22" rx="16" ry="8" fill="#22c55e" transform="rotate(-25 152 22)"/>
  <!-- Apple Double Lobed Body -->
  <path d="M128,62 C158,45 220,55 224,120 C228,185 180,234 148,238 C135,240 131,236 128,236 C125,236 121,240 108,238 C76,234 28,185 32,120 C36,55 98,45 128,62 Z" fill="url(#appleGrad)"/>
  <!-- Two Glossy Pill Highlights -->
  <ellipse cx="78" cy="98" rx="18" ry="32" fill="#ffffff" opacity="0.65" transform="rotate(-20 78 98)"/>
  <ellipse cx="195" cy="115" rx="12" ry="22" fill="#ffffff" opacity="0.45" transform="rotate(20 195 115)"/>
  <!-- Cheeks -->
  <circle cx="82" cy="165" r="16" fill="#fb7185" opacity="0.6"/>
  <circle cx="174" cy="165" r="16" fill="#fb7185" opacity="0.6"/>
  <!-- Grumpy Squinty Eyes -->
  <path d="M85,134 Q98,124 110,138" stroke="#4c0519" stroke-width="5" stroke-linecap="round"/>
  <path d="M171,134 Q158,124 146,138" stroke="#4c0519" stroke-width="5" stroke-linecap="round"/>
  <!-- Deep Frown Mouth -->
  <path d="M114,172 Q128,156 142,172" fill="none" stroke="#4c0519" stroke-width="5.5" stroke-linecap="round"/>
</svg>`;

// 7. Peach (Tier 7)
const peachSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="peachGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="60%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </radialGradient>
  </defs>
  <!-- Leaf -->
  <ellipse cx="140" cy="36" rx="16" ry="8" fill="#4ade80" transform="rotate(-30 140 36)"/>
  <path d="M128,48 C128,38 132,32 135,28" stroke="#15803d" stroke-width="4"/>
  <!-- Peach Heart/Lobed Shape -->
  <path d="M128,52 C158,36 226,50 226,132 C226,202 178,236 128,244 C78,236 30,202 30,132 C30,50 98,36 128,52 Z" fill="url(#peachGrad)"/>
  <!-- Peach Crease Cleft Line -->
  <path d="M128,52 C126,75 125,105 125,125" fill="none" stroke="#f472b6" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="90" rx="24" ry="12" fill="#ffffff" opacity="0.6" transform="rotate(-30 78 90)"/>
  <!-- Cheeks -->
  <circle cx="78" cy="162" r="18" fill="#f472b6" opacity="0.6"/>
  <circle cx="178" cy="162" r="18" fill="#f472b6" opacity="0.6"/>
  <!-- Expressive Cute Closed Squint Eyes -->
  <path d="M85,138 Q98,148 110,138" fill="none" stroke="#831843" stroke-width="5" stroke-linecap="round"/>
  <path d="M171,138 Q158,148 146,138" fill="none" stroke="#831843" stroke-width="5" stroke-linecap="round"/>
  <!-- Little Pout / Frown -->
  <path d="M116,168 Q128,158 140,168" fill="none" stroke="#831843" stroke-width="5" stroke-linecap="round"/>
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
  <circle cx="128" cy="138" r="98" fill="url(#melonGrad)"/>
  <!-- Faint Reticulation Web Lines -->
  <g fill="none" stroke="#ecfccb" stroke-width="3" opacity="0.45" stroke-linecap="round">
    <path d="M45,110 Q90,95 140,115 T215,110"/>
    <path d="M50,160 Q105,175 160,155 T210,165"/>
    <path d="M85,60 Q128,80 175,65"/>
    <path d="M90,210 Q130,195 170,210"/>
    <path d="M100,75 Q85,135 105,195"/>
    <path d="M155,75 Q170,135 150,195"/>
  </g>
  <!-- Highlight -->
  <ellipse cx="85" cy="85" rx="26" ry="14" fill="#ffffff" opacity="0.6" transform="rotate(-30 85 85)"/>
  <!-- Cheeks -->
  <circle cx="80" cy="160" r="16" fill="#a3e635" opacity="0.7"/>
  <circle cx="176" cy="160" r="16" fill="#a3e635" opacity="0.7"/>
  <!-- Squinting Grumpy Eyes -->
  <path d="M84,132 L106,142" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
  <path d="M84,148 L106,142" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
  <path d="M172,132 L150,142" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
  <path d="M172,148 L150,142" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
  <!-- Wavy Grumpy Mouth -->
  <path d="M112,170 Q120,162 128,168 T144,166" fill="none" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
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
  <circle cx="128" cy="138" r="98" fill="url(#cocoGrad)"/>
  <!-- 3 Coconut Germination Pores / Eyes -->
  <circle cx="112" cy="76" r="6" fill="#451a03"/>
  <circle cx="132" cy="72" r="6" fill="#451a03"/>
  <circle cx="122" cy="88" r="6" fill="#451a03"/>
  <!-- Large Glossy White Highlight Specular Spot -->
  <ellipse cx="78" cy="95" rx="22" ry="14" fill="#ffffff" opacity="0.85" transform="rotate(-35 78 95)"/>
  <circle cx="102" cy="80" r="5" fill="#ffffff" opacity="0.9"/>
  <!-- Bright Orange-Tan Blush Cheeks -->
  <circle cx="78" cy="162" r="18" fill="#ea580c" opacity="0.6"/>
  <circle cx="178" cy="162" r="18" fill="#ea580c" opacity="0.6"/>
  <!-- Angry (> <) Eyes -->
  <path d="M82,126 L108,138" stroke="#1c1917" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M82,148 L108,138" stroke="#1c1917" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M174,126 L148,138" stroke="#1c1917" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M174,148 L148,138" stroke="#1c1917" stroke-width="5.5" stroke-linecap="round"/>
  <!-- Grumpy Curved Frown -->
  <path d="M112,172 Q128,154 144,172" fill="none" stroke="#1c1917" stroke-width="6" stroke-linecap="round"/>
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
  <circle cx="128" cy="138" r="98" fill="url(#wmHalfGrad)"/>
  <!-- Dark Green Watermelon Stripes -->
  <g fill="none" stroke="#166534" stroke-width="12" stroke-linecap="round">
    <path d="M50,90 Q75,138 52,190"/>
    <path d="M85,60 Q110,138 88,215"/>
    <path d="M128,45 Q138,138 128,230"/>
    <path d="M170,60 Q150,138 168,215"/>
    <path d="M205,90 Q185,138 202,190"/>
  </g>
  <!-- Highlight -->
  <ellipse cx="80" cy="85" rx="24" ry="12" fill="#ffffff" opacity="0.6" transform="rotate(-30 80 85)"/>
  <!-- Cheeks -->
  <circle cx="78" cy="160" r="16" fill="#86efac" opacity="0.6"/>
  <circle cx="178" cy="160" r="16" fill="#86efac" opacity="0.6"/>
  <!-- Eyes Looking Sideways -->
  <circle cx="98" cy="136" r="10" fill="#052e16"/>
  <circle cx="94" cy="134" r="3" fill="#ffffff"/>
  <circle cx="158" cy="136" r="10" fill="#052e16"/>
  <circle cx="154" cy="134" r="3" fill="#ffffff"/>
  <!-- Eyebrows -->
  <path d="M86,122 L110,128" stroke="#052e16" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M170,122 L146,128" stroke="#052e16" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Frown -->
  <path d="M115,165 Q128,152 141,165" fill="none" stroke="#052e16" stroke-width="5.5" stroke-linecap="round"/>
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
  <!-- Outer Sphere Body -->
  <circle cx="128" cy="128" r="120" fill="url(#giantWmGrad)"/>
  <!-- Wavy Jagged Watermelon Dark Green Stripes (Identical to reference screenshot) -->
  <g fill="none" stroke="#14532d" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30,85 Q45,105 38,128 Q45,150 32,175"/>
    <path d="M65,50 Q85,85 72,128 Q88,170 70,205"/>
    <path d="M105,25 Q125,75 110,128 Q125,180 110,230"/>
    <path d="M150,25 Q135,75 148,128 Q135,180 152,230"/>
    <path d="M190,50 Q172,85 185,128 Q168,170 188,205"/>
    <path d="M225,85 Q212,105 220,128 Q210,150 224,175"/>
  </g>
  <!-- Highlight Reflection -->
  <ellipse cx="75" cy="65" rx="28" ry="14" fill="#ffffff" opacity="0.65" transform="rotate(-30 75 65)"/>
  <circle cx="102" cy="50" r="5" fill="#ffffff" opacity="0.7"/>
  <!-- Cheeks -->
  <circle cx="70" cy="155" r="18" fill="#86efac" opacity="0.6"/>
  <circle cx="186" cy="155" r="18" fill="#86efac" opacity="0.6"/>
  <!-- Furrowed Grumpy Eyebrows -->
  <path d="M80,110 L115,124" stroke="#052e16" stroke-width="7" stroke-linecap="round"/>
  <path d="M176,110 L141,124" stroke="#052e16" stroke-width="7" stroke-linecap="round"/>
  <!-- Squinting Sideways Eyes (Matching reference) -->
  <circle cx="102" cy="132" r="12" fill="#052e16"/>
  <circle cx="97" cy="130" r="4" fill="#ffffff"/>
  <circle cx="154" cy="132" r="12" fill="#052e16"/>
  <circle cx="149" cy="130" r="4" fill="#ffffff"/>
  <!-- Deep Grumpy Frown -->
  <path d="M110,166 Q128,144 146,166" fill="none" stroke="#052e16" stroke-width="7" stroke-linecap="round"/>
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
  console.log('Saved:', file.name);
}

console.log('All 11 fruit SVGs generated successfully!');
