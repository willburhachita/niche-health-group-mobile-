const { default: pngToIco } = require('png-to-ico');
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'public', 'logo.png');
const dest = path.join(__dirname, 'public', 'logo.ico');

pngToIco(src)
  .then(buf => {
    fs.writeFileSync(dest, buf);
    console.log('OK ' + buf.length + ' bytes');
  })
  .catch(e => { console.error('ERR ' + e.message); process.exit(1); });
