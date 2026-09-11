'use strict';

const fs = require('fs');
const path = require('path');
const { isPathInside, assertRealPathInside, realPathIncludingMissing } = require('../shared/paths');
const { writeTextFileAtomic, writeBufferFileAtomic } = require('../modules/config/atomic-write');

function createFileRepository(root, fileSystem) {
  const io = fileSystem || fs;
  const base = path.resolve(root);
  const realRoot = realPathIncludingMissing(base, io);
  let observer;
  function before(filePath) { if (observer) { observer.guard(filePath); observer.capture(filePath); } }
  function guard(filePath) {
    const resolved = path.resolve(filePath);
    if (!isPathInside(base, resolved)) throw new Error('Repository path escapes Hexo root');
    assertRealPathInside(base, resolved, io, realRoot);
    return resolved;
  }
  return {
    root: base,
    observe(value) { observer = value; },
    exists(filePath) { return io.existsSync(guard(filePath)); },
    mkdir(directory) { io.mkdirSync(guard(directory), { recursive: true }); },
    readText(filePath) { return io.readFileSync(guard(filePath), 'utf8'); },
    readBuffer(filePath) { return io.readFileSync(guard(filePath)); },
    writeText(filePath, content) { const target=guard(filePath);before(target);writeTextFileAtomic(target, content, io); },
    writeBuffer(filePath, content) { const target=guard(filePath);before(target);writeBufferFileAtomic(target, content, io); },
    list(directory, options) { return io.readdirSync(guard(directory), options); },
    stat(filePath) { return io.statSync(guard(filePath)); },
    remove(filePath) { const target=guard(filePath);before(target);io.unlinkSync(target); },
    removeTree(directory) { io.rmSync(guard(directory), { recursive: true, force: true }); },
    move(source, destination) {
      const from=guard(source),to=guard(destination);before(from);before(to);io.renameSync(from,to);
      try{if(observer?.moved)observer.moved(from,to);}
      catch(error){io.renameSync(guard(to),guard(from));throw error;}
    },
    copy(source, destination) { const from=guard(source),to=guard(destination);before(to);io.copyFileSync(from,to); }
  };
}

module.exports = { createFileRepository };
