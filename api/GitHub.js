require("dotenv").config();
require("gopd");

const colours = require("../Assets/colours.json");
const svgViewer = require("../utils/svgViewer");
const { getDeviconSVG, getStatsIcon } = svgViewer;

const headerValues = {
   headers: { Authorization: `Bearer ${process.env.GHTOKEN}` },
};

/**
 * Get top N values from an object, aggregating the rest into "Other"
 * @param {Object} values
 * @param {number} limit
 * @returns {Object}
 */
function getTopValues(values, limit) {
   const entries = Object.entries(values).sort(([, a], [, b]) => b - a);
   if (entries.length <= limit) return Object.fromEntries(entries);
   const topEntries = entries.slice(0, limit);
   const otherTotal = entries
      .slice(limit)
      .reduce((acc, [, val]) => acc + val, 0);
   return { ...Object.fromEntries(topEntries), Other: otherTotal };
}

/**
 *
 * @param {number} cx
 * @param {number} y
 * @param {number} r
 * @param {string} name
 * @param {Array} keys
 * @param {Object} values
 * @param {number} total
 * @param {Array} colors
 * @returns {Array} SVG elements as strings
 */
function generateGraph(cx, y, r, name, keys, values, total, colors) {
   const graph = [];
   let sumAngle = 0;

   if (values && keys.length > 0) {
      const cy = r * 4;
      const circumference = 2 * r * Math.PI;

      keys.forEach((key, i) => {
         const portion = values[key] / total;
         const percentRounded = (portion * 100).toFixed(2);
         const strokeLength = portion * circumference;
         const angle = portion * 360;

         const circleX = cx - r * 2;
         const circleY = cy + r * 3 + (i * r) / 2;

         // Devicon inline SVG
         const iconSVG = getDeviconSVG(key);
         const iconScale = 0.18;
         const otherScale = 1;

         // Center icon vertically relative to small circle
         const iconYOffset = -12; // tweak this to visually center

         graph.push(`
                <circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent"
                    stroke="${colors[i] || "#888"}"
                    stroke-width="${r * 2}"
                    stroke-dasharray="${strokeLength} ${circumference}"
                    transform="rotate(${sumAngle - 90} ${cx} ${cy})"/>
                
                <circle r="${r / 5}" cx="${circleX}" cy="${circleY}"
                    fill="${
                       colors[i] || "#888"
                    }" stroke-width="3px" stroke="white"/>

                <g transform="translate(${circleX + 20}, ${
            circleY + iconYOffset
         }) scale(${key === "Other" ? otherScale : iconScale})">${iconSVG}</g>
                <text x="${circleX + 52}" y="${circleY}"
                    font-size="20" dominant-baseline="middle" text-anchor="start" class="title">
                    ${percentRounded}%
                </text>
            `);

         sumAngle += angle;
      });

      graph.push(`
            <text x="${cx}" y="${y - (r / 2) * 3}"
                font-size="40" dominant-baseline="middle" text-anchor="middle" class="title">
                ${name}
            </text>
        `);
   }

   return graph;
}

/**
 *
 * @param {string} user
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} colour
 * @param {number} limit
 * @returns
 */
async function parseLink(user, x, y, r, colour, limit) {
   const [reposJSON, totalCommits] = await Promise.all([
      fetch(
         `https://api.github.com/search/repositories?q=user:${user}`,
         headerValues
      )
         .then((res) => res.json())
         .then((data) => data.items || []),
      fetch(
         `https://api.github.com/search/commits?q=author:${user}`,
         headerValues
      )
         .then((res) => res.json())
         .then((data) => data.total_count || 0),
   ]);

   const numRepos = reposJSON.length;

   let starred = 0,
      pullRequests = 0,
      issues = 0,
      watchers = 0,
      forks = 0;
   const lan = {};
   const weightedLanguages = {};

   await Promise.all(
      reposJSON.map(async (repo) => {
         const [repoLang, pulls, repoIssues] = await Promise.all([
            fetch(repo.languages_url, headerValues).then((res) => res.json()),
            fetch(repo.pulls_url.replace("{/number}", ""), headerValues).then(
               (res) => res.json()
            ),
            fetch(repo.issues_url.replace("{/number}", ""), headerValues).then(
               (res) => res.json()
            ),
         ]);

         starred += repo.stargazers_count;
         pullRequests += Array.isArray(pulls) ? pulls.length : 0;
         issues += Array.isArray(repoIssues) ? repoIssues.length : 0;
         watchers += repo.watchers_count;
         forks += repo.forks_count;

         const sumValues = Object.values(repoLang).reduce(
            (acc, val) => acc + val,
            0
         );
         for (const [lang, count] of Object.entries(repoLang)) {
            lan[lang] = (lan[lang] || 0) + count;
            const weightedValue = sumValues ? count / sumValues : 0;
            weightedLanguages[lang] =
               (weightedLanguages[lang] || 0) + weightedValue;
         }
      })
   );

   const sortedLan = getTopValues(lan, limit);
   const sortedWeightedLan = getTopValues(weightedLanguages, limit);

   const keys = Object.keys(sortedLan);
   const weightedKeys = Object.keys(sortedWeightedLan);
   const lineTotal = Object.values(sortedLan).reduce(
      (acc, val) => acc + val,
      0
   );
   const reposCodeTotal = Object.values(sortedWeightedLan).reduce(
      (acc, val) => acc + val,
      0
   );

   const colors = colours[colour in colours ? colour : "default"].colours;

   // Generate graphs
   const linesGraph = generateGraph(
      r * 3,
      y,
      r,
      "Lines",
      keys,
      sortedLan,
      lineTotal,
      colors
   );
   const weightedGraph = generateGraph(
      r * 9,
      y,
      r,
      "Repos",
      weightedKeys,
      sortedWeightedLan,
      reposCodeTotal,
      colors
   );

   const scale = 1.5;
   const stats_x = (r / 2) * 25;
   const statistics = `
    <g transform="translate(${stats_x}, ${
      r * 3 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("repo")}
    </g>
    <text x="${x - r}" y="${
      r * 3
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${numRepos}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 4 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
       ${getStatsIcon("git-commit")}
    </g>
    <text x="${x - r}" y="${
      r * 4
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${totalCommits}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 5 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("star")}
    </g>
    <text x="${x - r}" y="${
      r * 5
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${starred}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 6 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("git-pull-request")}
    </g>
    <text x="${x - r}" y="${
      r * 6
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${pullRequests}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 7 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("issue-opened")}
    </g>
    <text x="${x - r}" y="${
      r * 7
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${issues}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 8 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("eye")}
    </g>
    <text x="${x - r}" y="${
      r * 8
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${watchers}
    </text>
    <g transform="translate(${stats_x}, ${
      r * 9 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      ${getStatsIcon("git-branch")}
    </g>
    <text x="${x - r}" y="${
      r * 9
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${forks}
    </text>
  `;

   return linesGraph.join("\n") + weightedGraph.join("\n") + statistics;
}

module.exports = { parseLink };
