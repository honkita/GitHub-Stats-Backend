const colours = require("../Assets/colours.json");
module.exports = {
  parseLink: async function (user, x, y, r, colour) {
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

    const sortedDict = Object.fromEntries(
      Object.entries(lan).sort(([, a], [, b]) => a - b)
    );
    console.log(sortedDict);
    var total = 0;
    var keys = Object.keys(sortedDict);
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
        const circumference = 2 * r * 3.14;
        const p = portion * circumference;
        const angle = portion * 360;
        styles.push(
          `<circle r="${r}" cx="${x}" cy="${y}" fill="transparent"
                stroke="${c[i]}"
                stroke-width="${r * 2}"
                stroke-dasharray="${p} ${circumference}"
                transform="rotate(${sum - 90} ${x} ${y})"/>
            `
        );
        sum = sum + angle;
      }
      return styles.join("\r\n");
    }
  },
};
