const express = require("express");
var githubParser = require("./GitHub");
const app = express();
const PORT = 4000;

const box = { height: 500, width: 800, curve: 20, border: 10 };
const circle = { x: box.width / 4, y: box.height / 2, r: 50 };

app.use(express.json()); // <==== parse request body as JSON
// console.log("FUCK");
// let userToken = githubParser.parseLink("honkita");
// userToken.then(function (result) {
//   console.log(result); // "Some User token"
// });

app.get("/", (req, res) => {
  //res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Type", "image/svg+xml");
  var link;
  if (req.query.github != null) {
    link = githubParser.parseLink(
      req.query.github,
      circle.x,
      circle.y,
      circle.r
    );

    //console.log(link);
  }

  link.then(function (result) {
    link = result; // "Some User token"
    //console.log(link);
    res.send(
      `<svg xmlns="http://www.w3.org/2000/svg" height="${box.height}" width="${box.width}" viewBox="0 0 1000 1000">
        <g>
          <rect width="${box.width}" height="${box.height}" x="0" y="0" rx="${box.curve}" ry="${box.curve}" 
            style="fill:transparent;stroke-width:${box.border};stroke:black" /> 
          ${link}
        </g>
                
        
      </svg>`
    );
  });

  // res.setHeader("Content-Type", "image/svg+xml");
  // res.send(`
  //   <svg xmlns="http://www.w3.org/2000/svg" height="500" width="200" viewBox="0 0 500 200">
  //       <g>

  //       <circle r="100" cx="100" cy="100" fill="blue" />
  //       <circle r="50" cx="100" cy="100" fill="transparent"
  //               stroke="tomato"
  //               stroke-width="100"
  //               stroke-dasharray="calc(35 * 3.142 * 100 / 100) 314.2  "/>
  //       </g>
  //   </svg>
  // `);
});

app.listen(PORT, () => {});

module.exports = app;
