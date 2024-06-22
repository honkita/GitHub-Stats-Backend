const colours = require("../Assets/colours.json");
module.exports = {
  parseLink: async function (user, x, y, r, colour, limit) {
    const p = await fetch("https://api.github.com/users/" + user + "/repos");
    const request = await p.json();
    const lan = {};
    var t = 0;
    for (let i = 0; i < request.length; i++) {
      //console.log(this.posts[i]["name"]);
      const pp = await fetch(request[i]["languages_url"]);
      const ppp = await pp.json();

      Object.keys(ppp).forEach(function (key) {
        if (!(key in Object.keys(lan))) {
          lan[key] = ppp[key];
        } else {
          lan[key] = lan[key] + ppp[key];
        }
      });
    }

    var sortedDict = Object.fromEntries(
      Object.entries(lan).sort(([, a], [, b]) => b - a)
    );

    var total = 0;
    var keys = Object.keys(sortedDict);

    if (keys.length > limit) {
      var other = 0;
      for (let i = limit; i < keys.length; i++) {
        other = other + sortedDict[keys[i]];
      }
      sortedDict = Object.fromEntries(
        Object.entries(lan)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
      );
      keys = Object.keys(sortedDict);
      sortedDict["Other"] = other;
      keys.push("Other");
    }

    console.log(sortedDict);

    keys.forEach(function (key) {
      total = total + sortedDict[key];
    });

    let sum = 0;
    const c = colours[colour in colours ? colour : "default"];
    const styles = [];
    //console.log(colours["default"]);
    if (keys != null && total !== null && sortedDict !== null) {
      for (let i = 0; i < keys.length; i++) {
        const portion = sortedDict[keys[i]] / total;
        const percentRounded = (portion * 100).toFixed(2);
        const circumference = 2 * r * 3.14;
        const p = portion * circumference;
        const angle = portion * 360;
        styles.push(
          `<circle r="${r}" cx="${x}" cy="${y}" fill="transparent"
                stroke="${c[i]}"
                stroke-width="${r * 2}"
                stroke-dasharray="${p} ${circumference}"
                transform="rotate(${sum - 90} ${x} ${y})"/>

            <circle r="${r / 5}" cx="${x * 2}" cy="${y - r * 2 + i * 25}" fill="${c[i]}" stroke-width="3px" stroke="white"/>
            <text x="${x * 2 + (r / 5) * 2}" y="${y - r * 2 + i * 25}" font-size= "20" dominant-baseline="middle" text-anchor="start" class="title">
              ${keys[i]}: ${percentRounded} %
            </text> 

            `
        );
        sum = sum + angle;
      }
      return styles.join("\r\n");
    }
  },
};
