import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('client/public/images');

// Ensure directories exist
fs.mkdirSync(path.join(PUBLIC_DIR, 'avatars'), { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, 'covers'), { recursive: true });
fs.mkdirSync(path.join(PUBLIC_DIR, 'academies'), { recursive: true });

// 1. Helper to write SVG
function writeSvg(filePath, content) {
  fs.writeFileSync(filePath, content.trim());
}

// 2. Generate Athlete Avatars (Stylized circular badge with rank belt, initials, and red cyber glow)
const athletes = [
  { id: 'lucas-vianna', initials: 'LV', rank: 'Black Belt', color: '#1a1a2e' },
  { id: 'derek-vance', initials: 'DV', rank: 'Brown Belt', color: '#3e2723' },
  { id: 'rodrigo-santos', initials: 'RS', rank: 'Purple Belt', color: '#4a148c' },
  { id: 'garrison-thorne', initials: 'GT', rank: 'Black Belt', color: '#1a1a2e' },
  { id: 'mateo-brandao', initials: 'MB', rank: 'Purple Belt', color: '#4a148c' },
  { id: 'callum-pierce', initials: 'CP', rank: 'Brown Belt', color: '#3e2723' },
  { id: 'alastair-sinclair', initials: 'AS', rank: 'Blue Belt', color: '#0d47a1' },
  { id: 'carlos-gomez', initials: 'CG', rank: 'Blue Belt', color: '#0d47a1' },
  { id: 'yuki-tanaka', initials: 'YT', rank: 'Purple Belt', color: '#4a148c' },
  { id: 'liam-oconnor', initials: 'LO', rank: 'Brown Belt', color: '#3e2723' },
  { id: 'aisha-mbaye', initials: 'AM', rank: 'Blue Belt', color: '#0d47a1' },
  { id: 'chloe-dubois', initials: 'CD', rank: 'Purple Belt', color: '#4a148c' },
  { id: 'tarik-al-mansour', initials: 'TM', rank: 'Black Belt', color: '#1a1a2e' },
  { id: 'viktor-drago', initials: 'VD', rank: 'Brown Belt', color: '#3e2723' },
  { id: 'aleksei-romanov', initials: 'AR', rank: 'Purple Belt', color: '#4a148c' },
  { id: 'demo-user', initials: 'DU', rank: 'Purple Belt', color: '#4a148c' }
];

athletes.forEach(ath => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="cyberGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#dc2626" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d2d30"/>
      <stop offset="50%" stop-color="#1e1e1f"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>
  <!-- Background Shield -->
  <rect width="100" height="100" fill="url(#metal)" rx="6" />
  <circle cx="50" cy="50" r="45" fill="url(#cyberGlow)" stroke="#dc2626" stroke-width="1.5" stroke-opacity="0.6" />
  
  <!-- Belt Strip Representative border at bottom -->
  <path d="M 15 75 Q 50 85 85 75" fill="none" stroke="${ath.color}" stroke-width="6" stroke-linecap="round" />
  <path d="M 40 78.5 L 60 78.5" fill="none" stroke="#000000" stroke-width="6" />
  
  <!-- Initials Text -->
  <text x="50" y="54" fill="#ffffff" font-family="monospace" font-size="28" font-weight="900" text-anchor="middle" letter-spacing="1">${ath.initials}</text>
  <text x="50" y="68" fill="#a0a0b0" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle" opacity="0.8">${ath.rank.toUpperCase()}</text>
</svg>
  `;
  writeSvg(path.join(PUBLIC_DIR, 'avatars', `${ath.id}.svg`), svg);
});

// 3. Generate Blog Cover Placeholders
const blogCovers = {
  'blog-weight-logging': {
    title: 'WEIGHT ANALYTICS',
    icon: `<path d="M 30 70 L 70 70 M 50 70 L 50 30 M 42 38 L 50 30 L 58 38" stroke="#dc2626" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />`
  },
  'blog-bracket-mechanics': {
    title: 'BRACKET LOGIC',
    icon: `
      <rect x="20" y="25" width="20" height="12" rx="2" fill="none" stroke="#dc2626" stroke-width="2" />
      <rect x="20" y="63" width="20" height="12" rx="2" fill="none" stroke="#dc2626" stroke-width="2" />
      <rect x="60" y="44" width="20" height="12" rx="2" fill="none" stroke="#ffffff" stroke-width="2" />
      <path d="M 40 31 L 50 31 L 50 50 L 60 50 M 40 69 L 50 69 L 50 50" stroke="#dc2626" stroke-width="2" fill="none" />
    `
  },
  'blog-recovery-methods': {
    title: 'RECOVERY MATRIX',
    icon: `<path d="M 30 50 Q 50 20 70 50 T 110 50" stroke="#dc2626" stroke-width="4" fill="none" stroke-linecap="round" />`
  },
  'blog-hydration-guide': {
    title: 'HYDRATION INDEX',
    icon: `<rect x="40" y="25" width="20" height="50" rx="4" fill="none" stroke="#dc2626" stroke-width="3" />`
  }
};

Object.entries(blogCovers).forEach(([id, meta]) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#151518"/>
      <stop offset="100%" stop-color="#070708"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" fill="url(#bgGrad)" />
  <!-- Grid Matrix Overlay -->
  <path d="M 0 50 L 400 50 M 0 100 L 400 100 M 0 150 L 400 150 M 0 200 L 400 200 M 80 0 L 80 250 M 160 0 L 160 250 M 240 0 L 240 250 M 320 0 L 320 250" stroke="#ffffff" stroke-width="1" stroke-opacity="0.03" />
  
  <!-- Red glowing core -->
  <circle cx="200" cy="125" r="70" fill="#dc2626" fill-opacity="0.05" filter="blur(20px)" />
  
  <!-- Icon Center Visual -->
  <g transform="translate(100, 38) scale(2)">
    ${meta.icon}
  </g>
  
  <!-- Skew Label Bar -->
  <polygon points="20 200, 220 200, 200 225, 20 225" fill="#dc2626" />
  <text x="35" y="217" fill="#ffffff" font-family="monospace" font-size="10" font-weight="900" letter-spacing="1">${meta.title}</text>
  <text x="380" y="222" fill="#a0a0b0" font-family="monospace" font-size="8" font-weight="bold" text-anchor="end">ATHLIX LABS</text>
</svg>
  `;
  writeSvg(path.join(PUBLIC_DIR, 'covers', `${id}.svg`), svg);
});

