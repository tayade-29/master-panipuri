// validate-config.js
const fs = require('fs');
const path = require('path');
const files = ['app.json','eas.json','package.json'];

function walk(o, p = '') {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    Object.keys(o).forEach(k => walk(o[k], p + '/' + k));
    return;
  }
  if (Array.isArray(o)) {
    o.forEach((el, idx) => {
      if (typeof el !== 'string') {
        console.log(`Non-string found at ${p}[${idx}] -> type=${typeof el}`);
        console.log(JSON.stringify(el, null, 2));
      }
      if (typeof el === 'object') walk(el, p + '[' + idx + ']');
    });
  }
}

files.forEach(f => {
  const fp = path.resolve(process.cwd(), f);
  if (!fs.existsSync(fp)) {
    console.log('Not found:', f);
    return;
  }
  console.log('\nChecking', f);
  try {
    const json = JSON.parse(fs.readFileSync(fp, 'utf8'));
    walk(json, f);
  } catch (e) {
    console.error('Error parsing', f, e.message);
  }
});
