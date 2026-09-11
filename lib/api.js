'use strict';

const crypto = require('crypto');
const path = require('path');
const { createRouter } = require('./server/router');
const { createOperationQueue } = require('./shared/operation-queue');
const { createThemeResolver } = require('./modules/themes/resolver');
const { createPostService } = require('./modules/posts/service');
const { createMediaService } = require('./modules/media/service');
const { createConfigService } = require('./modules/config/service');
const { createThemeService } = require('./modules/themes/service');
const { createCredentialService } = require('./modules/auth/credentials');
const { createSessionService } = require('./modules/auth/sessions');
const { createLoginLimiter } = require('./modules/auth/security');
const { createTrashService } = require('./modules/trash/service');
const { createEssayService } = require('./modules/essays/service');
const { createAboutService } = require('./modules/about/service');
const { createScheduleService } = require('./modules/schedule/service');
const { createCommandService } = require('./modules/commands/service');
const { createScaffoldService } = require('./modules/scaffolds/service');
const { createPageService } = require('./modules/pages/service');
const { createTaxonomyService } = require('./modules/taxonomies/service');
const { createPreviewService } = require('./modules/previews/service');
const { authRoutes } = require('./modules/auth/routes');
const { dashboardRoutes } = require('./modules/dashboard/routes');
const { postRoutes } = require('./modules/posts/routes');
const { renderRoutes } = require('./modules/render/routes');
const { mediaRoutes } = require('./modules/media/routes');
const { configRoutes } = require('./modules/config/routes');
const { themeRoutes } = require('./modules/themes/routes');
const { commandRoutes } = require('./modules/commands/routes');
const { trashRoutes } = require('./modules/trash/routes');
const { essayRoutes } = require('./modules/essays/routes');
const { aboutRoutes } = require('./modules/about/routes');
const { scheduleRoutes } = require('./modules/schedule/routes');
const { scaffoldRoutes } = require('./modules/scaffolds/routes');
const { pageRoutes } = require('./modules/pages/routes');
const { taxonomyRoutes } = require('./modules/taxonomies/routes');
const { previewRoutes } = require('./modules/previews/routes');
const { systemRoutes } = require('./modules/system/routes');
const { createFileRepository } = require('./repositories/file-repository');

function createContext(hexo, config, runtime) {
  const source = hexo.source_dir;
  const context = {
    hexo,
    config,
    runtime: runtime || {},
    instanceId: crypto.randomUUID(),
    paths: {
      source,
      posts: path.join(source, '_posts'),
      drafts: path.join(source, '_drafts'),
      images: path.join(source, 'images'),
      data: path.join(source, '_data'),
      essays: path.join(source, '_data', 'essays.yml'),
      about: path.join(source, 'about', 'index.md'),
      scaffolds: hexo.scaffold_dir || path.join(hexo.base_dir, 'scaffolds')
    },
    operations: createOperationQueue(),
    repositories: {},
    services: {}
  };
  context.repositories.files = createFileRepository(hexo.base_dir);
  context.themes = createThemeResolver(hexo, { fs: {
    existsSync: filePath => context.repositories.files.exists(filePath),
    readFileSync: (filePath, encoding) => encoding ? context.repositories.files.readText(filePath) : context.repositories.files.readBuffer(filePath)
  } });
  context.services.credentials = createCredentialService(context);
  context.services.sessions = createSessionService(context);
  const security = config.security || { login_max_attempts: 5, login_window_minutes: 15, login_lock_minutes: 15 };
  context.loginLimiter = createLoginLimiter({
    maxAttempts: security.login_max_attempts || 5,
    windowMs: (security.login_window_minutes || 15) * 60000,
    lockMs: (security.login_lock_minutes || 15) * 60000
  });
  context.services.scaffolds = createScaffoldService(context);
  context.services.posts = createPostService(context);
  context.services.media = createMediaService(context);
  context.services.trash = createTrashService(context);
  context.services.config = createConfigService(context);
  context.services.themes = createThemeService(context);
  context.services.essays = createEssayService(context);
  context.services.about = createAboutService(context);
  context.services.commands = createCommandService(context);
  context.services.scheduler = createScheduleService(context);
  context.services.pages = createPageService(context);
  context.services.taxonomies = createTaxonomyService(context);
  context.services.previews = createPreviewService(context);
  return context;
}

module.exports = function createApiHandler(hexo, config, runtime) {
  const context = createContext(hexo, config, runtime);
  const router = createRouter({ config, sessions: context.services.sessions });
  [
    authRoutes, dashboardRoutes, postRoutes, renderRoutes,
    mediaRoutes, configRoutes, themeRoutes, commandRoutes, trashRoutes, essayRoutes, aboutRoutes, scheduleRoutes,
    scaffoldRoutes, pageRoutes, taxonomyRoutes, previewRoutes, systemRoutes
  ].forEach(factory => router.register(factory(context)));
  return router.handler;
};