// 4. Generate Tournament Banner Placeholders
const tourneyBanners = {
  'tourney-vegas-open': 'LAS VEGAS OPEN',
  'tourney-bangkok-cup': 'BANGKOK STADIUM CUP',
  'tourney-wrestling-nationals': 'WRESTLING NATIONALS',
  'tourney-pan-am': 'PAN-AMERICAN OPEN',
  'tourney-combat-fights': 'MMA STRIKER SHOWDOWN'
};

Object.entries(tourneyBanners).forEach(([id, title]) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="600" height="300">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f1313"/>
      <stop offset="100%" stop-color="#0a0505"/>
    </linearGradient>
  </defs>
  <rect width="600" height="300" fill="url(#bgGrad)" />
  
  <!-- Diagonal laser design lines representing tension -->
  <path d="M -100 350 L 500 -100 M 0 350 L 600 -100 M 100 350 L 700 -100" stroke="#dc2626" stroke-width="2" stroke-opacity="0.15" />
  <path d="M 700 350 L 100 -100 M 600 350 L 0 -100" stroke="#dc2626" stroke-width="1" stroke-opacity="0.08" />

  <!-- Center trophy silhouette glow -->
  <circle cx="300" cy="130" r="80" fill="#dc2626" fill-opacity="0.1" filter="blur(25px)" />
  <path d="M 280 80 H 320 V 100 H 280 Z M 270 100 H 330 V 130 Q 330 160 300 160 Q 270 160 270 130 Z M 290 160 H 310 V 180 H 290 Z M 275 180 H 325 V 190 H 275 Z" fill="#ffffff" fill-opacity="0.15" />
  
  <!-- Tech Frame borders -->
  <rect x="15" y="15" width="570" height="270" fill="none" stroke="#dc2626" stroke-width="1" stroke-opacity="0.2" />
  <path d="M 15 40 L 15 15 L 40 15 M 585 40 L 585 15 L 560 15 M 15 260 L 15 285 L 40 285 M 585 260 L 585 285 L 560 285" stroke="#dc2626" stroke-width="3" fill="none" />

  <!-- Championship text -->
  <text x="300" y="240" fill="#ffffff" font-family="Impact, sans-serif" font-size="28" font-weight="900" text-anchor="middle" letter-spacing="3" opacity="0.95">${title}</text>
  <text x="300" y="260" fill="#dc2626" font-family="monospace" font-size="9" font-weight="black" text-anchor="middle" letter-spacing="4">ATHLIX TOURNAMENT PORTAL</text>
</svg>
  `;
  writeSvg(path.join(PUBLIC_DIR, 'covers', `${id}.svg`), svg);
});

// 5. Generate Academy Logos
const academyLogos = ['logo-apex', 'logo-alliance', 'logo-vanguard', 'logo-horizon'];
academyLogos.forEach(logoName => {
  const shortName = logoName.replace('logo-', '').toUpperCase();
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#dc2626" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#141416" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="120" height="120" fill="#141416" rx="4" stroke="#2a2a2c" stroke-width="1.5" />
  <circle cx="60" cy="60" r="48" fill="url(#glow)" stroke="#dc2626" stroke-width="1.5" stroke-opacity="0.4" />
  
  <!-- Geometric Badge Shapes -->
  <polygon points="60 25, 90 42.5, 90 77.5, 60 95, 30 77.5, 30 42.5" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3" />
  
  <!-- Initials Badge Center -->
  <text x="60" y="66" fill="#ffffff" font-family="Impact, sans-serif" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="1" fill-opacity="0.9">${shortName}</text>
  <text x="60" y="80" fill="#dc2626" font-family="monospace" font-size="6" font-weight="bold" text-anchor="middle" letter-spacing="1">ACADEMY</text>
</svg>
  `;
  writeSvg(path.join(PUBLIC_DIR, 'academies', `${logoName}.svg`), svg);
});

console.log('All SVG image assets successfully generated in client/public/images/');
