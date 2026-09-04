<p align="center">
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel">
    <img src="./assets/hexo-admin-panel-logo.svg" width="120" alt="Hexo Admin Panel Logo">
  </a>
</p>

<h1 align="center">Hexo Admin Panel</h1>

<p align="center">
  <a href="./README.md">简体中文</a> · <strong>English</strong>
</p>

<p align="center">
  A local-first blog management workspace that runs inside Hexo and keeps Markdown and YAML as the source of truth.
</p>

<p align="center">
  No content database, no separate backend deployment, and no changes to the way Hexo publishes your site.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hexo-admin-panel"><img alt="npm version" src="https://img.shields.io/npm/v/hexo-admin-panel?style=flat-square&color=8b5961"></a>
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Skylarrkuo/hexo-admin-panel/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/Skylarrkuo/hexo-admin-panel/blob/master/LICENSE"><img alt="MIT License" src="https://img.shields.io/npm/l/hexo-admin-panel?style=flat-square&color=8b5961"></a>
  <img alt="Node.js 20 or newer" src="https://img.shields.io/badge/Node.js-%3E%3D20-8b5961?style=flat-square">
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#features">Features</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#local-development">Development</a> ·
  <a href="#open-source-licenses-and-attributions">Licenses</a>
</p>

---

## Project scope

Hexo Admin Panel is designed for site maintainers who want a complete graphical workspace without giving up Hexo's file-based workflow. The admin interface is mounted at `/admin` on the existing Hexo server. Content remains in the site directory, so it continues to work with Git, text editors, CI pipelines, and existing deployment scripts.

| Principle | Implementation |
| --- | --- |
| Files remain the source of truth | Reads and writes `source/`, `scaffolds/`, and theme override files directly, without a shadow database |
| Preview the real site | Builds with the active Hexo instance, including the actual theme, plugins, and permalink |
| Keep writes recoverable | Revision conflict detection, atomic writes, trash, and pre-change backups |
| Make publishing observable | Scheduling calendar, task progress, Hexo output logs, cancellation, retries, and history |

```text
Vue admin interface in the browser
                 │  /admin/api
                 ▼
          Current Hexo process
            ├─ source/          Markdown, pages, and media
            ├─ scaffolds/       Hexo content templates
            ├─ _config*.yml     Site and theme configuration
            └─ .hexo-admin/     Private state, backups, jobs, and logs
```

## Features

### Content authoring

- Create, edit, publish, unpublish, and trash posts, with full-text search and bulk operations.
- Create content from the site's existing `scaffolds/*.md` templates.
- Use draft, in progress, in review, scheduled, and published workflow states.
- Edit Front Matter without losing the original types of strings, numbers, booleans, null values, arrays, or objects.
- Switch between form, full source, Markdown, and split preview modes, with local autosave and unsaved-change protection.
- Select or create categories and tags through searchable controls instead of free-form text fields.

### Pages, taxonomies, and site structure

- Manage `source/**/index.md` and other standalone Markdown pages under `source/`.
- Choose a Hexo scaffold, page layout, and source path when creating a page.
- Detect common `navbar.links` or `menu` theme structures and reorder navigation entries.
- View taxonomy usage and merge, rename, or delete categories and tags.
- Manage Redefine theme settings and `source/_data/essays.yml` entries.
- Protect site configuration, theme configuration, posts, pages, and essays with revision-aware writes.

### Media library

- Recursively manage `source/images` and its subdirectories, using complete relative paths to distinguish duplicate filenames.
- Search the entire library server-side and analyze path-level references in Markdown, YAML, JSON, HTML, and CSS.
- Filter unused assets, rename them safely, or move them to trash.
- Optimize JPEG, PNG, and WebP images; replace the original only when the result is smaller and retain a backup.
- Validate upload count, request size, extension, MIME type, and file signature. SVG uploads are always rejected.

### Real previews and publishing center

- Build posts and standalone pages with Hexo, then display the real theme, plugins, and permalink in a same-origin iframe.
- Protect previews with random tokens that expire after 30 minutes by default; temporary directories are cleared on restart.
- Display scheduled publishing tasks in a calendar and retain completed, failed, and cancelled history.
- Support automatic failure retries, manual retries, and configurable retry counts and intervals.
- Run `generate`, `deploy`, `clean`, and `rebuild` as background jobs.
- Expose queued, running, cancelling, completed, failed, and cancelled states with progress, logs, retries, and cancellation.

### Reliability, security, and experience

