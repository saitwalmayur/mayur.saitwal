const fs = require('fs');
const path = require('path');

const outDir = 'c:/Users/C097731/Desktop/mayur.saitwal/public/assets/fruitmerge';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Blackberry / Purple Berry (Tier 0)
const berrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="berryGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="60%" stop-color="#6b21a8"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </radialGradient>
  </defs>
  <!-- Berry Body -->
  <circle cx="128" cy="128" r="122" fill="url(#berryGrad)" stroke="#2e1065" stroke-width="6"/>
  <!-- Berry Texture Bubbles -->
  <circle cx="65" cy="85" r="26" fill="#7e22ce" opacity="0.6"/>
  <circle cx="190" cy="85" r="26" fill="#7e22ce" opacity="0.6"/>
  <circle cx="50" cy="145" r="24" fill="#7e22ce" opacity="0.6"/>
  <circle cx="206" cy="145" r="24" fill="#7e22ce" opacity="0.6"/>
  <circle cx="85" cy="205" r="24" fill="#7e22ce" opacity="0.6"/>
  <circle cx="170" cy="205" r="24" fill="#7e22ce" opacity="0.6"/>
  <!-- Highlights -->
  <ellipse cx="78" cy="72" rx="28" ry="14" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#f472b6" opacity="0.75"/>
  <circle cx="188" cy="154" r="18" fill="#f472b6" opacity="0.75"/>
  <!-- Kawaii Anime Eyes -->
  <circle cx="92" cy="125" r="14" fill="#0f0728"/>
  <circle cx="87" cy="120" r="5.5" fill="#ffffff"/>
  <circle cx="97" cy="130" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="14" fill="#0f0728"/>
  <circle cx="159" cy="120" r="5.5" fill="#ffffff"/>
  <circle cx="169" cy="130" r="2.5" fill="#ffffff"/>
  <!-- Happy Smile Mouth -->
  <path d="M112,148 Q128,168 144,148" fill="#f43f5e" stroke="#0f0728" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 2. Red Cherry / Tomato (Tier 1)
const tomatoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="tomGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff6b8b"/>
      <stop offset="55%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#tomGrad)" stroke="#4c0519" stroke-width="6"/>
  <!-- Stem & Leaves -->
  <path d="M128,14 C128,4 135,2 142,2" stroke="#15803d" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="106" cy="18" rx="18" ry="7" fill="#22c55e" stroke="#15803d" stroke-width="2" transform="rotate(-25 106 18)"/>
  <ellipse cx="150" cy="18" rx="18" ry="7" fill="#22c55e" stroke="#15803d" stroke-width="2" transform="rotate(25 150 18)"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <circle cx="106" cy="56" r="6" fill="#ffffff" opacity="0.8"/>
  <!-- Cheeks -->
  <circle cx="70" cy="154" r="18" fill="#fb7185" opacity="0.7"/>
  <circle cx="186" cy="154" r="18" fill="#fb7185" opacity="0.7"/>
  <!-- Kawaii Eyes -->
  <circle cx="92" cy="126" r="13" fill="#1c1917"/>
  <circle cx="88" cy="122" r="5" fill="#ffffff"/>
  <circle cx="97" cy="130" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="126" r="13" fill="#1c1917"/>
  <circle cx="160" cy="122" r="5" fill="#ffffff"/>
  <circle cx="169" cy="130" r="2.5" fill="#ffffff"/>
  <!-- Smile -->
  <path d="M114,152 Q128,168 142,152" fill="none" stroke="#1c1917" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 3. Small Orange / Apricot (Tier 2)
const apricotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="apriGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fdba74"/>
      <stop offset="55%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#apriGrad)" stroke="#7c2d12" stroke-width="6"/>
  <!-- Top Leaf -->
  <ellipse cx="144" cy="14" rx="16" ry="8" fill="#4ade80" stroke="#15803d" stroke-width="2" transform="rotate(-20 144 14)"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="30" ry="15" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="152" r="18" fill="#ea580c" opacity="0.65"/>
  <circle cx="186" cy="152" r="18" fill="#ea580c" opacity="0.65"/>
  <!-- Eyes -->
  <circle cx="92" cy="125" r="13" fill="#431407"/>
  <circle cx="87" cy="120" r="5" fill="#ffffff"/>
  <circle cx="97" cy="129" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="13" fill="#431407"/>
  <circle cx="159" cy="120" r="5" fill="#ffffff"/>
  <circle cx="169" cy="129" r="2.5" fill="#ffffff"/>
  <!-- Smile -->
  <path d="M112,150 Q128,168 144,150" fill="#f43f5e" stroke="#431407" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 4. Watermelon Slice (Tier 3 - Matching Reference Image!)
const watermelonSliceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <!-- Outer Dark Green Rind -->
  <circle cx="128" cy="128" r="122" fill="#15803d" stroke="#052e16" stroke-width="6"/>
  <!-- Light Green Rind Layer -->
  <circle cx="128" cy="128" r="114" fill="#4ade80"/>
  <!-- White Inner Rim -->
  <circle cx="128" cy="128" r="105" fill="#f0fdf4"/>
  <!-- Bright Juicy Red Flesh -->
  <circle cx="128" cy="128" r="96" fill="#ef4444"/>
  <!-- Black Seeds Around Perimeter -->
  <g fill="#18181b">
    <ellipse cx="72" cy="80" rx="4" ry="7" transform="rotate(-35 72 80)"/>
    <ellipse cx="184" cy="80" rx="4" ry="7" transform="rotate(35 184 80)"/>
    <ellipse cx="50" cy="135" rx="4" ry="7" transform="rotate(-75 50 135)"/>
    <ellipse cx="206" cy="135" rx="4" ry="7" transform="rotate(75 206 135)"/>
    <ellipse cx="72" cy="185" rx="4" ry="7" transform="rotate(-130 72 185)"/>
    <ellipse cx="184" cy="185" rx="4" ry="7" transform="rotate(130 184 185)"/>
    <ellipse cx="128" cy="208" rx="4" ry="7"/>
    <ellipse cx="128" cy="48" rx="4" ry="7"/>
  </g>
  <!-- Highlight -->
  <ellipse cx="80" cy="75" rx="24" ry="12" fill="#ffffff" opacity="0.6" transform="rotate(-30 80 75)"/>
  <!-- Cheeks -->
  <circle cx="78" cy="154" r="16" fill="#fca5a5" opacity="0.8"/>
  <circle cx="178" cy="154" r="16" fill="#fca5a5" opacity="0.8"/>
  <!-- Kawaii Anime Eyes -->
  <circle cx="94" cy="126" r="13" fill="#18181b"/>
  <circle cx="89" cy="121" r="5" fill="#ffffff"/>
  <circle cx="99" cy="130" r="2.5" fill="#ffffff"/>
  <circle cx="162" cy="126" r="13" fill="#18181b"/>
  <circle cx="157" cy="121" r="5" fill="#ffffff"/>
  <circle cx="167" cy="130" r="2.5" fill="#ffffff"/>
  <!-- Open Happy Kawaii Smile -->
  <path d="M110,146 Q128,172 146,146 Z" fill="#991b1b" stroke="#18181b" stroke-width="5"/>
  <path d="M118,154 Q128,168 138,154" fill="#f87171"/>
