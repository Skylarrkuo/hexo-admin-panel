# hexo-admin-panel

A full-featured admin dashboard for Hexo, built with zero external dependencies and direct Hexo internal API integration.

## Features

- JWT authentication
- Post CRUD (create/read/update/delete)
- Draft/publish toggle
- Front Matter visual editor
- Markdown real-time preview
- Media file management (upload/delete/browse)
- Category management
- Tag management
- Site config view/edit
- Dashboard stats (posts, words, categories, tags)
- One-click generate/deploy/clean cache
- Theme listing
- Pagination, search
- Responsive frontend (Vue 3 + marked.js via CDN)
- All UI in Chinese

## Installation

```bash
npm install hexo-admin-panel
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "hexo-admin-panel": "^1.0.0"
  }
}
```

Then run `npm install`.

## Configuration

Add the following to your `_config.yml`:

```yaml
admin:
  username: admin
  password: your-secure-password
  jwt_secret: your-random-secret-string
  token_expiry: 24h
```

Or create a separate `_admin-config.yml` file in your Hexo root:

```yaml
admin:
  username: admin
  password: your-secure-password
  jwt_secret: your-random-secret-string
  token_expiry: 24h
```

### Configuration Priority

1. `hexo.config.admin` (from `_config.yml` under `admin:` key)
2. `_admin-config.yml` file
3. Built-in defaults (admin/admin)

## Usage

1. Start your Hexo server:

```bash
hexo server
```

2. Open your browser and navigate to:

```
http://localhost:4000/admin
```

3. Login with your configured credentials.

## API Endpoints

All endpoints are prefixed with `/admin/api`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/login` | POST | Login, returns JWT |
| `/auth/verify` | GET | Validate token |
| `/posts` | GET | List posts (pagination, search, filter) |
| `/posts/:id` | GET | Get single post |
| `/posts` | POST | Create new post |
| `/posts/:id` | PUT | Update post |
| `/posts/:id` | DELETE | Delete post |
| `/posts/:id/publish` | PUT | Toggle draft/published |
| `/categories` | GET | List all categories |
| `/tags` | GET | List all tags |
| `/media` | GET | List media files |
| `/media/upload` | POST | Upload file |
| `/media/:filename` | DELETE | Delete media file |
| `/config` | GET | Read _config.yml |
| `/config` | PUT | Write _config.yml |
| `/stats` | GET | Dashboard stats |
| `/themes` | GET | List installed themes |
| `/commands/generate` | POST | hexo generate |
| `/commands/deploy` | POST | hexo deploy |
| `/commands/clean` | POST | hexo clean |

## License

MIT
