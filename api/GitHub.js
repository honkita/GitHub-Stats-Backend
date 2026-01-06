require("dotenv").config();
const colours = require("../Assets/colours.json");

const headerValues = {
   headers: { Authorization: `bearer ${process.env.GHTOKEN}` },
};

function getTopValues(values, limit) {
   const entries = Object.entries(values).sort(([, a], [, b]) => b - a);
   if (entries.length <= limit) return Object.fromEntries(entries);
   const topEntries = entries.slice(0, limit);
   const otherTotal = entries
      .slice(limit)
      .reduce((acc, [, val]) => acc + val, 0);
   return { ...Object.fromEntries(topEntries), Other: otherTotal };
}

const fs = require("fs");
const path = require("path");

// Function to get Devicon SVG
function getDeviconSVG(tech) {
   const techName = tech.toLowerCase();
   const filePath = path.join(
      __dirname,
      "../node_modules/devicon/icons",
      techName,
      `${techName}-plain.svg`
   );

   try {
      let svg = fs.readFileSync(filePath, "utf-8");
      // Remove XML declaration & <svg> wrapper so it can be inlined
      svg = svg
         .replace(/<\?xml.*?\?>/, "")
         .replace(/<!DOCTYPE.*?>/, "")
         .replace(/<svg[^>]*>/, "")
         .replace(/<\/svg>/, "");
      return svg;
   } catch (err) {
      console.warn(`Devicon SVG not found for ${tech}: ${filePath}`);
      return ""; // fallback: empty
   }
}

// Updated generateGraph function with icons + text and bigger icons
function generateGraph(cx, y, r, name, keys, values, total, colors) {
   const graph = [];
   let sumAngle = 0;

   if (values !== null && keys.length > 0) {
      const cy = r * 4;
      const circumference = 2 * r * Math.PI;

      keys.forEach((key, i) => {
         const portion = values[key] / total;
         const percentRounded = (portion * 100).toFixed(2);
         const strokeLength = portion * circumference;
         const angle = portion * 360;

         // Get Devicon SVG or fallback text
         const iconSVG = getDeviconSVG(key);

         // Adjust scale for bigger icons
         const iconScale = 0.5;

         graph.push(`
                <circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent"
                    stroke="${colors[i]}"
                    stroke-width="${r * 2}"
                    stroke-dasharray="${strokeLength} ${circumference}"
                    transform="rotate(${sumAngle - 90} ${cx} ${cy})"/>
                <circle r="${r / 5}" cx="${cx - r * 2}" cy="${
            cy + r * 3 + (i * r) / 2
         }"
                    fill="${colors[i]}" stroke-width="3px" stroke="white"/>
                
                <!-- Devicon icon -->
                <g transform="translate(${cx - r * 2}, ${
            cy + r * 3 + (i * r) / 2 - 12
         }) scale(${iconScale})">
                    ${iconSVG}
                </g>

                <!-- Text label (language + %) -->
                <text x="${cx - r * 2 + 40}" y="${cy + r * 3 + (i * r) / 2}"
                    font-size="20" dominant-baseline="middle" text-anchor="start" class="title">
                    ${key}: ${percentRounded}%
                </text>
            `);

         sumAngle += angle;
      });

      // Graph title
      graph.push(`
            <text x="${cx}" y="${y - (r / 2) * 3}"
                font-size="40" dominant-baseline="middle" text-anchor="middle" class="title">
                ${name}
            </text>
        `);
   }

   return graph;
}

async function parseLink(user, x, y, r, colour, limit) {
   // Fetch repositories and commit count concurrently
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

   // Process each repository concurrently
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

   // Generate the graphs
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
   const statistics = `
    <g transform="translate(${(r / 2) * 25}, ${
      r * 3 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H6A1.5 1.5 0 0 0 4.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 0 1-.6 1.374A3.251 3.251 0 0 1 3 18.75Z" fill="white"></path>
        <path d="M7 18.25a.25.25 0 0 1 .25-.25h5a.25.25 0 0 1 .25.25v5.01a.25.25 0 0 1-.397.201l-2.206-1.604a.25.25 0 0 0-.294 0L7.397 23.46a.25.25 0 0 1-.397-.2v-5.01Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 3
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${numRepos}
    </text>
    <g transform="translate(${(r / 2) * 25}, ${
      r * 4 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M16.944 11h4.306a.75.75 0 0 1 0 1.5h-4.306a5.001 5.001 0 0 1-9.888 0H2.75a.75.75 0 0 1 0-1.5h4.306a5.001 5.001 0 0 1 9.888 0Zm-1.444.75a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 4
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${totalCommits}
    </text>
    <!-- Additional SVG icons and statistics below -->
    <g transform="translate(${(r / 2) * 25}, ${
      r * 5 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 .25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.751.751 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.328.668A.75.75 0 0 1 12 .25Zm0 2.445L9.44 7.882a.75.75 0 0 1-.565.41l-5.725.832 4.143 4.038a.748.748 0 0 1 .215.664l-.978 5.702 5.121-2.692a.75.75 0 0 1 .698 0l5.12 2.692-.977-5.702a.748.748 0 0 1 .215-.664l4.143-4.038-5.725-.831a.75.75 0 0 1-.565-.41L12 2.694Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 5
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${starred}
    </text>
    <g transform="translate(${(r / 2) * 25}, ${
      r * 6 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M16 19.25a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm-14.5 0a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm0-14.5a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0ZM4.75 3a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 3Zm0 14.5a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 17.5Zm14.5 0a1.75 1.75 0 1 0 .001 3.501 1.75 1.75 0 0 0-.001-3.501Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 6
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${pullRequests}
    </text>
    <g transform="translate(${(r / 2) * 25}, ${
      r * 7 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1ZM2.5 12a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5A9.5 9.5 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12Zm9.5 2a2 2 0 1 1-.001-3.999A2 2 0 0 1 12 14Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 7
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${issues}
    </text>
    <g transform="translate(${(r / 2) * 25}, ${
      r * 8 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" fill="white"></path>
        <path d="M12 3.5c3.432 0 6.124 1.534 8.054 3.241 1.926 1.703 3.132 3.61 3.616 4.46a1.6 1.6 0 0 1 0 1.598c-.484.85-1.69 2.757-3.616 4.461-1.929 1.706-4.622 3.24-8.054 3.24-3.432 0-6.124-1.534-8.054-3.24C2.02 15.558.814 13.65.33 12.8a1.6 1.6 0 0 1 0-1.598c.484-.85 1.69-2.757 3.616-4.462C5.875 5.034 8.568 3.5 12 3.5ZM1.633 11.945a.115.115 0 0 0-.017.055c.001.02.006.039.017.056.441.774 1.551 2.527 3.307 4.08C6.691 17.685 9.045 19 12 19c2.955 0 5.31-1.315 7.06-2.864 1.756-1.553 2.866-3.306 3.307-4.08a.111.111 0 0 0 .017-.056.111.111 0 0 0-.017-.056c-.441-.773-1.551-2.527-3.307-4.08C17.309 6.315 14.955 5 12 5 9.045 5 6.69 6.314 4.94 7.865c-1.756 1.552-2.866 3.306-3.307 4.08Z" fill="white"></path>
      </svg>
    </g>
    <text x="${x - r}" y="${
      r * 8
   }" font-size="20" dominant-baseline="middle" text-anchor="end" class="title">
      ${watchers}
    </text>
    <g transform="translate(${(r / 2) * 25}, ${
      r * 9 - (24 * scale) / 2
   }) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Z" fill="white"></path>
      </svg>
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
