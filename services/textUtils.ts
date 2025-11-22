export const applyTypography = (text: string): string => {
  if (!text) return text;
  
  return text
    // Em-dashes (--- or --)
    .replace(/---/g, '\u2014')
    .replace(/--/g, '\u2013')
    
    // Ellipsis
    .replace(/\.\.\./g, '\u2026')
    
    // Smart Double Quotes
    .replace(/(\W|^)"(\S)/g, '$1\u201c$2') // Opening double quotes
    .replace(/(\u201c[^"]*)"([^"]*$|[^\u201c"]*\u201c)/g, '$1\u201d$2') // Closing double quotes
    .replace(/([^0-9])"/g, '$1\u201d') // Remaining double quotes (usually closing)
    
    // Smart Single Quotes / Apostrophes
    .replace(/(\W|^)'(\S)/g, '$1\u2018$2') // Opening single quotes
    .replace(/([a-z])'([a-z])/ig, '$1\u2019$2') // Apostrophes
    .replace(/((\u2018[^']*)|[a-z])'([^0-9]|$)/ig, '$1\u2019$3') // Closing single quotes
    .replace(/'/g, '\u2019'); // Catch-all
};
