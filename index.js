const express = require("express");
const app = express();
const PORT = 4000;

app.use(express.json()); // <==== parse request body as JSON

var resultJson1;

app.get("/api", (req, res) => {
  res.send(`
    <svg height="500" width="200" viewBox="0 0 500 200">
        <g>
        
        <circle r="100" cx="100" cy="100" fill="blue" />
        <circle r="50" cx="100" cy="100" fill="transparent"
                stroke="tomato"
                stroke-width="100"
                stroke-dasharray="calc(35 * 3.142 * 100 / 100) 314.2  "/>
        </g>
    </svg>
  `);
});

app.listen(PORT, () => {
  console.log("Server started");
});

module.exports = app;
