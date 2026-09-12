const fs = require("fs");
const path = require("path");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = "chavatte";

const query = `
  query($userName:String!) {
    user(login: $userName) {
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
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not defined.");
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        userName: USERNAME,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  if (!data.data?.user?.contributionsCollection?.contributionCalendar) {
    throw new Error("Contribution calendar not available.");
  }

  return data.data.user.contributionsCollection.contributionCalendar;
}

function getColor(count) {
  if (count === 0) return "#0d1117";
  if (count <= 2) return "#003300";
  if (count <= 5) return "#006600";
  if (count <= 8) return "#009900";
  if (count <= 12) return "#00CC00";
  return "#00FF00";
}

function calculateMetrics(calendar) {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);

  const totalContributions = calendar.totalContributions;

  const activeDays = days.filter((day) => day.contributionCount > 0).length;

  const peakSignal = Math.max(0, ...days.map((day) => day.contributionCount));

  const sortedDays = [...days].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  let longestStreak = 0;
  let streak = 0;

  for (const day of sortedDays) {
    if (day.contributionCount > 0) {
      streak += 1;

      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  let currentStreak = 0;

  for (let i = sortedDays.length - 1; i >= 0; i--) {
    if (sortedDays[i].contributionCount > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    totalContributions,
    activeDays,
    peakSignal,
    currentStreak,
    longestStreak,
  };
}

function generateRects(weeks) {
  let rects = "";

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, dayIndex) => {
      const x = weekIndex * 14;
      const y = dayIndex * 14;
      const fill = getColor(day.contributionCount);

      rects += `
        <rect
          x="${x}"
          y="${y}"
          width="10"
          height="10"
          fill="${fill}"
          rx="2"
        >
          <title>
            ${day.date}: ${day.contributionCount} contributions
          </title>
        </rect>
      `;
    });
  });

  return rects;
}

function generateSVG(calendar, metrics) {
  const rects = generateRects(calendar.weeks);

  return `
<svg
  width="820"
  height="265"
  viewBox="0 0 820 265"
  xmlns="http://www.w3.org/2000/svg"
>
  <style>
    .text {
      font-family: 'Courier New', monospace;
      fill: #00FF00;
      font-size: 12px;
    }

    .title {
      font-size: 14px;
      font-weight: bold;
    }

    .metric {
      font-size: 11px;
    }

    .border {
      stroke: #00FF00;
      stroke-width: 1;
      fill: none;
    }
  </style>

  <rect
    width="820"
    height="265"
    fill="#0d1117"
  />
  <!-- Outer border -->
  <rect
    x="5"
    y="5"
    width="810"
    height="255"
    class="border"
    rx="4"
  />
  <line
    x1="5"
    y1="35"
    x2="815"
    y2="35"
    stroke="#00FF00"
    stroke-width="1"
  />
  <line
    x1="5"
    y1="195"
    x2="815"
    y2="195"
    stroke="#00FF00"
    stroke-width="1"
  />
  <text
    x="15"
    y="23"
    class="text title"
  >
    GHOST_NODE // ACTIVITY MATRIX
  </text>
  <text
    x="650"
    y="23"
    class="text"
  >
    STATUS: SECURE_LINK
  </text>
  <text
    x="20"
    y="52"
    class="text metric"
  >
    [ GITHUB CONTRIBUTION MATRIX ]
  </text>
  <!-- Contribution Matrix -->
  <g transform="translate(20, 68)">
    ${rects}
  </g>
  <text
    x="15"
    y="215"
    class="text metric"
  >
    TOTAL SIGNALS : ${metrics.totalContributions}
  </text>
  <text
    x="205"
    y="215"
    class="text metric"
  >
    ACTIVE DAYS : ${metrics.activeDays}
  </text>
  <text
    x="375"
    y="215"
    class="text metric"
  >
    PEAK SIGNAL : ${metrics.peakSignal}
  </text>
  <text
    x="15"
    y="232"
    class="text metric"
  >
    CURRENT STREAK : ${metrics.currentStreak}
  </text>
  <text
    x="220"
    y="232"
    class="text metric"
  >
    LONGEST STREAK : ${metrics.longestStreak}
  </text>
  <text
    x="15"
    y="249"
    class="text metric"
  >
    NODE : CHAVATTE
  </text>
  <text
    x="190"
    y="249"
    class="text metric"
  >
    MODE : CONTINUOUS CONTRIBUTION
  </text>
  <text
    x="620"
    y="232"
    class="text metric"
  >
    INTENSITY:
  </text>
  <rect
    x="620"
    y="239"
    width="10"
    height="10"
    fill="#0d1117"
    stroke="#003300"
    rx="2"
  />
  <rect
    x="635"
    y="239"
    width="10"
    height="10"
    fill="#003300"
    rx="2"
  />
  <rect
    x="650"
    y="239"
    width="10"
    height="10"
    fill="#006600"
    rx="2"
  />
  <rect
    x="665"
    y="239"
    width="10"
    height="10"
    fill="#009900"
    rx="2"
  />
  <rect
    x="680"
    y="239"
    width="10"
    height="10"
    fill="#00CC00"
    rx="2"
  />
  <rect
    x="695"
    y="239"
    width="10"
    height="10"
    fill="#00FF00"
    rx="2"
  />
</svg>
  `.trim();
}

async function generateSVGFile() {
  const calendar = await fetchContributions();
  const metrics = calculateMetrics(calendar);
  const svg = generateSVG(calendar, metrics);

  const dir = path.join(__dirname, "../dist");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const outputPath = path.join(dir, "activity-matrix.svg");

  fs.writeFileSync(outputPath, svg, "utf8");

  console.log("GHOST_NODE Activity Matrix generated successfully.");

  console.log("Metrics:");
  console.log(`  TOTAL SIGNALS : ${metrics.totalContributions}`);
  console.log(`  ACTIVE DAYS   : ${metrics.activeDays}`);
  console.log(`  PEAK SIGNAL   : ${metrics.peakSignal}`);
  console.log(`  CURRENT STREAK: ${metrics.currentStreak}`);
  console.log(`  LONGEST STREAK: ${metrics.longestStreak}`);
}

generateSVGFile().catch((error) => {
  console.error("Activity Matrix generation failed:");
  console.error(error);
  process.exit(1);
});
