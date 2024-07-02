require("dotenv").config();

const colours = require("../Assets/colours.json");

// headers for authentification
const headerValues = {
  headers: { Authorization: `bearer ${process.env.GHTOKEN}` },
};

function getTopValues(values, limit) {
  var sortedDict = Object.fromEntries(
    Object.entries(values).sort(([, a], [, b]) => b - a)
  );

  var keys = Object.keys(sortedDict);

  // if there are more values than the limit permits, truncate to limit + 1 for other
  if (keys.length > limit) {
    var other = 0;
    for (let i = limit; i < keys.length; i++) {
      other = other + sortedDict[keys[i]];
    }
    sortedDict = Object.fromEntries(
      Object.entries(values)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
    );
    keys = Object.keys(sortedDict);
    sortedDict["Other"] = other;
    keys.push("Other");
  }
  return sortedDict;
}

module.exports = {
  parseLink: async function (user, x, y, r, colour, limit) {
    // fetch the JSON for the GitHub user's repos
    const reposFetch = await fetch(
      "https://api.github.com/search/repositories?q=user:" + user,
      headerValues
    );

    const repos = await reposFetch.json();
    const reposJSON = repos["items"];
    const lan = {};
    const weightedLanguages = {};
    const numRepos = reposJSON.length;

    var t = 0;

    for (let i = 0; i < numRepos; i++) {
      //console.log(this.posts[i]["name"]);
      const pp = await fetch(reposJSON[i]["languages_url"], headerValues);
      //console.log(reposJSON[i]["languages_url"]);
      const ppp = await pp.json();

      const sumValues = Object.values(ppp).reduce((a, b) => a + b, 0); // sum of all the lines of code in a given repo

      Object.keys(ppp).forEach(function (key) {
        // console.log(key);
        // console.log(ppp[key]);
        // console.log(key in lan);
        if (!(key in Object.keys(lan))) {
          lan[key] = ppp[key];
        } else {
          lan[key] = lan[key] + ppp[key];
        }
      });

      Object.keys(ppp).forEach(function (key) {
        if (!(key in weightedLanguages)) {
          weightedLanguages[key] = ppp[key] / sumValues;
        } else {
          weightedLanguages[key] =
            weightedLanguages[key] + ppp[key] / sumValues;
        }
      });
    }

    //get the number of commits the user has
    const commitsFetch = await fetch(
      "https://api.github.com/search/commits?q=author:" + user,
      headerValues
    );

    const commitsFetchJSON = await commitsFetch.json();
    const totalCommits = await commitsFetchJSON["total_count"];

    var sortedDict = getTopValues(lan, limit);
    var sortedWeightedDict = getTopValues(weightedLanguages, limit);
    var keys = Object.keys(sortedDict);
    var weightedkeys = Object.keys(sortedWeightedDict);
    console.log(sortedWeightedDict);
    console.log(weightedkeys);

    var lineTotal = Object.values(sortedDict).reduce((a, b) => a + b, 0);
    // reposCodeTotal /= numRepos SINCE repos can have no code
    var reposCodeTotal = Object.values(sortedWeightedDict).reduce(
      (a, b) => a + b,
      0
    );

    let sum = 0;
    const c = colours[colour in colours ? colour : "default"];

    const linesGraph = [];
    const weightedGraph = [];

    //console.log(colours["default"]);
    if (keys != null && lineTotal !== null && sortedDict !== null) {
      const cx = r * 3;
      const cy = r * 4;
      for (let i = 0; i < keys.length; i++) {
        const portion = sortedDict[keys[i]] / lineTotal;
        const percentRounded = (portion * 100).toFixed(2);
        const circumference = 2 * r * 3.14;
        const p = portion * circumference;
        const angle = portion * 360;
        linesGraph.push(
          `<circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent"
                stroke="${c[i]}"
                stroke-width="${r * 2}"
                stroke-dasharray="${p} ${circumference}"
                transform="rotate(${sum - 90} ${cx} ${cy})"/>

            <circle r="${r / 5}" cx="${cx - r * 2}" cy="${cy + r * 3 + (i * r) / 2}" fill="${c[i]}" stroke-width="3px" stroke="white"/>
            <text x="${cx - (r / 2) * 3}" y="${cy + r * 3 + (i * r) / 2}" font-size= "20" dominant-baseline="middle" text-anchor="start" class="title">
              ${keys[i]}: ${percentRounded}%
            </text> 

            `
        );
        sum = sum + angle;
      }
      linesGraph.push(
        `
          <text x="${cx}" y="${y - (r / 2) * 3}" font-size= "40" dominant-baseline="middle" text-anchor="middle" class="title">
              Lines
          </text> 
        `
      );
    }

    if (keys != null && lineTotal !== null && sortedWeightedDict !== null) {
      const cx = r * 9;
      const cy = r * 4;
      for (let i = 0; i < weightedkeys.length; i++) {
        const portion = sortedWeightedDict[weightedkeys[i]] / reposCodeTotal;
        const percentRounded = (portion * 100).toFixed(2);
        const circumference = 2 * r * 3.14;
        const p = portion * circumference;
        const angle = portion * 360;

        weightedGraph.push(
          `<circle r="${r}" cx="${cx}" cy="${cy}" fill="transparent"
                stroke="${c[i]}"
                stroke-width="${r * 2}"
                stroke-dasharray="${p} ${circumference}"
                transform="rotate(${sum - 90} ${cx} ${cy})"/>

            <circle r="${r / 5}" cx="${cx - r * 2}" cy="${cy + r * 3 + (i * r) / 2}" fill="${c[i]}" stroke-width="3px" stroke="white"/>
            <text x="${cx - (r / 2) * 3}" y="${cy + r * 3 + (i * r) / 2}" font-size= "20" dominant-baseline="middle" text-anchor="start" class="title">
              ${weightedkeys[i]}: ${percentRounded}%
            </text> 

            `
        );
        sum = sum + angle;
      }
      weightedGraph.push(
        `
          <text x="${cx}" y="${y - (r / 2) * 3}" font-size= "40" dominant-baseline="middle" text-anchor="middle" class="title">
              Repos
          </text> 
        `
      );
    }

    const scale = 1 / 20;

    var statistics = `
      <g transform="translate(${(r / 2) * 25}, ${y / 2 - (1024 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg height="1024" width="896" xmlns="http://www.w3.org/2000/svg">
          <path d="M694.875 448C666.375 337.781 567.125 256 448 256c-119.094 0-218.375 81.781-246.906 192H0v128h201.094C229.625 686.25 328.906 768 448 768c119.125 0 218.375-81.75 246.875-192H896V448H694.875zM448 640c-70.656 0-128-57.375-128-128 0-70.656 57.344-128 128-128 70.625 0 128 57.344 128 128C576 582.625 518.625 640 448 640z" fill="white"/>
        </svg>
      </g>
      
      <text x="${x - r}" y="${y / 2}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${totalCommits}
      </text>
      `;
    return linesGraph.join("\r\n") + weightedGraph.join("\r\n") + statistics;
  },
};
