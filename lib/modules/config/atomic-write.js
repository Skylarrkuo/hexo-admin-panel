'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function writeTextFileAtomic(filePath, content, fileSystem) {
  const io = fileSystem || fs;
  const tempPath = path.join(path.dirname(filePath), '.' + path.basename(filePath) + '.' + crypto.randomBytes(16).toString('hex') + '.tmp');
  let created = false;
  try {
    io.writeFileSync(tempPath, content, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    created = true;
    io.renameSync(tempPath, filePath);
  } catch (error) {
    try { if (created && io.existsSync(tempPath)) io.unlinkSync(tempPath); } catch (_) {}
    throw error;
  }
}

function writeBufferFileAtomic(filePath, content, fileSystem) {
  const io = fileSystem || fs;
  const tempPath = path.join(path.dirname(filePath), '.' + path.basename(filePath) + '.' + crypto.randomBytes(16).toString('hex') + '.tmp');
  let created = false;
  try {
    io.writeFileSync(tempPath, content, { flag: 'wx', mode: 0o600 });
    created = true;
    io.renameSync(tempPath, filePath);
  } catch (error) {
    try { if (created && io.existsSync(tempPath)) io.unlinkSync(tempPath); } catch (_) {}
    throw error;
  }
}

module.exports = { writeTextFileAtomic, writeBufferFileAtomic };
