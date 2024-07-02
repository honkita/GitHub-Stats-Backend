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
    var starred = 0;
    var pullRequests = 0;
    var issues = 0;

    for (let i = 0; i < numRepos; i++) {
      //console.log(this.posts[i]["name"]);

      const pp = await fetch(reposJSON[i]["languages_url"], headerValues);
      //console.log(reposJSON[i]["languages_url"]);
      const ppp = await pp.json();

      const stargazersFetch = await fetch(
        reposJSON[i]["stargazers_url"],
        headerValues
      );
      const stargazersList = await stargazersFetch.json();
      starred = starred + stargazersList.length;

      if (reposJSON[i]["visibility"] == "public") {
        // get pull requests ONLY IF the repo is public
        const pullRequestsFetch = await fetch(
          reposJSON[i]["pulls_url"].replace("{/number}", ""),
          headerValues
        );
        const pullRequestsList = await pullRequestsFetch.json();
        pullRequests = pullRequests + pullRequestsList.length;
      }

      // get pull requests ONLY IF the repo is public
      const issuesFetch = await fetch(
        reposJSON[i]["issues_url"].replace("{/number}", ""),
        headerValues
      );
      const issuesFetchList = await issuesFetch.json();
      issues = issues + issuesFetchList.length;

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

    const scale = 3 / 2;
    var statistics = `
      <g transform="translate(${(r / 2) * 25}, ${r * 3 - (24 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M3 2.75A2.75 2.75 0 0 1 5.75 0h14.5a.75.75 0 0 1 .75.75v20.5a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1 0-1.5h5.25v-4H6A1.5 1.5 0 0 0 4.5 18v.75c0 .716.43 1.334 1.05 1.605a.75.75 0 0 1-.6 1.374A3.251 3.251 0 0 1 3 18.75ZM19.5 1.5H5.75c-.69 0-1.25.56-1.25 1.25v12.651A2.989 2.989 0 0 1 6 15h13.5Z"
            fill="white">
          </path>
          <path d="M7 18.25a.25.25 0 0 1 .25-.25h5a.25.25 0 0 1 .25.25v5.01a.25.25 0 0 1-.397.201l-2.206-1.604a.25.25 0 0 0-.294 0L7.397 23.46a.25.25 0 0 1-.397-.2v-5.01Z"
            fill="white">
          </path>
        </svg>
      </g>

      <text x="${x - r}" y="${r * 3}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${numRepos}
      </text>


      <g transform="translate(${(r / 2) * 25}, ${r * 4 - (24 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M16.944 11h4.306a.75.75 0 0 1 0 1.5h-4.306a5.001 5.001 0 0 1-9.888 0H2.75a.75.75 0 0 1 0-1.5h4.306a5.001 5.001 0 0 1 9.888 0Zm-1.444.75a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z" 
            fill="white">
          </path>
        </svg>
      </g>
      
      <text x="${x - r}" y="${r * 4}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${totalCommits}
      </text>

      <g transform="translate(${(r / 2) * 25}, ${r * 5 - (24 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 .25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.751.751 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.328.668A.75.75 0 0 1 12 .25Zm0 2.445L9.44 7.882a.75.75 0 0 1-.565.41l-5.725.832 4.143 4.038a.748.748 0 0 1 .215.664l-.978 5.702 5.121-2.692a.75.75 0 0 1 .698 0l5.12 2.692-.977-5.702a.748.748 0 0 1 .215-.664l4.143-4.038-5.725-.831a.75.75 0 0 1-.565-.41L12 2.694Z"
            fill="white">
          </path>
        </svg>
      </g>
      
      <text x="${x - r}" y="${r * 5}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${starred}
      </text>

      <g transform="translate(${(r / 2) * 25}, ${r * 6 - (24 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M16 19.25a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm-14.5 0a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0Zm0-14.5a3.25 3.25 0 1 1 6.5 0 3.25 3.25 0 0 1-6.5 0ZM4.75 3a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 3Zm0 14.5a1.75 1.75 0 1 0 .001 3.501A1.75 1.75 0 0 0 4.75 17.5Zm14.5 0a1.75 1.75 0 1 0 .001 3.501 1.75 1.75 0 0 0-.001-3.501Z" 
          fill="white">
        </path>
        <path d="M13.405 1.72a.75.75 0 0 1 0 1.06L12.185 4h4.065A3.75 3.75 0 0 1 20 7.75v8.75a.75.75 0 0 1-1.5 0V7.75a2.25 2.25 0 0 0-2.25-2.25h-4.064l1.22 1.22a.75.75 0 0 1-1.061 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 0ZM4.75 7.25A.75.75 0 0 1 5.5 8v8A.75.75 0 0 1 4 16V8a.75.75 0 0 1 .75-.75Z" 
          fill="white">
        </path>
       </svg>
      </g>

      <text x="${x - r}" y="${r * 6}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${pullRequests}
      </text>

      <g transform="translate(${(r / 2) * 25}, ${r * 7 - (24 * scale) / 2}) scale(${scale})" dominant-baseline="middle" text-anchor="middle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1ZM2.5 12a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5A9.5 9.5 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12Zm9.5 2a2 2 0 1 1-.001-3.999A2 2 0 0 1 12 14Z"
            fill="white">
          </path>
        </svg>
      </g>
      
      <text x="${x - r}" y="${r * 7}" font-size="20" dominant-baseline="middle" text-anchor="end" class="title"> 
        ${issues}
      </text>


      `;
    return linesGraph.join("\r\n") + weightedGraph.join("\r\n");
  },
};
