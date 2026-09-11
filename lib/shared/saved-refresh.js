'use strict';

// Disk is the content source of truth. A refresh failure must not turn a
// committed write into an ambiguous HTTP failure or roll back external edits.
async function refreshSavedContent(context) {
  try {
    await context.operations.run(() => context.hexo.source.process());
    return { saved: true, refreshed: true };
  } catch (error) {
    context.hexo.log.warn('hexo-admin-panel: Content saved, but source refresh failed: ' + error.message);
    return { saved: true, refreshed: false, warning: { code: 'SOURCE_REFRESH_FAILED' } };
  }
}

module.exports = { refreshSavedContent };
