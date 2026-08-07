const util = require('node:util');
if (!util.styleText) {
  util.styleText = function(format, text) {
    // Basic ANSI color fallback mapping
    const formats = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      bold: '\x1b[1m',
      dim: '\x1b[2m'
    };
    const code = formats[format] || '';
    const reset = code ? '\x1b[0m' : '';
    return `${code}${text}${reset}`;
  };
}
