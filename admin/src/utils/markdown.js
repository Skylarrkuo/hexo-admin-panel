import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(content) {
  const html = marked.parse(content || '');
  return sanitizeHtml(html);
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true } });
}