- Require a password change on first login; migrate existing plaintext credentials to a PBKDF2 hash and rotate the JWT secret.
- Apply CSP, clickjacking protection, MIME sniffing protection, Referrer Policy, and Permissions Policy to the admin interface and API.
- Enforce login rate limits, token expiry, strict path boundaries, and centralized input validation.
- Refresh the Hexo source only once after an entire bulk publish, unpublish, or trash operation completes.
- Provide Chinese and English interfaces, light and dark modes, and responsive desktop and mobile layouts.
- Surface task state and raw Hexo output in both the dashboard and publishing center.

## Requirements

- Node.js `>= 20.0.0`
- Hexo `>= 4.0.0`
- A Hexo site that can already run `hexo server` and `hexo generate` successfully

The npm package includes the prebuilt admin interface. Regular users do not need to install or start Vite separately.

> [!IMPORTANT]
> The admin panel can write content and execute deployment commands. Do not expose `/admin` directly to an untrusted public network. For remote access, place it behind HTTPS, a trusted reverse proxy, a private network, or an additional access-control layer.

## Quick start

### 1. Install

Run this command from the root of your Hexo site:

```bash
npm install hexo-admin-panel
```

### 2. Initialize the administrator account

Create `_admin-config.yml` in the site root. The password is needed only as an initial bootstrap credential:

```yaml
admin:
  username: admin
  password: replace-with-a-long-temporary-password
```

On first startup, the plugin converts the password to a PBKDF2 hash, generates a random JWT secret, and saves both in `.hexo-admin/state.yml`. It then removes `password`, `password_hash`, and `jwt_secret` from `_admin-config.yml` automatically.

If no administrator configuration is provided, the plugin temporarily enables the one-time `admin/admin` account and requires a new password of at least 12 characters immediately after login.

### 3. Start Hexo and sign in

```bash
npx hexo server
```

