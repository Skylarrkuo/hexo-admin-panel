'use strict';

const fs = require('fs');
const path = require('path');
const { isPathInside } = require('../shared/paths');
const { writeTextFileAtomic, writeBufferFileAtomic } = require('../modules/config/atomic-write');

function createFileRepository(root, fileSystem) {
  const io = fileSystem || fs;
  const base = path.resolve(root);
  function guard(filePath) {
    const resolved = path.resolve(filePath);
    if (!isPathInside(base, resolved)) throw new Error('Repository path escapes Hexo root');
    return resolved;
  }
  return {
    root: base,
    exists(filePath) { return io.existsSync(guard(filePath)); },
    mkdir(directory) { io.mkdirSync(guard(directory), { recursive: true }); },
    readText(filePath) { return io.readFileSync(guard(filePath), 'utf8'); },
    readBuffer(filePath) { return io.readFileSync(guard(filePath)); },
    writeText(filePath, content) { writeTextFileAtomic(guard(filePath), content, io); },
    writeBuffer(filePath, content) { writeBufferFileAtomic(guard(filePath), content, io); },
    list(directory, options) { return io.readdirSync(guard(directory), options); },
    stat(filePath) { return io.statSync(guard(filePath)); },
    remove(filePath) { io.unlinkSync(guard(filePath)); },
    move(source, destination) { io.renameSync(guard(source), guard(destination)); },
    copy(source, destination) { io.copyFileSync(guard(source), guard(destination)); }
  };
}

module.exports = { createFileRepository };
