const fs = require('fs');
const path = require('path');

const USERNAME = 'HaikalArrasyid';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function fetchContributions() {
  const url = `https://github-contributions-api.jogruber.de/v4/${USERNAME}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch contributions: ${res.statusText}`);
  }
  return res.json();
}

function generateSvg({ thisMonthName, thisMonthYear, thisMonthCount, lastMonthName, lastMonthYear, lastMonthCount }) {
  const growth = lastMonthCount > 0 
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
    : 100;
  
  const growthSign = growth >= 0 ? '+' : '';
  const growthBadge = `${growthSign}${growth}% vs last month`;
  const growthColor = growth >= 0 ? '#73daca' : '#f7768e';

  return `<svg
  width="340"
  height="165"
  viewBox="0 0 340 165"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Monthly Commit Recap"
>
  <style>
    .header { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #70a5fd; }
    .label { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #a9b1d6; }
    .val { font: 700 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: #73daca; }
    .val-prev { font: 700 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: #7aa2f7; }
    .sub { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: #787c99; }
    .badge { font: 600 10px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${growthColor}; }
    .card-box { fill: #1f2335; rx: 6px; }
  </style>

  <!-- Background -->
  <rect
    x="0.5"
    y="0.5"
    width="339"
    height="164"
    rx="6"
    fill="#1a1b27"
    stroke="#2f3549"
    stroke-width="1"
  />

  <!-- Title & Icon -->
  <g transform="translate(20, 28)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#70a5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    <text x="26" y="14" class="header">Monthly Activity Recap</text>
  </g>

  <!-- Box 1: This Month -->
  <g transform="translate(20, 48)">
    <rect width="145" height="92" class="card-box" />
    <text x="14" y="22" class="label">This Month</text>
    <text x="14" y="36" class="sub">${thisMonthName} ${thisMonthYear}</text>
    <text x="14" y="68" class="val">${thisMonthCount}</text>
    <text x="56" y="68" class="sub">commits</text>
    <text x="14" y="83" class="badge">${growthBadge}</text>
  </g>

  <!-- Box 2: Last Month -->
  <g transform="translate(175, 48)">
    <rect width="145" height="92" class="card-box" />
    <text x="14" y="22" class="label">Last Month</text>
    <text x="14" y="36" class="sub">${lastMonthName} ${lastMonthYear}</text>
    <text x="14" y="68" class="val-prev">${lastMonthCount}</text>
    <text x="56" y="68" class="sub">commits</text>
    <text x="14" y="83" class="sub">Completed ✓</text>
  </g>
</svg>`;
}

async function main() {
  const data = await fetchContributions();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed

  const lastMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthIdx = lastMonthDate.getMonth();

  const prefixThisMonth = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const prefixLastMonth = `${lastMonthYear}-${String(lastMonthIdx + 1).padStart(2, '0')}`;

  let thisMonthCount = 0;
  let lastMonthCount = 0;

  for (const item of data.contributions) {
    if (item.date.startsWith(prefixThisMonth)) thisMonthCount += item.count;
    if (item.date.startsWith(prefixLastMonth)) lastMonthCount += item.count;
  }

  const svg = generateSvg({
    thisMonthName: MONTH_NAMES[currentMonthIdx],
    thisMonthYear: currentYear,
    thisMonthCount,
    lastMonthName: MONTH_NAMES[lastMonthIdx],
    lastMonthYear,
    lastMonthCount
  });

  const assetsDir = path.join(__dirname, '../../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const outputPath = path.join(assetsDir, 'monthly-recap.svg');
  fs.writeFileSync(outputPath, svg, 'utf-8');
  console.log(`Generated: ${outputPath} (This Month: ${thisMonthCount}, Last Month: ${lastMonthCount})`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
