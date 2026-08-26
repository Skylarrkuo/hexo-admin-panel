'use strict';

const fs = require('fs');
const path = require('path');

function writeTextFileAtomic(filePath, content, fileSystem) {
  const io = fileSystem || fs;
  const tempPath = path.join(path.dirname(filePath), '.' + path.basename(filePath) + '.' + process.pid + '.' + Date.now() + '.tmp');
  try {
    io.writeFileSync(tempPath, content, 'utf8');
    io.renameSync(tempPath, filePath);
  } catch (error) {
    try { if (io.existsSync(tempPath)) io.unlinkSync(tempPath); } catch (_) {}
    throw error;
  }
}

module.exports = { writeTextFileAtomic };