</svg>`;

// 5. Lime / Kiwi (Tier 4)
const limeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="limeGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="55%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#4d7c0f"/>
    </radialGradient>
  </defs>
  <circle cx="128" cy="128" r="122" fill="url(#limeGrad)" stroke="#365314" stroke-width="6"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="30" ry="15" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="152" r="18" fill="#a3e635" opacity="0.75"/>
  <circle cx="186" cy="152" r="18" fill="#a3e635" opacity="0.75"/>
  <!-- Eyes -->
  <circle cx="92" cy="125" r="13" fill="#1a2e05"/>
  <circle cx="87" cy="120" r="5" fill="#ffffff"/>
  <circle cx="97" cy="130" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="13" fill="#1a2e05"/>
  <circle cx="159" cy="120" r="5" fill="#ffffff"/>
  <circle cx="169" cy="130" r="2.5" fill="#ffffff"/>
  <!-- Happy Smile -->
  <path d="M112,148 Q128,168 144,148" fill="#f43f5e" stroke="#1a2e05" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 6. Strawberry (Tier 5 - Matching Reference)
const strawberrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="strawGrad2" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff4d6d"/>
      <stop offset="55%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#strawGrad2)" stroke="#4c0519" stroke-width="6"/>
  <!-- Seeds -->
  <g fill="#fef08a" opacity="0.85">
    <ellipse cx="65" cy="80" rx="4" ry="7" transform="rotate(-15 65 80)"/>
    <ellipse cx="191" cy="80" rx="4" ry="7" transform="rotate(15 191 80)"/>
    <ellipse cx="48" cy="135" rx="4" ry="7" transform="rotate(-25 48 135)"/>
    <ellipse cx="208" cy="135" rx="4" ry="7" transform="rotate(25 208 135)"/>
    <ellipse cx="75" cy="195" rx="4" ry="7" transform="rotate(-10 75 195)"/>
    <ellipse cx="181" cy="195" rx="4" ry="7" transform="rotate(10 181 195)"/>
    <ellipse cx="128" cy="218" rx="4" ry="7"/>
    <ellipse cx="128" cy="75" rx="4" ry="7"/>
  </g>
  <!-- Crown Leaves on Top -->
  <path d="M128,26 L108,6 C102,18 84,18 72,22 C92,32 104,40 116,38 L128,26 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
  <path d="M128,26 L148,6 C154,18 172,18 184,22 C164,32 152,40 140,38 L128,26 Z" fill="#16a34a" stroke="#15803d" stroke-width="2"/>
  <ellipse cx="128" cy="24" rx="26" ry="8" fill="#15803d"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="30" ry="15" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="70" cy="154" r="18" fill="#fb7185" opacity="0.7"/>
  <circle cx="186" cy="154" r="18" fill="#fb7185" opacity="0.7"/>
  <!-- Kawaii Anime Eyes -->
  <circle cx="92" cy="126" r="13" fill="#1c1917"/>
  <circle cx="87" cy="121" r="5" fill="#ffffff"/>
  <circle cx="97" cy="130" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="126" r="13" fill="#1c1917"/>
  <circle cx="159" cy="121" r="5" fill="#ffffff"/>
  <circle cx="169" cy="130" r="2.5" fill="#ffffff"/>
  <!-- Open Happy Mouth -->
  <path d="M112,148 Q128,170 144,148" fill="#f43f5e" stroke="#1c1917" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 7. Pink Peach (Tier 6 - Matching Reference)
const peachSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="peachGrad2" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="55%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#db2777"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#peachGrad2)" stroke="#831843" stroke-width="6"/>
  <!-- Peach Crease Cleft -->
  <path d="M128,8 C126,45 125,85 125,115" fill="none" stroke="#be185d" stroke-width="5" opacity="0.5" stroke-linecap="round"/>
  <!-- Leaf -->
  <ellipse cx="140" cy="14" rx="18" ry="8" fill="#4ade80" stroke="#15803d" stroke-width="2" transform="rotate(-30 140 14)"/>
  <!-- Highlight -->
  <ellipse cx="72" cy="74" rx="28" ry="14" fill="#ffffff" opacity="0.8" transform="rotate(-30 72 74)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="20" fill="#f472b6" opacity="0.75"/>
  <circle cx="188" cy="154" r="20" fill="#f472b6" opacity="0.75"/>
  <!-- Anime Eyes -->
  <circle cx="92" cy="125" r="13" fill="#500724"/>
  <circle cx="87" cy="120" r="5" fill="#ffffff"/>
  <circle cx="97" cy="129" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="13" fill="#500724"/>
  <circle cx="159" cy="120" r="5" fill="#ffffff"/>
  <circle cx="169" cy="129" r="2.5" fill="#ffffff"/>
  <!-- Smile -->
  <path d="M114,152 Q128,168 142,152" fill="none" stroke="#500724" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 8. Green Apple (Tier 7 - Matching Reference Mascot & Dropper!)
const greenAppleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="gAppleGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="55%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#3f6212"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#gAppleGrad)" stroke="#1a2e05" stroke-width="6"/>
  <!-- Leaf on Top -->
  <path d="M128,18 C128,8 136,4 144,4" stroke="#15803d" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="154" cy="12" rx="20" ry="10" fill="#4ade80" stroke="#15803d" stroke-width="2.5" transform="rotate(-20 154 12)"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="32" ry="16" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <circle cx="106" cy="56" r="6" fill="#ffffff" opacity="0.8"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#a3e635" opacity="0.75"/>
  <circle cx="188" cy="154" r="18" fill="#a3e635" opacity="0.75"/>
  <!-- Kawaii Sparkling Eyes -->
  <circle cx="92" cy="124" r="14" fill="#0f172a"/>
  <circle cx="86" cy="118" r="6" fill="#ffffff"/>
  <circle cx="98" cy="129" r="3" fill="#ffffff"/>
  <circle cx="164" cy="124" r="14" fill="#0f172a"/>
  <circle cx="158" cy="118" r="6" fill="#ffffff"/>
  <circle cx="170" cy="129" r="3" fill="#ffffff"/>
  <!-- Big Happy Open Mouth (^o^) -->
  <path d="M110,146 Q128,174 146,146 Z" fill="#e11d48" stroke="#0f172a" stroke-width="5"/>
  <path d="M118,154 Q128,168 138,154" fill="#fda4af"/>
</svg>`;

