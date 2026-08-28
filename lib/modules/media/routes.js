'use strict';

const { readBody, readJson } = require('../../server/request');
const { parseMultipart } = require('../../server/multipart');
const { success } = require('../../server/response');
const { badRequest } = require('../../server/errors');
const { validate, validateId, validateIntegerQuery } = require('../../server/validation');

function mediaRoutes(context) {
  const media = context.services.media;
  return [
    { method: 'GET', path: '/media', handler({ res, query }) { validateIntegerQuery(query.page,'page',{min:1});validateIntegerQuery(query.per_page,'per_page',{min:1,max:100});if(query.usage&&!['all','used','unused'].includes(query.usage))throw badRequest('usage is invalid','VALIDATION_ERROR');success(res,media.list(query)); } },
    { method: 'GET', path: '/media/analysis', handler({ res }) { success(res,media.analysis()); } },
    {
      method: 'POST', path: '/media/upload', async handler({ req, res }) {
        const contentType = req.headers['content-type'] || '';
        const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
        if (!match) throw badRequest('Invalid content type');
        const upload = context.config.uploads || {};
        const parsed = parseMultipart(await readBody(req, { limit: upload.max_request_size || 50 * 1024 * 1024 }), match[1] || match[2]);
        if (!parsed.files.length) throw badRequest('No file uploaded');
        if (parsed.files.length > (upload.max_files || 10)) throw badRequest('一次上传的文件数量过多', 'UPLOAD_TOO_MANY_FILES');
        success(res, await media.upload(parsed.files));
      }
    },
    { method: 'PUT', path: '/media/:filename/rename', async handler({ req, res, params }) { const body=validate(await readJson(req),{name:{type:'string',required:true,minLength:1,maxLength:255}});success(res,await media.rename(validateId(params.filename,'filename'),body.name)); } },
    { method: 'POST', path: '/media/:filename/compress', async handler({ req, res, params }) { const body=validate(await readJson(req),{quality:{type:'number',min:40,max:95}});success(res,await media.compress(validateId(params.filename,'filename'),body.quality||82)); } },
    { method: 'DELETE', path: '/media/:filename', async handler({ res, params }) { success(res,await media.remove(validateId(params.filename,'filename'))); } }
  ];
}

module.exports = { mediaRoutes };
