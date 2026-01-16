const express = require("express");
var githubParser = require("./GitHub");
var cache = require("memory-cache");
const colours = require("../Assets/colours.json");
const app = express();

const svgViewer = require("../utils/svgViewer");
const { getDeviconSVG } = svgViewer;

const PORT = 4000;

const box = { height: 600, width: 800, curve: 20, border: 10 };
const circle = { r: 50 };
const line = { width: 4 };

app.use(express.json());
var colour;

app.get("/", (req, res) => {
   res.setHeader("Content-Type", "image/svg+xml");
   var link;
   if (req.query.github != null) {
      if (req.query.colour == null) {
         colour = "mono_dark";
      } else {
         colour = req.query.colour;
      }
      if (
         req.query.limit == null ||
         req.query.limit > 5 ||
         req.query.limit < 1
      ) {
         limit = 5;
      } else {
         limit = req.query.limit;
      }
      if (
         cache.get("link") == null ||
         cache.get("colour") != colour ||
         cache.get("limit") != limit
      ) {
         cache.put("colour", colour, 60000);
         cache.put("limit", limit, 60000);
         cache.put(
            "link",
            githubParser.parseLink(
               req.query.github,
               box.width,
               box.height,
               circle.r,
               cache.get("colour"),
               cache.get("limit")
            ),
            60000
         );
      }

      link = cache.get("link");
   }

   link.then(function (result) {
      link = result; // user information
      const background =
         colours[colour in colours ? colour : "default"]["background"];

      res.send(
         `<svg xmlns="http://www.w3.org/2000/svg" width="${
            box.width
         }" height="${box.height}"  viewBox="0 0 ${box.width} ${box.height}">
      <defs>  
        <style type="text/css">
            .title {
              font-family: "Verdana";
              font-weight: 400;
              font-style: normal; 
              fill: ${colours[colour in colours ? colour : "mono_dark"].line};
            }
          </style>
        </defs>
          <g>
            <rect width="${box.width}" height="${box.height}" x="0" y="0" rx="${
            box.curve
         }" ry="${box.curve}" 
              style="fill:${background};stroke-width:${box.border};stroke:${
            colours[colour in colours ? colour : "mono_dark"].line
         }" /> 
          <g transform="translate(${box.border * 2}, ${
            box.border * 2
         }) scale(0.5)" dominant-baseline="middle" text-anchor="left">
            ${getDeviconSVG(
               "github",
               colours[colour in colours ? colour : "mono_dark"].line
            )}
          </g>
          <text x="${box.border * 2 + 96}" y="${
            box.border * 2 + 32
         }" font-size= "${
            box.width / 16
         }" dominant-baseline="middle" text-anchor="left" class="title">
            ${req.query.github}</text>   
          <circle r="${circle.r * 2}" cx="${circle.r * 3}" cy="${
            circle.r * 4
         }" style="fill:transparent;stroke-width:${box.border};stroke:${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
          <rect x="${circle.r * 6 - line.width / 2}" y = "${
            circle.r * 2
         }" width="${line.width}" height="${box.height - circle.r * 3}" rx="${
            line.width / 2
         }" ry="${line.width / 2}" fill="${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
          <circle r="${circle.r * 2}" cx="${circle.r * 9}" cy="${
            circle.r * 4
         }" style="fill:transparent;stroke-width:${box.border};stroke:${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
          <rect x="${circle.r * 12 - line.width / 2}" y = "${
            circle.r * 2
         }" width="${line.width}" height="${box.height - circle.r * 3}" rx="${
            line.width / 2
         }" ry="${line.width / 2}" fill="${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
          ${link} 
          <circle r="${circle.r}" cx="${circle.r * 3}" cy="${
            circle.r * 4
         }" style="fill:${background};stroke-width:${box.border / 2};stroke:${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
          <circle r="${circle.r}" cx="${circle.r * 9}" cy="${
            circle.r * 4
         }" style="fill:${background};stroke-width:${box.border / 2};stroke:${
            colours[colour in colours ? colour : "mono_dark"].line
         }"/>
        </g>
      </svg>`
      );
   });
});

app.listen(PORT, () => {});
module.exports = app;