Open [http://localhost:4000/admin](http://localhost:4000/admin). If the site uses a non-root path, the admin URL follows Hexo's `root` configuration automatically.

### 4. Protect private state

Add these entries to the site's `.gitignore`:

```gitignore
.hexo-admin/
_admin-config.yml
```

`.hexo-admin/` contains credential state, trashed content, configuration backups, task records, and deployment logs. It must not be committed to a public repository or included in the generated site.

## Core workflows

### Create content from a template

Choose a template from the site's `scaffolds/` directory, then select a workflow state. Draft, in-progress, and in-review content is stored under `source/_drafts`. Content published immediately is stored under `source/_posts`. Scheduled content also creates a persistent publishing task.

### Edit without losing types

Form mode is convenient for common fields, while full source mode preserves custom Front Matter. Unknown fields remain intact, and scalar or structured values are not silently coerced after a form round trip. Each save includes the current revision; if another window or external process changes the source file, the stale request returns `409`.

### Validate the real theme

After saving a post or page, select “Real theme preview.” The plugin generates the target page with the active Hexo configuration, theme, and plugins, then displays the final result in an iframe. Because this invokes the actual Hexo build, theme and third-party plugin build code should be treated as trusted code.

### Schedule and track publishing

The publishing center combines scheduled posts with Hexo command jobs. Scheduled publishing depends on the Hexo process remaining active. If the service stops temporarily, overdue work resumes during the next check after startup. A task tries up to 3 times by default with a 5-minute delay, and both values can be customized when it is created.

### Recover from mistakes

Deleting a post, page, or media asset moves it to `.hexo-admin/trash/` by default. Configuration, essays, menus, taxonomies, and media compression create backups before modifying data. Permanent deletion remains an explicit action in the trash interface.

## Configuration

Configuration can be placed under the `admin` key in Hexo's `_config.yml` or in a separate `_admin-config.yml`. The separate file is recommended for initial setup because the plugin can remove plaintext credentials from it automatically after migration.

```yaml
admin:
  username: admin
  password: replace-with-a-long-temporary-password
  token_expiry: 24h

  security:
    login_max_attempts: 5
    login_window_minutes: 15
    login_lock_minutes: 15

  uploads:
    max_file_size: 10485760
    max_request_size: 52428800
    max_files: 10
    allowed_extensions:
      - .jpg
      - .jpeg
      - .png
      - .gif
      - .webp
      - .bmp
      - .ico
      - .pdf
      - .zip
      - .mp3
      - .mp4
```

| Setting | Default | Description |
| --- | --- | --- |
| `admin.username` | `admin` | Administrator username |
| `admin.password` | `admin` | Bootstrap only; the default credential must be changed after login |
| `admin.jwt_secret` | Migrated or generated | Optional; a supplied value must contain at least 32 characters and private state takes ownership after initialization |
| `admin.token_expiry` | `24h` | Login token lifetime, such as `30m`, `24h`, or `7d` |
| `admin.security.login_max_attempts` | `5` | Failed login attempts allowed within the tracking window |
| `admin.security.login_window_minutes` | `15` | Failed-login tracking window in minutes |
| `admin.security.login_lock_minutes` | `15` | Lock duration after the limit is reached |
| `admin.uploads.max_file_size` | `10485760` | Maximum size of one file in bytes |
| `admin.uploads.max_request_size` | `52428800` | Maximum upload request size in bytes |
| `admin.uploads.max_files` | `10` | Maximum number of files in one request |
| `admin.uploads.allowed_extensions` | See example | Allowed extensions; SVG remains prohibited |

Configuration is merged in this order, from highest to lowest priority:

1. Initialized username, password hash, and JWT secret in `.hexo-admin/state.yml`
2. The `admin` section of Hexo's `_config.yml`
3. `_admin-config.yml`
4. Plugin defaults

When upgrading from an older version, non-default plaintext passwords are migrated during startup and the JWT secret is rotated. Credentials are removed automatically from the separate configuration file. If they were stored in Hexo's `_config.yml`, remove `password`, `password_hash`, and `jwt_secret` manually after confirming the migration.

## Data and backups

| Content | Location |
| --- | --- |
| Published posts | `source/_posts/` |
| Drafts and other unpublished states | `source/_drafts/` |
| Standalone pages | `source/**/index.md` or other non-post Markdown files |
| Hexo content templates | `scaffolds/*.md` |
| Media assets | `source/images/` |
| Redefine essays | `source/_data/essays.yml` |
| Private administrator state | `.hexo-admin/state.yml` |
| Trash | `.hexo-admin/trash/` |
| Configuration and essay backups | `.hexo-admin/backups/` |
| Original media backups | `.hexo-admin/backups/media/` |
| Taxonomy change backups | `.hexo-admin/backups/taxonomies/` |
| Theme menu backups | `.hexo-admin/backups/menu/` |
| Scheduled publishing records | `.hexo-admin/scheduled-posts.json` |
| Hexo command jobs and logs | `.hexo-admin/jobs/` |
| Temporary real-theme previews | `.hexo-admin/previews/` |
| Server restart log | `.hexo-admin/restart.log` |

Essay changes retain the latest 20 YAML snapshots by default. Media optimization retains the latest 5 original-file backups. After saving a theme menu, rebuild or restart Hexo so the theme reloads its configuration.

## Compatibility and operational boundaries

- General content, media, publishing, and command features are not tied to a particular theme.
- Redefine receives dedicated configuration metadata and essay management. Other themes use the generic YAML configuration editor.
- Menu ordering currently recognizes common `navbar.links` and `menu` structures. Themes with custom navigation structures must be edited through their override configuration.
- The scheduled publishing service runs inside the Hexo process. It cannot trigger while the host is asleep or Hexo is stopped; overdue tasks continue after the service starts again.
- “Rebuild and restart” targets local environments running `hexo server` directly. Use external orchestration when Hexo is managed by a process manager or container.
- Real-theme previews invoke the site's generators, renderers, and plugins. Build time therefore depends on site size and plugin behavior.

## API and job model

All management endpoints use the `/admin/api` prefix. Error responses include a stable, machine-readable code:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Clients should branch on `code` instead of depending on the potentially localized `error` message.

`generate`, `deploy`, `clean`, `rebuild`, and real previews return HTTP `202` with a job object. Command job states include:

```text
queued → running → completed
                 ↘ failed
                 ↘ cancelling → cancelled
```

Common resources:

| Resource | Endpoint |
| --- | --- |
| Posts and workflow | `/admin/api/posts` |
| Standalone pages and menus | `/admin/api/pages` |
| Taxonomy center | `/admin/api/taxonomies` |
| Hexo scaffolds | `/admin/api/scaffolds` |
| Scheduled publishing | `/admin/api/schedules` |
| Real build previews | `/admin/api/previews` |
| Command jobs and logs | `/admin/api/commands/jobs` |

## Local development

Clone the repository and install the locked dependencies:

```bash
git clone https://github.com/Skylarrkuo/hexo-admin-panel.git
cd hexo-admin-panel
npm ci
```

Run the complete quality gate:

```bash
npm run check
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build production admin assets |
| `npm run test:node` | Run backend and structure tests |
| `npm run test:ui` | Run Vue component tests |
| `npm test` | Run all tests |
| `npm run lint` | Lint Node, Vue, and test sources |
| `npm run coverage` | Generate Node and frontend coverage reports |
| `npm run check` | Run lint, all tests, and a production build |

For integration testing in a real Hexo site, declare the plugin as a local file dependency:

```json
{
  "dependencies": {
    "hexo-admin-panel": "file:../hexo-admin-panel"
  }
}
```

The Vite development server runs at `http://localhost:5173` by default and proxies `/admin/api` to `http://localhost:4000`.

### Project structure

```text
hexo-admin-panel/
├─ index.js                 Hexo plugin entry
├─ lib/
│  ├─ plugin/               Configuration, registration, and middleware
│  ├─ server/               Routing, authentication, and request handling
│  ├─ modules/              Domain-oriented feature modules
│  ├─ repositories/         File access constrained to the site root
│  └─ shared/               Shared utilities
├─ admin/src/
│  ├─ api/                  Admin API client
│  ├─ components/           Reusable interface components
│  ├─ composables/          State and interaction logic
│  ├─ layouts/              Admin layouts
│  ├─ pages/                Feature pages
│  ├─ styles/               Theme and responsive styles
│  └─ utils/                Markdown, Front Matter, and configuration utilities
├─ assets/                  Project identity
└─ test/                    Node, API, and structure tests
```

Continuous integration runs lint, tests, coverage, a production build, and an npm package inspection on Node.js 20 and 22. The `prepack` hook also runs `npm run check` before publishing.

## Contributing

Bug reports, feature requests, and Pull Requests are welcome.

1. Check [Issues](https://github.com/Skylarrkuo/hexo-admin-panel/issues) for an existing discussion.
2. Fork the repository and implement the change on a focused branch.
3. Add tests for behavioral changes and make sure `npm run check` passes.
4. Explain the use case, implementation tradeoffs, and verification in the Pull Request. Include screenshots for interface changes.

For security issues involving credentials, path boundaries, arbitrary file writes, command execution, or HTML sanitization, avoid disclosing directly exploitable details in a public Issue. Prefer the repository maintainer's private GitHub contact channel.

## Versions and releases

The current version is `3.3.0`. The project follows Semantic Versioning; see [CHANGELOG.md](./CHANGELOG.md) for details.

README: [简体中文](./README.md) · <strong>English</strong>

- [GitHub repository](https://github.com/Skylarrkuo/hexo-admin-panel)
- [npm package](https://www.npmjs.com/package/hexo-admin-panel)
- [Issues and feature requests](https://github.com/Skylarrkuo/hexo-admin-panel/issues)

## Open-source licenses and attributions

Hexo Admin Panel and the original `assets/hexo-admin-panel-logo.svg` logo are released by Skylarr Kuo under the [MIT License](./LICENSE). Keep the applicable copyright and license notices when using, modifying, or redistributing the project.

The project directly depends on, integrates with, or bundles the following open-source components:

| Component | Scope | Copyright | License |
| --- | --- | --- | --- |
| [Hexo](https://github.com/hexojs/hexo) `>=4.0.0` | Peer dependency; site generator and plugin host | Copyright (c) 2012-present Tommy Chen | [MIT](https://github.com/hexojs/hexo/blob/master/LICENSE) |
| [hexo-front-matter](https://github.com/hexojs/hexo-front-matter) `^4.2.1` | Runtime; Front Matter parsing and serialization | Package author Tommy Chen; contributors retain copyright in their contributions | [MIT](https://github.com/hexojs/hexo-front-matter/blob/master/package.json) |
| [js-yaml](https://github.com/nodeca/js-yaml) `^4.3.1` | Runtime; YAML parsing and serialization | Copyright (C) 2011-2015 Vitaly Puzrin | [MIT](https://github.com/nodeca/js-yaml/blob/master/LICENSE) |
| [sharp](https://github.com/lovell/sharp) `^0.34.4` | Runtime; image metadata and optimization | Copyright 2013 Lovell Fuller and others | [Apache-2.0](https://github.com/lovell/sharp/blob/main/LICENSE) |
| [Vue](https://github.com/vuejs/core) `3.5.41` | Browser bundle; admin interface runtime | Copyright (c) 2018-present, Yuxi (Evan) You | [MIT](https://github.com/vuejs/core/blob/main/LICENSE) |
| [marked](https://github.com/markedjs/marked) `15.0.12` | Browser bundle; Markdown conversion | Copyright (c) 2018+ MarkedJS; 2011-2018 Christopher Jeffrey; Markdown syntax © 2004 John Gruber | [MIT / BSD notice](https://github.com/markedjs/marked/blob/master/LICENSE.md) |
| [DOMPurify](https://github.com/cure53/DOMPurify) `3.4.14` | Browser bundle; HTML sanitization | Copyright (c) Cure53 and other contributors | [Apache-2.0 OR MPL-2.0](https://github.com/cure53/DOMPurify/blob/main/LICENSE) |

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for complete usage, copyright, license, and source references. The notice is included in the npm package, and each component remains governed by its own license and copyright terms.

---

<p align="center">
  Made for a transparent, file-first Hexo workflow.
</p>