// 9. Red Apple (Tier 8 - Matching Reference with Center Mascot Circle)
const redAppleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="rAppleGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff4d6d"/>
      <stop offset="55%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </radialGradient>
  </defs>
  <!-- Body -->
  <circle cx="128" cy="128" r="122" fill="url(#rAppleGrad)" stroke="#450a0a" stroke-width="6"/>
  <!-- Leaf -->
  <ellipse cx="152" cy="12" rx="18" ry="8" fill="#22c55e" stroke="#15803d" stroke-width="2.5" transform="rotate(-25 152 12)"/>
  <!-- Center Golden Yellow Face Disc (Identical to Red Apple in screenshot) -->
  <circle cx="128" cy="132" r="64" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
  <!-- Highlights -->
  <ellipse cx="68" cy="75" rx="26" ry="14" fill="#ffffff" opacity="0.8" transform="rotate(-25 68 75)"/>
  <!-- Eyes -->
  <circle cx="106" cy="126" r="9" fill="#1c1917"/>
  <circle cx="103" cy="123" r="3" fill="#ffffff"/>
  <circle cx="150" cy="126" r="9" fill="#1c1917"/>
  <circle cx="147" cy="123" r="3" fill="#ffffff"/>
  <!-- Cute Happy Smile -->
  <path d="M114,146 Q128,162 142,146" fill="none" stroke="#1c1917" stroke-width="5" stroke-linecap="round"/>
</svg>`;

// 10. Big Orange / Tangerine (Tier 9)
const bigOrangeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="bOrangeGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="55%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </radialGradient>
  </defs>
  <circle cx="128" cy="128" r="122" fill="url(#bOrangeGrad)" stroke="#431407" stroke-width="6"/>
  <!-- Leaf -->
  <ellipse cx="152" cy="10" rx="18" ry="9" fill="#22c55e" stroke="#15803d" stroke-width="2.5" transform="rotate(-15 152 10)"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="30" ry="15" fill="#ffffff" opacity="0.75" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#c2410c" opacity="0.6"/>
  <circle cx="188" cy="154" r="18" fill="#c2410c" opacity="0.6"/>
  <!-- Anime Eyes -->
  <circle cx="92" cy="125" r="13" fill="#270901"/>
  <circle cx="87" cy="120" r="5" fill="#ffffff"/>
  <circle cx="97" cy="129" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="13" fill="#270901"/>
  <circle cx="159" cy="120" r="5" fill="#ffffff"/>
  <circle cx="169" cy="129" r="2.5" fill="#ffffff"/>
  <!-- Smile -->
  <path d="M112,148 Q128,168 144,148" fill="#f43f5e" stroke="#270901" stroke-width="5.5" stroke-linecap="round"/>
</svg>`;

// 11. Pumpkin / Ribbed Melon (Tier 10 - Matching Reference Screenshot)
const pumpkinSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="pumpGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="55%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </radialGradient>
  </defs>
  <!-- Pumpkin Outer Body -->
  <circle cx="128" cy="128" r="122" fill="url(#pumpGrad)" stroke="#431407" stroke-width="6"/>
  <!-- Pumpkin Vertical Rib Creases (Identical to screenshot) -->
  <g fill="none" stroke="#7c2d12" stroke-width="7" stroke-linecap="round">
    <path d="M50,75 Q85,128 55,185"/>
    <path d="M88,38 Q115,128 92,220"/>
    <path d="M128,16 Q138,128 128,240"/>
    <path d="M168,38 Q141,128 164,220"/>
    <path d="M206,75 Q171,128 201,185"/>
  </g>
  <!-- Brown Stem on Top -->
  <path d="M128,22 C126,8 132,4 138,4" stroke="#78350f" stroke-width="9" stroke-linecap="round"/>
  <!-- Highlight -->
  <ellipse cx="78" cy="72" rx="30" ry="14" fill="#ffffff" opacity="0.65" transform="rotate(-30 78 72)"/>
  <!-- Cheeks -->
  <circle cx="68" cy="154" r="18" fill="#c2410c" opacity="0.65"/>
  <circle cx="188" cy="154" r="18" fill="#c2410c" opacity="0.65"/>
  <!-- Eyes -->
  <circle cx="92" cy="125" r="13" fill="#270901"/>
  <circle cx="87" cy="120" r="5" fill="#ffffff"/>
  <circle cx="97" cy="129" r="2.5" fill="#ffffff"/>
  <circle cx="164" cy="125" r="13" fill="#270901"/>
  <circle cx="159" cy="120" r="5" fill="#ffffff"/>
  <circle cx="169" cy="129" r="2.5" fill="#ffffff"/>
  <!-- Cat-mouth '3' / Cute Smile -->
  <path d="M110,146 Q119,158 128,148 Q137,158 146,146" fill="none" stroke="#270901" stroke-width="6" stroke-linecap="round"/>
