const express = require("express");
var githubParser = require("./GitHub");
var cache = require("memory-cache");
const colours = require("../Assets/colours.json");
require("gopd/gOPD");
const app = express();
const PORT = 4000;

const box = { height: 600, width: 800, curve: 20, border: 10 };
const circle = { r: 50 };
const line = { width: 4 };

//github colour is 1B1F23
app.use(express.json()); // <==== parse request body as JSON
var colour;

app.get("/", (req, res) => {
   //res.setHeader("Content-Type", "application/json");
   res.setHeader("Content-Type", "image/svg+xml");
   var link;
   if (req.query.github != null) {
      if (req.query.colour == null) {
         colour = "default";
         cache.put("colour", "default", 60000);
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
              fill: white;
            }
          </style>
        </defs>
          <g>
            <rect width="${box.width}" height="${box.height}" x="0" y="0" rx="${
            box.curve
         }" ry="${box.curve}" 
              style="fill:${background};stroke-width:${
            box.border
         };stroke:white" /> 
          <g transform="translate(${box.border * 2}, ${
            box.border * 2
         }) scale(0.0625)" dominant-baseline="middle" text-anchor="left">
            <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)" fill="white"/>
            </svg>
          </g>
          <text x="${box.border * 2 + 96}" y="${
            box.border * 2 + 32
         }" font-size= "${
            box.width / 16
         }" dominant-baseline="middle" text-anchor="left" class="title">
            ${req.query.github}</text>   
          <circle r="${circle.r * 2}" cx="${circle.r * 3}" cy="${
            circle.r * 4
         }" style="fill:transparent;stroke-width:${box.border};stroke:white"/>
          <rect x="${circle.r * 6 - line.width / 2}" y = "${
            circle.r * 2
         }" width="${line.width}" height="${box.height - circle.r * 3}" rx="${
            line.width / 2
         }" ry="${line.width / 2}" fill="white"/>
          <circle r="${circle.r * 2}" cx="${circle.r * 9}" cy="${
            circle.r * 4
         }" style="fill:transparent;stroke-width:${box.border};stroke:white"/>
          <rect x="${circle.r * 12 - line.width / 2}" y = "${
            circle.r * 2
         }" width="${line.width}" height="${box.height - circle.r * 3}" rx="${
            line.width / 2
         }" ry="${line.width / 2}" fill="white"/>
          ${link} 
          <circle r="${circle.r}" cx="${circle.r * 3}" cy="${
            circle.r * 4
         }" style="fill:${background};stroke-width:${
            box.border / 2
         };stroke:white"/>
          <circle r="${circle.r}" cx="${circle.r * 9}" cy="${
            circle.r * 4
         }" style="fill:${background};stroke-width:${
            box.border / 2
         };stroke:white"/>
        </g>
                
        
      </svg>`
      );
   });
});

app.listen(PORT, () => {});
module.exports = app;
