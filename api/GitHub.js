require("dotenv").config();

const colours = require("../Assets/colours.json");

const headerValues = {
  headers: { Authorization: `bearer ${process.env.GHTOKEN}` },
};

function getTopValues(values, limit) {
  var sortedDict = Object.fromEntries(
    Object.entries(values).sort(([, a], [, b]) => b - a)
  );

  var keys = Object.keys(sortedDict);

  if (keys.length > limit) {
    console.log(keys.length);
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
    // fetch the JSON for the GitHub User Info
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

    console.log(lan);
    console.log(weightedLanguages);

    const commitsFetch = await fetch(
      "https://api.github.com/search/commits?q=author:" + user,
      headerValues
    );

    const commitsFetchJSON = await commitsFetch.json();
    const totalCommits = await commitsFetchJSON["total_count"];

    var sortedDict = getTopValues(lan, limit);
    var sortedWeightedDict = getTopValues(weightedLanguages, limit);
    var keys = Object.keys(sortedDict);
    console.log(sortedWeightedDict);
    console.log(sortedDict);

    var lineTotal = Object.values(sortedDict).reduce((a, b) => a + b, 0);

    let sum = 0;
    const c = colours[colour in colours ? colour : "default"];
    const statistics = [];
    const linesGraph = [];
    const weightedGraph = [];

    //console.log(colours["default"]);
    if (keys != null && lineTotal !== null && sortedDict !== null) {
      for (let i = 0; i < keys.length; i++) {
        const portion = sortedDict[keys[i]] / lineTotal;
        const percentRounded = (portion * 100).toFixed(2);
        const circumference = 2 * r * 3.14;
        const p = portion * circumference;
        const angle = portion * 360;
        linesGraph.push(
          `<circle r="${r}" cx="${x}" cy="${y}" fill="transparent"
                stroke="${c[i]}"
                stroke-width="${r * 2}"
                stroke-dasharray="${p} ${circumference}"
                transform="rotate(${sum - 90} ${x} ${y})"/>

            <circle r="${r / 5}" cx="${x * 2}" cy="${y - (keys.length / 2 - i - 1 / 2) * 25}" fill="${c[i]}" stroke-width="3px" stroke="white"/>
            <text x="${x * 2 + (r / 5) * 2}" y="${y - (keys.length / 2 - i - 1 / 2) * 25}" font-size= "20" dominant-baseline="middle" text-anchor="start" class="title">
              ${keys[i]}: ${percentRounded} %
            </text> 

            `
        );
        sum = sum + angle;
      }
    }

    statistics.push(
      `
      <text x="${x * 4}" y="${y}" font-size= "20" dominant-baseline="middle" text-anchor="start" class="title"> 
        Commits: ${totalCommits}
      </text>
      `
    );

    return linesGraph.join("\r\n") + statistics.join("\r\n");
  },
};