</svg>`;

// 12. Giant Purple Plum / Passion Fruit (Tier 11 - Giant Fruit from Screenshot!)
const giantPlumSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="gPlumGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="50%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </radialGradient>
  </defs>
  <!-- Huge Outer Sphere Body (r=122) -->
  <circle cx="128" cy="128" r="122" fill="url(#gPlumGrad)" stroke="#1e0538" stroke-width="7"/>
  <!-- Stem & Leaf -->
  <path d="M128,18 C128,6 136,2 144,2" stroke="#15803d" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="156" cy="10" rx="22" ry="11" fill="#4ade80" stroke="#15803d" stroke-width="2.5" transform="rotate(-20 156 10)"/>
  <!-- Large Glossy Specular Reflection (Identical to screenshot) -->
  <ellipse cx="68" cy="65" rx="36" ry="18" fill="#ffffff" opacity="0.85" transform="rotate(-30 68 65)"/>
  <circle cx="106" cy="46" r="7" fill="#ffffff" opacity="0.95"/>
  <circle cx="48" cy="108" r="7" fill="#ffffff" opacity="0.6"/>
  <!-- Glowing Rosy Pink Blush Cheeks -->
  <circle cx="65" cy="155" r="22" fill="#f472b6" opacity="0.85"/>
  <circle cx="191" cy="155" r="22" fill="#f472b6" opacity="0.85"/>
  <!-- Huge Anime Sparkling Eyes (Exact match to screenshot!) -->
  <circle cx="94" cy="124" r="18" fill="#0f0728"/>
  <circle cx="86" cy="116" r="7.5" fill="#ffffff"/>
  <circle cx="102" cy="132" r="3.5" fill="#ffffff"/>
  <circle cx="162" cy="124" r="18" fill="#0f0728"/>
  <circle cx="154" cy="116" r="7.5" fill="#ffffff"/>
  <circle cx="170" cy="132" r="3.5" fill="#ffffff"/>
  <!-- Big Happy Open Mouth (^o^) with Pink Tongue -->
  <path d="M108,144 Q128,178 148,144 Z" fill="#e11d48" stroke="#0f0728" stroke-width="6"/>
  <path d="M116,152 Q128,170 140,152" fill="#fda4af"/>
</svg>`;

const files = [
  { name: 'fruit_1_cherry.svg', content: berrySvg },
  { name: 'fruit_2_strawberry.svg', content: tomatoSvg },
  { name: 'fruit_3_grape.svg', content: apricotSvg },
  { name: 'fruit_4_lemon.svg', content: watermelonSliceSvg },
  { name: 'fruit_5_orange.svg', content: limeSvg },
  { name: 'fruit_6_apple.svg', content: strawberrySvg },
  { name: 'fruit_7_peach.svg', content: peachSvg },
  { name: 'fruit_8_melon.svg', content: greenAppleSvg },
  { name: 'fruit_9_coconut.svg', content: redAppleSvg },
  { name: 'fruit_10_half_watermelon.svg', content: bigOrangeSvg },
  { name: 'fruit_11_giant_watermelon.svg', content: pumpkinSvg },
  { name: 'fruit_12_giant_plum.svg', content: giantPlumSvg },
];

for (const file of files) {
  const filePath = path.join(outDir, file.name);
  fs.writeFileSync(filePath, file.content, 'utf8');
}

console.log('All 12 Kawaii Fruit SVGs re-generated matching new reference screenshot!');
