const fs = require("fs");
const path = require("path");

colours = require("../Assets/colours.json");

/**
 * Returns the Stats Icon SVG for a given name
 * @param {string} name
 * @returns
 */
function getStatsIcon(name, lineColour = "#FFFFFF") {
   let filePath = path.join(
      __dirname,
      "../node_modules/@primer/octicons/build/svg",
      `${name}-24.svg`
   );
   return svgModifier(filePath, lineColour).replace(
      /\s*\/>/g,
      ` fill="${lineColour}"/>`
   );
}

/**
 * Normalizes tech names to match Devicon naming conventions
 * @param {string} key
 * @returns
 */
function normalizeTechName(key) {
   if (!key) return "";
   const mapping = {
      css: "css3",
      html: "html5",
      js: "javascript",
      ts: "typescript",
   };
   const lowercase = key.toLowerCase();
   return mapping[lowercase] || key.toLowerCase();
}

/**
 * Modifies the SVG file to fit styling and change colour
 * @param {string} filePath
 * @returns
 */
function svgModifier(filePath, lineColour = "#FFFFFF") {
   try {
      let svg = fs.readFileSync(filePath, "utf-8");
      svg = svg
         .replace(/<\?xml.*?\?>/, "")
         .replace(/<!DOCTYPE.*?>/, "")
         .replace(/<svg[^>]*>/, "")
         .replace(/<\/svg>/, "")
         .replace(/fill=".*?"/g, `fill="${lineColour}"`);

      return svg;
   } catch (err) {
      console.warn(`Devicon SVG not found for ${filePath}`);
      return "";
   }
}

/**
 * Returns the DeviconSVG for a given coding language
 * @param {string} tech
 * @returns
 */
function getDeviconSVG(tech, lineColour = "#FFFFFF") {
   const techName = normalizeTechName(tech);
   let filePath = path.join(
      __dirname,
      "../node_modules/devicon/icons",
      techName,
      `${techName}-plain.svg`
   );

   if (techName === "other") {
      return getStatsIcon("code", lineColour);
   } else if (!fs.existsSync(filePath)) {
      filePath = path.join(
         __dirname,
         "../node_modules/devicon/icons",
         techName,
         `${techName}-original.svg`
      );
      return svgModifier(filePath, lineColour).replace(
         /\s*\/>/g,
         ` fill="${lineColour}" stroke="${lineColour}" />`
      );
   }
   return svgModifier(filePath, lineColour);
}

module.exports = {
   getDeviconSVG,
   getStatsIcon,
};
