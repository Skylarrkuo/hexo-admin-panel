# Third-party notices

Hexo Admin Panel is released under the [MIT License](LICENSE). The logo in
`assets/hexo-admin-panel-logo.svg` is original project artwork and is covered
by the same license.

The distributed plugin relies on, integrates with, or bundles the following
open-source projects. Each project remains governed by its own license and
copyright notices.

## Runtime and integration

### Hexo (`>=4.0.0`, peer dependency)

- Use: site generator and plugin host.
- Copyright: Copyright (c) 2012-present Tommy Chen.
- License: [MIT](https://github.com/hexojs/hexo/blob/master/LICENSE).
- Source: [hexojs/hexo](https://github.com/hexojs/hexo).

### hexo-front-matter (`^4.2.1`)

- Use: parse and serialize Markdown Front Matter.
- Copyright attribution: package author Tommy Chen; contributors retain copyright in their contributions.
- License: [MIT](https://github.com/hexojs/hexo-front-matter/blob/master/package.json).
- Source: [hexojs/hexo-front-matter](https://github.com/hexojs/hexo-front-matter).

### js-yaml (`^4.3.1`)

- Use: parse and serialize YAML.
- Copyright: Copyright (C) 2011-2015 Vitaly Puzrin.
- License: [MIT](https://github.com/nodeca/js-yaml/blob/master/LICENSE).
- Source: [nodeca/js-yaml](https://github.com/nodeca/js-yaml).

### yaml (`^2.9.0`)

- Use: edit YAML documents while preserving comments and scalar formatting.
- Copyright: Eemeli Aro <eemeli@gmail.com>.
- License: [ISC](https://github.com/eemeli/yaml/blob/main/LICENSE).
- Source: [eemeli/yaml](https://github.com/eemeli/yaml).

### sharp (`^0.34.4`)

- Use: read image metadata and optimize images.
- Copyright: Copyright 2013 Lovell Fuller and others.
- License: [Apache-2.0](https://github.com/lovell/sharp/blob/main/LICENSE).
- Source: [lovell/sharp](https://github.com/lovell/sharp).

## Browser bundle

### Vue (`3.5.41` in the current bundle)

- Use: admin interface runtime.
- Copyright: Copyright (c) 2018-present, Yuxi (Evan) You.
- License: [MIT](https://github.com/vuejs/core/blob/main/LICENSE).
- Source: [vuejs/core](https://github.com/vuejs/core).

### marked (`15.0.12` in the current bundle)

- Use: convert Markdown to HTML.
- Copyright: Copyright (c) 2018+ MarkedJS; Copyright (c) 2011-2018 Christopher Jeffrey; Markdown syntax copyright © 2004 John Gruber.
- License: [MIT, with the bundled BSD-3-Clause Markdown notice](https://github.com/markedjs/marked/blob/master/LICENSE.md).
- Source: [markedjs/marked](https://github.com/markedjs/marked).

### DOMPurify (`3.4.14` in the current bundle)

- Use: sanitize HTML produced by Markdown rendering.
- Copyright: Copyright (c) Cure53 and other contributors.
- License: [Apache-2.0 OR MPL-2.0](https://github.com/cure53/DOMPurify/blob/main/LICENSE).
- Source: [cure53/DOMPurify](https://github.com/cure53/DOMPurify).

This list covers all direct runtime dependencies, the Hexo peer host, and all
third-party libraries embedded in the distributed browser bundle. Build-only
development tools are not shipped as executable dependencies of the npm package.
