const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = 'chavatte';

const query = `
  query($userName:String!) {
    user(login: $userName){
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

async function fetchContributions() {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { userName: USERNAME } })
  });
  const data = await response.json();
  return data.data.user.contributionsCollection.contributionCalendar;
}

function getColor(count) {
  if (count === 0) return '#0d1117';
  if (count <= 2) return '#003300';
  if (count <= 5) return '#006600';
  if (count <= 8) return '#009900';
  if (count <= 12) return '#00CC00';
  return '#00FF00';
}

async function generateSVG() {
  const calendar = await fetchContributions();
  const weeks = calendar.weeks;
  
  let rects = '';
  weeks.forEach((week, wIndex) => {
    week.contributionDays.forEach((day, dIndex) => {
      const x = wIndex * 14;
      const y = dIndex * 14;
      const fill = getColor(day.contributionCount);
      rects += `<rect x="${x}" y="${y}" width="10" height="10" fill="${fill}" rx="2" />\n`;
    });
  });

  const svg = `
<svg width="820" height="250" xmlns="http://www.w3.org/2000/svg">
  <style>
    .text { font-family: 'Courier New', monospace; fill: #00FF00; font-size: 12px; }
    .title { font-size: 14px; font-weight: bold; }
    .border { stroke: #00FF00; stroke-width: 1; fill: none; }
  </style>
  <rect width="820" height="250" fill="#0d1117" />
  <rect x="5" y="5" width="810" height="240" class="border" rx="4" />
  <line x1="5" y1="35" x2="815" y2="35" stroke="#00FF00" stroke-width="1" />
  <line x1="5" y1="195" x2="815" y2="195" stroke="#00FF00" stroke-width="1" />
  <text x="15" y="23" class="text title">GHOST_NODE // ACTIVITY TELEMETRY</text>
  <text x="650" y="23" class="text">STATUS: SECURE_LINK</text>
  <g transform="translate(20, 60)">
    ${rects}
  </g>
  <text x="15" y="215" class="text">TOTAL SIGNALS : ${calendar.totalContributions}</text>
  <text x="15" y="230" class="text">MODE          : CONTINUOUS ENGINEERING</text>
  <text x="600" y="215" class="text">INTENSITY MAP:</text>
  <rect x="600" y="222" width="10" height="10" fill="#0d1117" stroke="#003300" rx="2" />
  <rect x="615" y="222" width="10" height="10" fill="#003300" rx="2" />
  <rect x="630" y="222" width="10" height="10" fill="#006600" rx="2" />
  <rect x="645" y="222" width="10" height="10" fill="#009900" rx="2" />
  <rect x="660" y="222" width="10" height="10" fill="#00CC00" rx="2" />
  <rect x="675" y="222" width="10" height="10" fill="#00FF00" rx="2" />
</svg>`;

  const dir = path.join(__dirname, '../dist');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'activity-matrix.svg'), svg.trim());
  console.log('Activity Matrix generated successfully.');
}

generateSVG().catch(console.error);
