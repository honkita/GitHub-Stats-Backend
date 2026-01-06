const fs = require("fs");
const path = require("path");
const octicons = require("@primer/octicons");

function getStatsIcon(name) {
   let filePath = path.join(
      __dirname,
      "../node_modules/@primer/octicons/build/svg",
      `${name}-24.svg`
   );
   return svgModifier(filePath).replace(/\s*\/>/g, ' fill="white"/>');
}

// Map language names to Devicon filenames
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
 * Modifies the SVG file to fit styling and make white
 * @param {string} filePath
 * @returns
 */
function svgModifier(filePath) {
   try {
      let svg = fs.readFileSync(filePath, "utf-8");
      svg = svg
         .replace(/<\?xml.*?\?>/, "")
         .replace(/<!DOCTYPE.*?>/, "")
         .replace(/<svg[^>]*>/, "")
         .replace(/<\/svg>/, "")
         .replace(/fill=".*?"/g, 'fill="white"');

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
function getDeviconSVG(tech) {
   const techName = normalizeTechName(tech);
   let filePath = path.join(
      __dirname,
      "../node_modules/devicon/icons",
      techName,
      `${techName}-plain.svg`
   );

   if (techName === "other") {
      filePath = path.join(__dirname, "../Assets/other.svg");
   } else if (!fs.existsSync(filePath)) {
      filePath = path.join(
         __dirname,
         "../node_modules/devicon/icons",
         techName,
         `${techName}-original.svg`
      );
      return svgModifier(filePath).replace(
         /\s*\/>/g,
         ' fill="white" stroke="white" />'
      );
   }
   return svgModifier(filePath);
}

module.exports = {
   getDeviconSVG,
   getStatsIcon,
};
