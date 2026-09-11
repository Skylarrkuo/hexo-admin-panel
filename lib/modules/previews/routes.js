'use strict';

const { readJson } = require('../../server/request');
const { SECURITY_HEADERS, success } = require('../../server/response');
const { validate, validateId } = require('../../server/validation');

function previewRoutes(context) {
  const previews = context.services.previews;
  return [
    { method: 'POST', path: '/previews', async handler({ req,res }) { const body=validate(await readJson(req),{kind:{type:'string',required:true,enum:['post','page']},id:{type:'string',required:true,maxLength:512},revision:{type:'string',required:true,pattern:/^[a-f0-9]{64}$/}});success(res,previews.start(body.kind,body.id,body.revision),202); } },
    { method: 'DELETE', path: '/previews/:token', handler({ res,params }) { success(res,previews.remove(validateId(params.token,'preview token'))); } },
    { method: 'GET', path: '/previews/:token/*file', public: true, handler({ res,params }) {
      const result=previews.get(validateId(params.token,'preview token'),params.file);
      // A response sandbox also protects direct/new-tab navigation. Never grant
      // allow-same-origin: theme scripts must not inherit administrator storage.
      // Token-scoped assets need CORS/CORP access from the opaque preview origin.
      const headers={...SECURITY_HEADERS,'X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"sandbox allow-scripts; default-src 'self' data: blob: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; style-src 'self' 'unsafe-inline' https: http:; img-src 'self' data: blob: https: http:; font-src 'self' data: https: http:; frame-ancestors 'self'; connect-src 'self' https: http: ws: wss:; object-src 'none'",'Cross-Origin-Resource-Policy':'cross-origin','Access-Control-Allow-Origin':'*','Content-Type':result.contentType,'Cache-Control':'no-store'};
      res.writeHead(200,headers);res.end(result.body);
    } }
  ];
}

module.exports = { previewRoutes };
