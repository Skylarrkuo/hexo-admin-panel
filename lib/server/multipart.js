'use strict';

function parseMultipart(buffer, boundary) {
  const files = [];
  const fields = {};
  const marker = Buffer.from('--' + boundary.replace(/^"|"$/g, ''));
  let cursor = 0;
  while (cursor < buffer.length) {
    let start = buffer.indexOf(marker, cursor);
    if (start < 0) break;
    start += marker.length;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const end = buffer.indexOf(marker, start);
    if (end < 0) break;
    let part = buffer.slice(start, end);
    if (part[part.length - 1] === 10) part = part.slice(0, -1);
    if (part[part.length - 1] === 13) part = part.slice(0, -1);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd < 0) { cursor = end; continue; }
    const headers = part.slice(0, headerEnd).toString('utf8');
    const body = part.slice(headerEnd + 4);
    const name = headers.match(/name="([^"]+)"/);
    const filename = headers.match(/filename="([^"]+)"/);
    const type = headers.match(/Content-Type:\s*(\S+)/i);
    if (name && filename) files.push({ fieldname: name[1], filename: filename[1], mimetype: type ? type[1] : 'application/octet-stream', buffer: body });
    else if (name) fields[name[1]] = body.toString('utf8');
    cursor = end;
  }
  return { files, fields };
}

module.exports = { parseMultipart };
