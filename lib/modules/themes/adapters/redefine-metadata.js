'use strict';

// Generated from the Redefine Chinese override and the matching English theme configuration.
// Runtime schema generation reads this table only; it does not parse YAML comments.
const REDEFINE_METADATA = {
  "articles": {
    "label": {
      "zh-CN": "文章",
      "en": "ARTICLE"
    },
    "description": {
      "zh-CN": "文章；文档: https://redefine-docs.ohevan.com/posts/articles",
      "en": "ARTICLE；Docs: https://redefine-docs.ohevan.com/posts/articles"
    }
  },
  "articles.author_label": {
    "label": {
      "zh-CN": "作者标签",
      "en": "Author label"
    },
    "description": {
      "zh-CN": "作者标签",
      "en": "Author label"
    }
  },
  "articles.author_label.auto": {
    "label": {
      "zh-CN": "是否自动添加作者标签，例如 Lv1、Lv2、Lv3...",
      "en": "Whether to automatically add author label, e.g. Lv1, Lv2, Lv3..."
    },
    "description": {
      "zh-CN": "是否自动添加作者标签，例如 Lv1、Lv2、Lv3...",
      "en": "Whether to automatically add author label, e.g. Lv1, Lv2, Lv3..."
    }
  },
  "articles.author_label.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "articles.author_label.list": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.code_block": {
    "label": {
      "zh-CN": "代码块设置",
      "en": "Code block settings"
    },
    "description": {
      "zh-CN": "代码块设置",
      "en": "Code block settings"
    }
  },
  "articles.code_block.copy": {
    "label": {
      "zh-CN": "是否启用代码块复制按钮",
      "en": "Whether to enable code block copy button"
    },
    "description": {
      "zh-CN": "是否启用代码块复制按钮",
      "en": "Whether to enable code block copy button"
    }
  },
  "articles.code_block.font": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.code_block.font.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "articles.code_block.font.family": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.code_block.font.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.code_block.highlight_theme": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.code_block.highlight_theme.dark": {
    "label": {
      "zh-CN": "深色模式主题，支持：github-dark、monokai-sublime、vs2015、night-owl、atom-one-dark、nord、tokyo-night-dark、a11y-dark、agate",
      "en": "dark mode theme, support: github-dark, monokai-sublime, vs2015, night-owl, atom-one-dark, nord, tokyo-night-dark, a11y-dark, agate"
    },
    "description": {
      "zh-CN": "深色模式主题，支持：github-dark、monokai-sublime、vs2015、night-owl、atom-one-dark、nord、tokyo-night-dark、a11y-dark、agate",
      "en": "dark mode theme, support: github-dark, monokai-sublime, vs2015, night-owl, atom-one-dark, nord, tokyo-night-dark, a11y-dark, agate"
    }
  },
  "articles.code_block.highlight_theme.light": {
    "label": {
      "zh-CN": "浅色模式主题，支持：github、atom-one-light、default",
      "en": "light mode theme, support: github, atom-one-light, default"
    },
    "description": {
      "zh-CN": "浅色模式主题，支持：github、atom-one-light、default",
      "en": "light mode theme, support: github, atom-one-light, default"
    }
  },
  "articles.code_block.style": {
    "label": {
      "zh-CN": "mac | simple（简单）",
      "en": "mac | simple"
    },
    "description": {
      "zh-CN": "mac | simple（简单）",
      "en": "mac | simple"
    }
  },
  "articles.copyright": {
    "label": {
      "zh-CN": "是否启用版权声明",
      "en": "Whether to enable copyright notice"
    },
    "description": {
      "zh-CN": "是否启用版权声明",
      "en": "Whether to enable copyright notice"
    }
  },
  "articles.copyright.default": {
    "label": {
      "zh-CN": "默认许可证，可以是 cc_by_nc_sa、cc_by_nd、cc_by_nc、cc_by_sa、cc_by、all_rights_reserved、public_domain",
      "en": "Default license, can be cc_by_nc_sa, cc_by_nd, cc_by_nc, cc_by_sa, cc_by, all_rights_reserved, public_domain"
    },
    "description": {
      "zh-CN": "默认许可证，可以是 cc_by_nc_sa、cc_by_nd、cc_by_nc、cc_by_sa、cc_by、all_rights_reserved、public_domain",
      "en": "Default license, can be cc_by_nc_sa, cc_by_nd, cc_by_nc, cc_by_sa, cc_by, all_rights_reserved, public_domain"
    }
  },
  "articles.copyright.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "articles.lazyload": {
    "label": {
      "zh-CN": "是否为图片启用懒加载",
      "en": "Whether to enable lazyload for images"
    },
    "description": {
      "zh-CN": "是否为图片启用懒加载",
      "en": "Whether to enable lazyload for images"
    }
  },
  "articles.pangu_js": {
    "label": {
      "zh-CN": "Pangu.js（自动在中英文之间添加空格）。参见 https://github.com/vinta/pangu.js",
      "en": "Pangu.js (automatically add space between Chinese and English). See https://github.com/vinta/pangu.js"
    },
    "description": {
      "zh-CN": "Pangu.js（自动在中英文之间添加空格）。参见 https://github.com/vinta/pangu.js",
      "en": "Pangu.js (automatically add space between Chinese and English). See https://github.com/vinta/pangu.js"
    }
  },
  "articles.recommendation": {
    "label": {
      "zh-CN": "文章推荐。需要 nodejieba（npm install nodejieba）。移植自 hexo-theme-volantis。",
      "en": "Article recommendation. Requires nodejieba (npm install nodejieba). Transplanted from hexo-theme-volantis."
    },
    "description": {
      "zh-CN": "文章推荐。需要 nodejieba（npm install nodejieba）。移植自 hexo-theme-volantis。",
      "en": "Article recommendation. Requires nodejieba (npm install nodejieba). Transplanted from hexo-theme-volantis."
    }
  },
  "articles.recommendation.enable": {
    "label": {
      "zh-CN": "是否启用文章推荐",
      "en": "Whether to enable article recommendation"
    },
    "description": {
      "zh-CN": "是否启用文章推荐",
      "en": "Whether to enable article recommendation"
    }
  },
  "articles.recommendation.limit": {
    "label": {
      "zh-CN": "显示的最大文章数",
      "en": "Max number of articles to display"
    },
    "description": {
      "zh-CN": "显示的最大文章数",
      "en": "Max number of articles to display"
    }
  },
  "articles.recommendation.mobile_limit": {
    "label": {
      "zh-CN": "移动端显示的最大文章数",
      "en": "Max number of articles to display mobile"
    },
    "description": {
      "zh-CN": "移动端显示的最大文章数",
      "en": "Max number of articles to display mobile"
    }
  },
  "articles.recommendation.placeholder": {
    "label": {
      "zh-CN": "占位图片",
      "en": "Placeholder image"
    },
    "description": {
      "zh-CN": "占位图片",
      "en": "Placeholder image"
    }
  },
  "articles.recommendation.skip_dirs": {
    "label": {
      "zh-CN": "跳过的目录",
      "en": "Skip directory"
    },
    "description": {
      "zh-CN": "跳过的目录",
      "en": "Skip directory"
    }
  },
  "articles.recommendation.title": {
    "label": {
      "zh-CN": "文章推荐标题",
      "en": "Article recommendation title"
    },
    "description": {
      "zh-CN": "文章推荐标题",
      "en": "Article recommendation title"
    }
  },
  "articles.style": {
    "label": {
      "zh-CN": "设置文章样式",
      "en": "Set the styles of the article"
    },
    "description": {
      "zh-CN": "设置文章样式",
      "en": "Set the styles of the article"
    }
  },
  "articles.style.delete_mask": {
    "label": {
      "zh-CN": "为 <del> 标签添加遮罩效果，默认隐藏内容，悬停时显示",
      "en": "Add mask effect to <del> tags, hiding content by default and revealing on hover"
    },
    "description": {
      "zh-CN": "为 <del> 标签添加遮罩效果，默认隐藏内容，悬停时显示",
      "en": "Add mask effect to <del> tags, hiding content by default and revealing on hover"
    }
  },
  "articles.style.font_size": {
    "label": {
      "zh-CN": "字体大小",
      "en": "Font size"
    },
    "description": {
      "zh-CN": "字体大小",
      "en": "Font size"
    }
  },
  "articles.style.headings_top_spacing": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h1": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h2": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h3": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h4": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h5": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.headings_top_spacing.h6": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "articles.style.image_alignment": {
    "label": {
      "zh-CN": "图片对齐方式。left（左）、center（居中）",
      "en": "image alignment. left, center"
    },
    "description": {
      "zh-CN": "图片对齐方式。left（左）、center（居中）",
      "en": "image alignment. left, center"
    }
  },
  "articles.style.image_border_radius": {
    "label": {
      "zh-CN": "图片圆角",
      "en": "image border radius"
    },
    "description": {
      "zh-CN": "图片圆角",
      "en": "image border radius"
    }
  },
  "articles.style.image_caption": {
    "label": {
      "zh-CN": "是否显示图片标题",
      "en": "Whether to display image caption"
    },
    "description": {
      "zh-CN": "是否显示图片标题",
      "en": "Whether to display image caption"
    }
  },
  "articles.style.line_height": {
    "label": {
      "zh-CN": "行高",
      "en": "Line height"
    },
    "description": {
      "zh-CN": "行高",
      "en": "Line height"
    }
  },
  "articles.style.link_icon": {
    "label": {
      "zh-CN": "是否显示链接图标",
      "en": "Whether to display link icon"
    },
    "description": {
      "zh-CN": "是否显示链接图标",
      "en": "Whether to display link icon"
    }
  },
  "articles.style.title_alignment": {
    "label": {
      "zh-CN": "标题对齐方式。left（左）、center（居中）",
      "en": "Title alignment. left, center"
    },
    "description": {
      "zh-CN": "标题对齐方式。left（左）、center（居中）",
      "en": "Title alignment. left, center"
    }
  },
  "articles.toc": {
    "label": {
      "zh-CN": "目录设置",
      "en": "Table of contents settings"
    },
    "description": {
      "zh-CN": "目录设置",
      "en": "Table of contents settings"
    }
  },
  "articles.toc.enable": {
    "label": {
      "zh-CN": "是否启用目录",
      "en": "Whether to enable TOC"
    },
    "description": {
      "zh-CN": "是否启用目录",
      "en": "Whether to enable TOC"
    }
  },
  "articles.toc.expand": {
    "label": {
      "zh-CN": "是否展开目录",
      "en": "Whether to expand TOC"
    },
    "description": {
      "zh-CN": "是否展开目录",
      "en": "Whether to expand TOC"
    }
  },
  "articles.toc.init_open": {
    "label": {
      "zh-CN": "默认打开目录",
      "en": "Open toc by default"
    },
    "description": {
      "zh-CN": "默认打开目录",
      "en": "Open toc by default"
    }
  },
  "articles.toc.max_depth": {
    "label": {
      "zh-CN": "目录深度",
      "en": "TOC depth"
    },
    "description": {
      "zh-CN": "目录深度",
      "en": "TOC depth"
    }
  },
  "articles.toc.number": {
    "label": {
      "zh-CN": "是否自动为目录添加编号",
      "en": "Whether to add number to TOC automatically"
    },
    "description": {
      "zh-CN": "是否自动为目录添加编号",
      "en": "Whether to add number to TOC automatically"
    }
  },
  "articles.word_count": {
    "label": {
      "zh-CN": "字数统计。需要 hexo-wordcount（npm install hexo-wordcount）。参见 https://github.com/willin/hexo-wordcount",
      "en": "Word count. Requires hexo-wordcount (npm install hexo-wordcount). See https://github.com/willin/hexo-wordcount"
    },
    "description": {
      "zh-CN": "字数统计。需要 hexo-wordcount（npm install hexo-wordcount）。参见 https://github.com/willin/hexo-wordcount",
      "en": "Word count. Requires hexo-wordcount (npm install hexo-wordcount). See https://github.com/willin/hexo-wordcount"
    }
  },
  "articles.word_count.count": {
    "label": {
      "zh-CN": "是否显示字数统计",
      "en": "Whether to display word count"
    },
    "description": {
      "zh-CN": "是否显示字数统计",
      "en": "Whether to display word count"
    }
  },
  "articles.word_count.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "articles.word_count.min2read": {
    "label": {
      "zh-CN": "是否显示阅读时间",
      "en": "Whether to display reading time"
    },
    "description": {
      "zh-CN": "是否显示阅读时间",
      "en": "Whether to display reading time"
    }
  },
  "cdn": {
    "label": {
      "zh-CN": "CDN",
      "en": "CDN"
    },
    "description": {
      "zh-CN": "CDN；文档: https://redefine-docs.ohevan.com/cdn",
      "en": "CDN；Docs: https://redefine-docs.ohevan.com/cdn"
    }
  },
  "cdn.custom_url": {
    "label": {
      "zh-CN": "",
      "en": "The ${path} must leads to the root of the \"source\" folder of the theme"
    },
    "description": {
      "zh-CN": "",
      "en": "The ${path} must leads to the root of the \"source\" folder of the theme"
    }
  },
  "cdn.enable": {
    "label": {
      "zh-CN": "停用 CDN",
      "en": "Whether to enable CDN"
    },
    "description": {
      "zh-CN": "停用 CDN",
      "en": "Whether to enable CDN"
    }
  },
  "cdn.provider": {
    "label": {
      "zh-CN": "",
      "en": "CDN Provider"
    },
    "description": {
      "zh-CN": "",
      "en": "CDN Provider；npmmirror, zstatic, cdnjs, jsdelivr, unpkg, custom"
    }
  },
  "colors": {
    "label": {
      "zh-CN": "颜色",
      "en": "COLORS"
    },
    "description": {
      "zh-CN": "颜色；文档: https://redefine-docs.ohevan.com/basic/colors",
      "en": "COLORS；Docs: https://redefine-docs.ohevan.com/basic/colors"
    }
  },
  "colors.default_mode": {
    "label": {
      "zh-CN": "默认主题模式初始值（将被 prefer-color-scheme 覆盖）",
      "en": "Default theme mode initial value (will be overwritten by prefer-color-scheme)"
    },
    "description": {
      "zh-CN": "默认主题模式初始值（将被 prefer-color-scheme 覆盖）；light（浅色）, dark（深色）",
      "en": "Default theme mode initial value (will be overwritten by prefer-color-scheme)；light, dark"
    }
  },
  "colors.primary": {
    "label": {
      "zh-CN": "主色调",
      "en": "Primary color"
    },
    "description": {
      "zh-CN": "主色调",
      "en": "Primary color"
    }
  },
  "colors.secondary": {
    "label": {
      "zh-CN": "次要颜色（待定）",
      "en": "Secondary color (TBD)"
    },
    "description": {
      "zh-CN": "次要颜色（待定）",
      "en": "Secondary color (TBD)"
    }
  },
  "comment": {
    "label": {
      "zh-CN": "评论",
      "en": "COMMENT"
    },
    "description": {
      "zh-CN": "评论；文档: https://redefine-docs.ohevan.com/posts/comment",
      "en": "COMMENT；Docs: https://redefine-docs.ohevan.com/posts/comment"
    }
  },
  "comment.config": {
    "label": {
      "zh-CN": "系统配置",
      "en": "System configuration"
    },
    "description": {
      "zh-CN": "系统配置",
      "en": "System configuration"
    }
  },
  "comment.config.artalk": {
    "label": {
      "zh-CN": "",
      "en": "Artalk comment system. See https://artalk.js.org/"
    },
    "description": {
      "zh-CN": "",
      "en": "Artalk comment system. See https://artalk.js.org/"
    }
  },
  "comment.config.artalk.server": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.artalk.site": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.giscus": {
    "label": {
      "zh-CN": "Giscus 评论系统。参见 https://giscus.app/",
      "en": "Giscus comment system. See https://giscus.app/"
    },
    "description": {
      "zh-CN": "Giscus 评论系统。参见 https://giscus.app/",
      "en": "Giscus comment system. See https://giscus.app/"
    }
  },
  "comment.config.giscus.category": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.giscus.category_id": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.giscus.emit_metadata": {
    "label": {
      "zh-CN": "是否发送元数据。例如 0、1",
      "en": "Whether to emit metadata. e.g. 0, 1"
    },
    "description": {
      "zh-CN": "是否发送元数据。例如 0、1",
      "en": "Whether to emit metadata. e.g. 0, 1"
    }
  },
  "comment.config.giscus.input_position": {
    "label": {
      "zh-CN": "将评论框放在评论上方/下方。例如 top（顶部）、bottom（底部）",
      "en": "Place the comment box above/below the comments. e.g. top, bottom"
    },
    "description": {
      "zh-CN": "将评论框放在评论上方/下方。例如 top（顶部）、bottom（底部）",
      "en": "Place the comment box above/below the comments. e.g. top, bottom"
    }
  },
  "comment.config.giscus.lang": {
    "label": {
      "zh-CN": "Giscus 语言。例如 en、zh-CN、zh-TW",
      "en": "Giscus language. e.g. en, zh-CN, zh-TW"
    },
    "description": {
      "zh-CN": "Giscus 语言。例如 en、zh-CN、zh-TW",
      "en": "Giscus language. e.g. en, zh-CN, zh-TW"
    }
  },
  "comment.config.giscus.loading": {
    "label": {
      "zh-CN": "懒加载评论",
      "en": "Load the comments lazily"
    },
    "description": {
      "zh-CN": "懒加载评论",
      "en": "Load the comments lazily"
    }
  },
  "comment.config.giscus.mapping": {
    "label": {
      "zh-CN": "用作页面唯一标识符的值。例如 pathname、url、title、og:title。启用 PJAX 时不要使用 og:title，因为页面更改时 pjax 不会更新 og:title",
      "en": "Which value to use as the unique identifier for the page. e.g. pathname, url, title, og:title. DO NOT USE og:title WITH PJAX ENABLED since pjax will not update og:title when the page changes"
    },
    "description": {
      "zh-CN": "用作页面唯一标识符的值。例如 pathname、url、title、og:title。启用 PJAX 时不要使用 og:title，因为页面更改时 pjax 不会更新 og:title",
      "en": "Which value to use as the unique identifier for the page. e.g. pathname, url, title, og:title. DO NOT USE og:title WITH PJAX ENABLED since pjax will not update og:title when the page changes"
    }
  },
  "comment.config.giscus.reactions_enabled": {
    "label": {
      "zh-CN": "是否启用反应。例如 0、1",
      "en": "Whether to enable reactions. e.g. 0, 1"
    },
    "description": {
      "zh-CN": "是否启用反应。例如 0、1",
      "en": "Whether to enable reactions. e.g. 0, 1"
    }
  },
  "comment.config.giscus.repo": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.giscus.repo_id": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.giscus.strict": {
    "label": {
      "zh-CN": "是否启用严格模式。例如 0、1",
      "en": "Whether to enable strict mode. e.g. 0, 1"
    },
    "description": {
      "zh-CN": "是否启用严格模式。例如 0、1",
      "en": "Whether to enable strict mode. e.g. 0, 1"
    }
  },
  "comment.config.gitalk": {
    "label": {
      "zh-CN": "Gitalk 评论系统。参见 https://github.com/gitalk/gitalk",
      "en": "Gitalk comment system. See https://github.com/gitalk/gitalk"
    },
    "description": {
      "zh-CN": "Gitalk 评论系统。参见 https://github.com/gitalk/gitalk",
      "en": "Gitalk comment system. See https://github.com/gitalk/gitalk"
    }
  },
  "comment.config.gitalk.clientID": {
    "label": {
      "zh-CN": "GitHub 应用客户端 ID",
      "en": ""
    },
    "description": {
      "zh-CN": "GitHub 应用客户端 ID",
      "en": ""
    }
  },
  "comment.config.gitalk.clientSecret": {
    "label": {
      "zh-CN": "GitHub 应用客户端密钥",
      "en": ""
    },
    "description": {
      "zh-CN": "GitHub 应用客户端密钥",
      "en": ""
    }
  },
  "comment.config.gitalk.owner": {
    "label": {
      "zh-CN": "GitHub 仓库所有者",
      "en": ""
    },
    "description": {
      "zh-CN": "GitHub 仓库所有者",
      "en": ""
    }
  },
  "comment.config.gitalk.proxy": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.gitalk.repo": {
    "label": {
      "zh-CN": "GitHub 仓库",
      "en": ""
    },
    "description": {
      "zh-CN": "GitHub 仓库",
      "en": ""
    }
  },
  "comment.config.twikoo": {
    "label": {
      "zh-CN": "Twikoo 评论系统。参见 https://twikoo.js.org/",
      "en": "Twikoo comment system. See https://twikoo.js.org/"
    },
    "description": {
      "zh-CN": "Twikoo 评论系统。参见 https://twikoo.js.org/",
      "en": "Twikoo comment system. See https://twikoo.js.org/"
    }
  },
  "comment.config.twikoo.region": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.twikoo.server_url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.twikoo.version": {
    "label": {
      "zh-CN": "Twikoo 版本，如果你不知道这是什么，请不要修改",
      "en": "Twikoo version, do not modify if you dont know what it is"
    },
    "description": {
      "zh-CN": "Twikoo 版本，如果你不知道这是什么，请不要修改",
      "en": "Twikoo version, do not modify if you dont know what it is"
    }
  },
  "comment.config.utterances": {
    "label": {
      "zh-CN": "",
      "en": "Utterances comment system. See https://utteranc.es/"
    },
    "description": {
      "zh-CN": "",
      "en": "Utterances comment system. See https://utteranc.es/"
    }
  },
  "comment.config.utterances.issue_number": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.utterances.issue_term": {
    "label": {
      "zh-CN": "",
      "en": "pathname, url, title, og:title (recommended: pathname for single-page mode)"
    },
    "description": {
      "zh-CN": "",
      "en": "pathname, url, title, og:title (recommended: pathname for single-page mode)"
    }
  },
  "comment.config.utterances.label": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.utterances.repo": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.utterances.theme_dark": {
    "label": {
      "zh-CN": "",
      "en": "Dark theme"
    },
    "description": {
      "zh-CN": "",
      "en": "Dark theme"
    }
  },
  "comment.config.utterances.theme_light": {
    "label": {
      "zh-CN": "",
      "en": "Light theme"
    },
    "description": {
      "zh-CN": "",
      "en": "Light theme"
    }
  },
  "comment.config.waline": {
    "label": {
      "zh-CN": "Waline 评论系统。参见 https://waline.js.org/",
      "en": "Waline comment system. See https://waline.js.org/"
    },
    "description": {
      "zh-CN": "Waline 评论系统。参见 https://waline.js.org/",
      "en": "Waline comment system. See https://waline.js.org/"
    }
  },
  "comment.config.waline.emoji": {
    "label": {
      "zh-CN": "Waline 表情，参见 https://waline.js.org/guide/features/emoji.html",
      "en": "Waline emojis, see https://waline.js.org/guide/features/emoji.html"
    },
    "description": {
      "zh-CN": "Waline 表情，参见 https://waline.js.org/guide/features/emoji.html",
      "en": "Waline emojis, see https://waline.js.org/guide/features/emoji.html"
    }
  },
  "comment.config.waline.lang": {
    "label": {
      "zh-CN": "Waline 语言。例如 zh-CN、en-US。参见 https://waline.js.org/guide/client/i18n.html",
      "en": "Waline language. e.g. zh-CN, en-US. See https://waline.js.org/guide/client/i18n.html"
    },
    "description": {
      "zh-CN": "Waline 语言。例如 zh-CN、en-US。参见 https://waline.js.org/guide/client/i18n.html",
      "en": "Waline language. e.g. zh-CN, en-US. See https://waline.js.org/guide/client/i18n.html"
    }
  },
  "comment.config.waline.reaction": {
    "label": {
      "zh-CN": "Waline 反应。参见 https://waline.js.org/reference/client/props.html#reaction",
      "en": "Waline reaction. See https://waline.js.org/reference/client/props.html#reaction"
    },
    "description": {
      "zh-CN": "Waline 反应。参见 https://waline.js.org/reference/client/props.html#reaction",
      "en": "Waline reaction. See https://waline.js.org/reference/client/props.html#reaction"
    }
  },
  "comment.config.waline.recaptchaV3Key": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.config.waline.serverUrl": {
    "label": {
      "zh-CN": "Waline 服务器 URL。例如 https://example.example.com",
      "en": "Waline server URL. e.g. https://example.example.com"
    },
    "description": {
      "zh-CN": "Waline 服务器 URL。例如 https://example.example.com",
      "en": "Waline server URL. e.g. https://example.example.com"
    }
  },
  "comment.config.waline.turnstileKey": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "comment.enable": {
    "label": {
      "zh-CN": "是否启用评论",
      "en": "Whether to enable comment"
    },
    "description": {
      "zh-CN": "是否启用评论",
      "en": "Whether to enable comment"
    }
  },
  "comment.system": {
    "label": {
      "zh-CN": "评论系统",
      "en": "Comment system"
    },
    "description": {
      "zh-CN": "评论系统；waline、gitalk、twikoo、giscus",
      "en": "Comment system；waline, gitalk, twikoo, giscus, utterances, artalk"
    }
  },
  "defaults": {
    "label": {
      "zh-CN": "图片配置",
      "en": "IMAGE CONFIGURATION"
    },
    "description": {
      "zh-CN": "图片配置；文档: https://redefine-docs.ohevan.com/basic/defaults",
      "en": "IMAGE CONFIGURATION；Docs: https://redefine-docs.ohevan.com/basic/defaults"
    }
  },
  "defaults.avatar": {
    "label": {
      "zh-CN": "网站头像",
      "en": "Site avatar"
    },
    "description": {
      "zh-CN": "网站头像",
      "en": "Site avatar"
    }
  },
  "defaults.favicon": {
    "label": {
      "zh-CN": "网站图标",
      "en": "Favicon"
    },
    "description": {
      "zh-CN": "网站图标",
      "en": "Favicon"
    }
  },
  "defaults.logo": {
    "label": {
      "zh-CN": "网站 logo",
      "en": "Site logo"
    },
    "description": {
      "zh-CN": "网站 logo",
      "en": "Site logo"
    }
  },
  "developer": {
    "label": {
      "zh-CN": "开发者模式",
      "en": "DEVELOPER MODE"
    },
    "description": {
      "zh-CN": "开发者模式；文档: https://redefine-docs.ohevan.com/developer",
      "en": "DEVELOPER MODE；Docs: https://redefine-docs.ohevan.com/developer"
    }
  },
  "developer.enable": {
    "label": {
      "zh-CN": "是否启用开发者模式（仅适用于想要修改主题源代码的开发者，不适用于普通用户）",
      "en": "Whether to enable developer mode (only for developers who want to modify the theme source code, not for ordinary users)"
    },
    "description": {
      "zh-CN": "是否启用开发者模式（仅适用于想要修改主题源代码的开发者，不适用于普通用户）",
      "en": "Whether to enable developer mode (only for developers who want to modify the theme source code, not for ordinary users)"
    }
  },
  "fontawesome": {
    "label": {
      "zh-CN": "FONTAWESOME",
      "en": "FONTAWESOME"
    },
    "description": {
      "zh-CN": "FONTAWESOME；文档: https://redefine-docs.ohevan.com/basic/fontawesome",
      "en": "FONTAWESOME；Docs: https://redefine-docs.ohevan.com/basic/fontawesome"
    }
  },
  "fontawesome.duotone": {
    "label": {
      "zh-CN": "Duotone 版本",
      "en": "Duotone version"
    },
    "description": {
      "zh-CN": "Duotone 版本",
      "en": "Duotone version"
    }
  },
  "fontawesome.light": {
    "label": {
      "zh-CN": "Light 版本",
      "en": "Light version"
    },
    "description": {
      "zh-CN": "Light 版本",
      "en": "Light version"
    }
  },
  "fontawesome.sharp_solid": {
    "label": {
      "zh-CN": "Sharp Solid 版本",
      "en": "Sharp Solid version"
    },
    "description": {
      "zh-CN": "Sharp Solid 版本",
      "en": "Sharp Solid version"
    }
  },
  "fontawesome.thin": {
    "label": {
      "zh-CN": "Thin 版本",
      "en": "Thin version"
    },
    "description": {
      "zh-CN": "Thin 版本",
      "en": "Thin version"
    }
  },
  "footer": {
    "label": {
      "zh-CN": "页脚",
      "en": "FOOTER"
    },
    "description": {
      "zh-CN": "页脚；文档: https://redefine-docs.ohevan.com/footer",
      "en": "FOOTER；Docs: https://redefine-docs.ohevan.com/footer"
    }
  },
  "footer.customize": {
    "label": {
      "zh-CN": "页脚消息",
      "en": "Footer message"
    },
    "description": {
      "zh-CN": "页脚消息",
      "en": "Footer message"
    }
  },
  "footer.icon": {
    "label": {
      "zh-CN": "页脚图标，在此处写入 fontawesome 图标代码",
      "en": "Icon in footer, write fontawesome icon code here"
    },
    "description": {
      "zh-CN": "页脚图标，在此处写入 fontawesome 图标代码；f54545\"></i>'",
      "en": "Icon in footer, write fontawesome icon code here；f54545\"></i>'"
    }
  },
  "footer.icp": {
    "label": {
      "zh-CN": "ICP 备案号。参见 https://beian.miit.gov.cn/",
      "en": "ICP record number. See https://beian.miit.gov.cn/"
    },
    "description": {
      "zh-CN": "ICP 备案号。参见 https://beian.miit.gov.cn/",
      "en": "ICP record number. See https://beian.miit.gov.cn/"
    }
  },
  "footer.icp.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "footer.icp.number": {
    "label": {
      "zh-CN": "ICP 备案号",
      "en": ""
    },
    "description": {
      "zh-CN": "ICP 备案号",
      "en": ""
    }
  },
  "footer.icp.url": {
    "label": {
      "zh-CN": "ICP 备案 URL",
      "en": ""
    },
    "description": {
      "zh-CN": "ICP 备案 URL",
      "en": ""
    }
  },
  "footer.runtime": {
    "label": {
      "zh-CN": "显示网站运行时间",
      "en": "Show website running time"
    },
    "description": {
      "zh-CN": "显示网站运行时间；是否显示网站运行时间",
      "en": "Show website running time；show website running time or not"
    }
  },
  "footer.start": {
    "label": {
      "zh-CN": "网站开始时间，格式：YYYY/MM/DD HH:mm:ss",
      "en": "The start time of the website, format: YYYY/MM/DD HH:mm:ss"
    },
    "description": {
      "zh-CN": "网站开始时间，格式：YYYY/MM/DD HH:mm:ss",
      "en": "The start time of the website, format: YYYY/MM/DD HH:mm:ss"
    }
  },
  "footer.statistics": {
    "label": {
      "zh-CN": "网站统计",
      "en": "Site statistics"
    },
    "description": {
      "zh-CN": "网站统计；是否显示网站统计（总文章数、总字数）",
      "en": "Site statistics；show site statistics or not (total articles, total words)"
    }
  },
  "global": {
    "label": {
      "zh-CN": "网站自定义",
      "en": "SITE CUSTOMIZATION"
    },
    "description": {
      "zh-CN": "网站自定义；文档: https://redefine-docs.ohevan.com/basic/global",
      "en": "SITE CUSTOMIZATION；Docs: https://redefine-docs.ohevan.com/basic/global"
    }
  },
  "global.content_max_width": {
    "label": {
      "zh-CN": "内容最大宽度",
      "en": "Content max width"
    },
    "description": {
      "zh-CN": "内容最大宽度",
      "en": "Content max width"
    }
  },
  "global.fonts": {
    "label": {
      "zh-CN": "自定义全局字体",
      "en": "Custom global fonts"
    },
    "description": {
      "zh-CN": "自定义全局字体",
      "en": "Custom global fonts"
    }
  },
  "global.fonts.chinese": {
    "label": {
      "zh-CN": "中文字体",
      "en": "Chinese fonts"
    },
    "description": {
      "zh-CN": "中文字体",
      "en": "Chinese fonts"
    }
  },
  "global.fonts.chinese.enable": {
    "label": {
      "zh-CN": "是否启用自定义中文字体",
      "en": "Whether to enable custom chinese fonts"
    },
    "description": {
      "zh-CN": "是否启用自定义中文字体",
      "en": "Whether to enable custom chinese fonts"
    }
  },
  "global.fonts.chinese.family": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.fonts.chinese.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.fonts.english": {
    "label": {
      "zh-CN": "英文字体",
      "en": "English fonts"
    },
    "description": {
      "zh-CN": "英文字体",
      "en": "English fonts"
    }
  },
  "global.fonts.english.enable": {
    "label": {
      "zh-CN": "是否启用自定义英文字体",
      "en": "Whether to enable custom english fonts"
    },
    "description": {
      "zh-CN": "是否启用自定义英文字体",
      "en": "Whether to enable custom english fonts"
    }
  },
  "global.fonts.english.family": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.fonts.english.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.fonts.title": {
    "label": {
      "zh-CN": "自定义标题字体（导航栏、侧边栏）",
      "en": "Custom title fonts (navbar, sidebar)"
    },
    "description": {
      "zh-CN": "自定义标题字体（导航栏、侧边栏）",
      "en": "Custom title fonts (navbar, sidebar)"
    }
  },
  "global.fonts.title.enable": {
    "label": {
      "zh-CN": "是否启用自定义标题字体",
      "en": "Whether to enable custom title fonts"
    },
    "description": {
      "zh-CN": "是否启用自定义标题字体",
      "en": "Whether to enable custom title fonts"
    }
  },
  "global.fonts.title.family": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.fonts.title.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.google_analytics": {
    "label": {
      "zh-CN": "Google Analytics",
      "en": "Google Analytics"
    },
    "description": {
      "zh-CN": "Google Analytics",
      "en": "Google Analytics"
    }
  },
  "global.google_analytics.enable": {
    "label": {
      "zh-CN": "是否启用 Google Analytics",
      "en": "Whether to enable Google Analytics"
    },
    "description": {
      "zh-CN": "是否启用 Google Analytics",
      "en": "Whether to enable Google Analytics"
    }
  },
  "global.google_analytics.id": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.hover": {
    "label": {
      "zh-CN": "鼠标悬停效果",
      "en": "Effects on mouse hover"
    },
    "description": {
      "zh-CN": "鼠标悬停效果",
      "en": "Effects on mouse hover"
    }
  },
  "global.hover.scale": {
    "label": {
      "zh-CN": "缩放效果",
      "en": "scale effect"
    },
    "description": {
      "zh-CN": "缩放效果",
      "en": "scale effect"
    }
  },
  "global.hover.shadow": {
    "label": {
      "zh-CN": "阴影效果",
      "en": "shadow effect"
    },
    "description": {
      "zh-CN": "阴影效果",
      "en": "shadow effect"
    }
  },
  "global.open_graph": {
    "label": {
      "zh-CN": "是否启用开放图谱",
      "en": "Whether to enable open graph"
    },
    "description": {
      "zh-CN": "是否启用开放图谱",
      "en": "Whether to enable open graph"
    }
  },
  "global.open_graph.description": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.open_graph.enable": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.open_graph.image": {
    "label": {
      "zh-CN": "默认 og:image",
      "en": "default og:image"
    },
    "description": {
      "zh-CN": "默认 og:image",
      "en": "default og:image"
    }
  },
  "global.preloader": {
    "label": {
      "zh-CN": "是否启用预加载器",
      "en": "Whether to enable Preloader."
    },
    "description": {
      "zh-CN": "是否启用预加载器",
      "en": "Whether to enable Preloader."
    }
  },
  "global.preloader.custom_message": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.preloader.enable": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "global.scroll_progress": {
    "label": {
      "zh-CN": "滚动进度",
      "en": "Scroll progress"
    },
    "description": {
      "zh-CN": "滚动进度",
      "en": "Scroll progress"
    }
  },
  "global.scroll_progress.bar": {
    "label": {
      "zh-CN": "进度条",
      "en": "progress bar"
    },
    "description": {
      "zh-CN": "进度条",
      "en": "progress bar"
    }
  },
  "global.scroll_progress.percentage": {
    "label": {
      "zh-CN": "百分比",
      "en": "percentage"
    },
    "description": {
      "zh-CN": "百分比",
      "en": "percentage"
    }
  },
  "global.side_tools": {
    "label": {
      "zh-CN": "侧边工具设置",
      "en": "Side tools settings"
    },
    "description": {
      "zh-CN": "侧边工具设置",
      "en": "Side tools settings"
    }
  },
  "global.side_tools.auto_expand": {
    "label": {
      "zh-CN": "页面加载时是否自动展开工具列表",
      "en": "Whether to auto expand tools list on page load"
    },
    "description": {
      "zh-CN": "页面加载时是否自动展开工具列表",
      "en": "Whether to auto expand tools list on page load"
    }
  },
  "global.side_tools.gear_rotation": {
    "label": {
      "zh-CN": "是否为设置按钮启用齿轮旋转动画",
      "en": "Whether to enable gear rotation animation for settings button"
    },
    "description": {
      "zh-CN": "是否为设置按钮启用齿轮旋转动画",
      "en": "Whether to enable gear rotation animation for settings button"
    }
  },
  "global.sidebar_width": {
    "label": {
      "zh-CN": "侧边栏宽度",
      "en": "Sidebar width"
    },
    "description": {
      "zh-CN": "侧边栏宽度",
      "en": "Sidebar width"
    }
  },
  "global.single_page": {
    "label": {
      "zh-CN": "是否启用单页面体验（使用 swup）。参见 https://swup.js.org/。类似于 pjax",
      "en": "Whether to enable single page experience (using swup). See https://swup.js.org/. similar to pjax"
    },
    "description": {
      "zh-CN": "是否启用单页面体验（使用 swup）。参见 https://swup.js.org/。类似于 pjax",
      "en": "Whether to enable single page experience (using swup). See https://swup.js.org/. similar to pjax"
    }
  },
  "global.website_counter": {
    "label": {
      "zh-CN": "网站计数器",
      "en": "Website counter"
    },
    "description": {
      "zh-CN": "网站计数器",
      "en": "Website counter"
    }
  },
  "global.website_counter.enable": {
    "label": {
      "zh-CN": "是否启用网站计数器",
      "en": "enable website counter or not"
    },
    "description": {
      "zh-CN": "是否启用网站计数器",
      "en": "enable website counter or not"
    }
  },
  "global.website_counter.post_pv": {
    "label": {
      "zh-CN": "文章浏览量",
      "en": "post page view"
    },
    "description": {
      "zh-CN": "文章浏览量",
      "en": "post page view"
    }
  },
  "global.website_counter.site_pv": {
    "label": {
      "zh-CN": "网站浏览量",
      "en": "site page view"
    },
    "description": {
      "zh-CN": "网站浏览量",
      "en": "site page view"
    }
  },
  "global.website_counter.site_uv": {
    "label": {
      "zh-CN": "网站访客数",
      "en": "site unique visitor"
    },
    "description": {
      "zh-CN": "网站访客数",
      "en": "site unique visitor"
    }
  },
  "global.website_counter.url": {
    "label": {
      "zh-CN": "计数器 API URL（无需更改）",
      "en": "counter API URL (no need to change)"
    },
    "description": {
      "zh-CN": "计数器 API URL（无需更改）",
      "en": "counter API URL (no need to change)"
    }
  },
  "home": {
    "label": {
      "zh-CN": "首页文章设置",
      "en": "HOME PAGE ARTICLE SETTINGS"
    },
    "description": {
      "zh-CN": "首页文章设置；文档: https://redefine-docs.ohevan.com/home/home",
      "en": "HOME PAGE ARTICLE SETTINGS；Docs: https://redefine-docs.ohevan.com/home/home"
    }
  },
  "home.article_date_format": {
    "label": {
      "zh-CN": "文章日期格式",
      "en": "Article date format"
    },
    "description": {
      "zh-CN": "文章日期格式；auto（自动）、relative（相对）、YYYY-MM-DD、YYYY-MM-DD HH:mm:ss 等",
      "en": "Article date format；auto, relative, YYYY-MM-DD, YYYY-MM-DD HH:mm:ss etc."
    }
  },
  "home.categories": {
    "label": {
      "zh-CN": "文章分类可见性",
      "en": "Article categories visibility"
    },
    "description": {
      "zh-CN": "文章分类可见性",
      "en": "Article categories visibility"
    }
  },
  "home.categories.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "home.categories.limit": {
    "label": {
      "zh-CN": "显示的最大分类数",
      "en": "Max number of categories to display"
    },
    "description": {
      "zh-CN": "显示的最大分类数",
      "en": "Max number of categories to display"
    }
  },
  "home.excerpt_length": {
    "label": {
      "zh-CN": "文章摘要长度",
      "en": "Article excerpt length"
    },
    "description": {
      "zh-CN": "文章摘要长度；文章摘要最大长度",
      "en": "Article excerpt length；Max length of article excerpt"
    }
  },
  "home.sidebar": {
    "label": {
      "zh-CN": "侧边栏设置",
      "en": "Sidebar settings"
    },
    "description": {
      "zh-CN": "侧边栏设置",
      "en": "Sidebar settings"
    }
  },
  "home.sidebar.announcement": {
    "label": {
      "zh-CN": "公告文本",
      "en": ""
    },
    "description": {
      "zh-CN": "公告文本",
      "en": ""
    }
  },
  "home.sidebar.enable": {
    "label": {
      "zh-CN": "是否启用侧边栏",
      "en": "Whether to enable sidebar"
    },
    "description": {
      "zh-CN": "是否启用侧边栏",
      "en": "Whether to enable sidebar"
    }
  },
  "home.sidebar.first_item": {
    "label": {
      "zh-CN": "侧边栏第一项。menu（菜单）、info（信息）",
      "en": "First item in sidebar. menu, info"
    },
    "description": {
      "zh-CN": "侧边栏第一项。menu（菜单）、info（信息）",
      "en": "First item in sidebar. menu, info"
    }
  },
  "home.sidebar.links": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home.sidebar.links.RSS": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home.sidebar.links.RSS.icon": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home.sidebar.links.RSS.path": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home.sidebar.links.icon": {
    "label": {
      "zh-CN": "可以为空",
      "en": ""
    },
    "description": {
      "zh-CN": "可以为空",
      "en": ""
    }
  },
  "home.sidebar.links.path": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home.sidebar.position": {
    "label": {
      "zh-CN": "侧边栏位置。left（左）、right（右）",
      "en": "Sidebar position. left, right"
    },
    "description": {
      "zh-CN": "侧边栏位置。left（左）、right（右）",
      "en": "Sidebar position. left, right"
    }
  },
  "home.sidebar.show_on_mobile": {
    "label": {
      "zh-CN": "是否在移动端展开菜单中显示侧边栏导航",
      "en": "Whether to show sidebar navigation on mobile sheet menu"
    },
    "description": {
      "zh-CN": "是否在移动端展开菜单中显示侧边栏导航",
      "en": "Whether to show sidebar navigation on mobile sheet menu"
    }
  },
  "home.tags": {
    "label": {
      "zh-CN": "文章标签可见性",
      "en": "Article tags visibility"
    },
    "description": {
      "zh-CN": "文章标签可见性",
      "en": "Article tags visibility"
    }
  },
  "home.tags.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "home.tags.limit": {
    "label": {
      "zh-CN": "显示的最大标签数",
      "en": "Max number of tags to display"
    },
    "description": {
      "zh-CN": "显示的最大标签数",
      "en": "Max number of tags to display"
    }
  },
  "home_banner": {
    "label": {
      "zh-CN": "首页横幅",
      "en": "HOME BANNER"
    },
    "description": {
      "zh-CN": "首页横幅；文档: https://redefine-docs.ohevan.com/home/home_banner",
      "en": "HOME BANNER；Docs: https://redefine-docs.ohevan.com/home/home_banner"
    }
  },
  "home_banner.custom_font": {
    "label": {
      "zh-CN": "首页横幅自定义字体",
      "en": "Home banner custom font"
    },
    "description": {
      "zh-CN": "首页横幅自定义字体",
      "en": "Home banner custom font"
    }
  },
  "home_banner.custom_font.enable": {
    "label": {
      "zh-CN": "是否启用自定义字体",
      "en": "Whether to enable custom font"
    },
    "description": {
      "zh-CN": "是否启用自定义字体",
      "en": "Whether to enable custom font"
    }
  },
  "home_banner.custom_font.family": {
    "label": {
      "zh-CN": "字体族",
      "en": "Font family"
    },
    "description": {
      "zh-CN": "字体族",
      "en": "Font family"
    }
  },
  "home_banner.custom_font.url": {
    "label": {
      "zh-CN": "字体 CSS 文件 URL",
      "en": "URL to font CSS file"
    },
    "description": {
      "zh-CN": "字体 CSS 文件 URL",
      "en": "URL to font CSS file"
    }
  },
  "home_banner.enable": {
    "label": {
      "zh-CN": "是否启用首页横幅",
      "en": "Whether to enable home banner"
    },
    "description": {
      "zh-CN": "是否启用首页横幅",
      "en": "Whether to enable home banner"
    }
  },
  "home_banner.image": {
    "label": {
      "zh-CN": "首页横幅图片",
      "en": "Home banner image"
    },
    "description": {
      "zh-CN": "首页横幅图片",
      "en": "Home banner image"
    }
  },
  "home_banner.image.dark": {
    "label": {
      "zh-CN": "深色模式",
      "en": "dark mode"
    },
    "description": {
      "zh-CN": "深色模式",
      "en": "dark mode"
    }
  },
  "home_banner.image.light": {
    "label": {
      "zh-CN": "浅色模式",
      "en": "light mode"
    },
    "description": {
      "zh-CN": "浅色模式",
      "en": "light mode"
    }
  },
  "home_banner.social_links": {
    "label": {
      "zh-CN": "首页横幅社交链接",
      "en": "Home banner social links"
    },
    "description": {
      "zh-CN": "首页横幅社交链接",
      "en": "Home banner social links"
    }
  },
  "home_banner.social_links.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "home_banner.social_links.links": {
    "label": {
      "zh-CN": "社交链接",
      "en": "Social links"
    },
    "description": {
      "zh-CN": "社交链接",
      "en": "Social links"
    }
  },
  "home_banner.social_links.links.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home_banner.social_links.qrs": {
    "label": {
      "zh-CN": "带二维码抽屉的社交链接",
      "en": "Social links with QRcode drawers"
    },
    "description": {
      "zh-CN": "带二维码抽屉的社交链接",
      "en": "Social links with QRcode drawers"
    }
  },
  "home_banner.social_links.qrs.name": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home_banner.social_links.qrs.qr": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home_banner.social_links.qrs.qrcode": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home_banner.social_links.style": {
    "label": {
      "zh-CN": "社交链接样式",
      "en": "Social links style"
    },
    "description": {
      "zh-CN": "社交链接样式；default（默认）、reverse（反向）、center（居中）",
      "en": "Social links style；default, reverse, center"
    }
  },
  "home_banner.style": {
    "label": {
      "zh-CN": "首页横幅样式",
      "en": "style of home banner"
    },
    "description": {
      "zh-CN": "首页横幅样式；static（静态）或 fixed（固定）",
      "en": "style of home banner；static or fixed"
    }
  },
  "home_banner.subtitle": {
    "label": {
      "zh-CN": "首页横幅副标题",
      "en": "Home banner subtitle"
    },
    "description": {
      "zh-CN": "首页横幅副标题",
      "en": "Home banner subtitle"
    }
  },
  "home_banner.subtitle.backing_delay": {
    "label": {
      "zh-CN": "退格延迟（毫秒）",
      "en": "Backing delay (ms)"
    },
    "description": {
      "zh-CN": "退格延迟（毫秒）",
      "en": "Backing delay (ms)"
    }
  },
  "home_banner.subtitle.backing_speed": {
    "label": {
      "zh-CN": "退格速度（毫秒）",
      "en": "Backing speed (ms)"
    },
    "description": {
      "zh-CN": "退格速度（毫秒）",
      "en": "Backing speed (ms)"
    }
  },
  "home_banner.subtitle.hitokoto": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "home_banner.subtitle.hitokoto.api": {
    "label": {
      "zh-CN": "API URL，可以添加类型，参见 https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0",
      "en": "API URL, can add types, see https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0"
    },
    "description": {
      "zh-CN": "API URL，可以添加类型，参见 https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0",
      "en": "API URL, can add types, see https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0"
    }
  },
  "home_banner.subtitle.hitokoto.enable": {
    "label": {
      "zh-CN": "是否启用一言",
      "en": "Whether to enable hitokoto"
    },
    "description": {
      "zh-CN": "是否启用一言",
      "en": "Whether to enable hitokoto"
    }
  },
  "home_banner.subtitle.hitokoto.show_author": {
    "label": {
      "zh-CN": "是否显示作者",
      "en": "Whether to show author"
    },
    "description": {
      "zh-CN": "是否显示作者",
      "en": "Whether to show author"
    }
  },
  "home_banner.subtitle.loop": {
    "label": {
      "zh-CN": "是否循环",
      "en": "Whether to loop"
    },
    "description": {
      "zh-CN": "是否循环",
      "en": "Whether to loop"
    }
  },
  "home_banner.subtitle.smart_backspace": {
    "label": {
      "zh-CN": "是否智能退格",
      "en": "Whether to smart backspace"
    },
    "description": {
      "zh-CN": "是否智能退格",
      "en": "Whether to smart backspace"
    }
  },
  "home_banner.subtitle.starting_delay": {
    "label": {
      "zh-CN": "开始延迟（毫秒）",
      "en": "Start delay (ms)"
    },
    "description": {
      "zh-CN": "开始延迟（毫秒）",
      "en": "Start delay (ms)"
    }
  },
  "home_banner.subtitle.text": {
    "label": {
      "zh-CN": "副标题文本，数组",
      "en": "subtitle text, array"
    },
    "description": {
      "zh-CN": "副标题文本，数组",
      "en": "subtitle text, array"
    }
  },
  "home_banner.subtitle.typing_speed": {
    "label": {
      "zh-CN": "打字速度（毫秒）",
      "en": "Typing speed (ms)"
    },
    "description": {
      "zh-CN": "打字速度（毫秒）",
      "en": "Typing speed (ms)"
    }
  },
  "home_banner.text_color": {
    "label": {
      "zh-CN": "首页横幅文本颜色",
      "en": "Color of home banner text"
    },
    "description": {
      "zh-CN": "首页横幅文本颜色",
      "en": "Color of home banner text"
    }
  },
  "home_banner.text_color.dark": {
    "label": {
      "zh-CN": "深色模式",
      "en": "dark mode"
    },
    "description": {
      "zh-CN": "深色模式",
      "en": "dark mode"
    }
  },
  "home_banner.text_color.light": {
    "label": {
      "zh-CN": "浅色模式",
      "en": "light mode"
    },
    "description": {
      "zh-CN": "浅色模式",
      "en": "light mode"
    }
  },
  "home_banner.text_style": {
    "label": {
      "zh-CN": "文本的特定样式",
      "en": "Specific style of the text"
    },
    "description": {
      "zh-CN": "文本的特定样式",
      "en": "Specific style of the text"
    }
  },
  "home_banner.text_style.line_height": {
    "label": {
      "zh-CN": "标题和副标题之间的行高",
      "en": "Line height between title and subtitle"
    },
    "description": {
      "zh-CN": "标题和副标题之间的行高",
      "en": "Line height between title and subtitle"
    }
  },
  "home_banner.text_style.subtitle_size": {
    "label": {
      "zh-CN": "副标题字体大小",
      "en": "Subtitle font size"
    },
    "description": {
      "zh-CN": "副标题字体大小",
      "en": "Subtitle font size"
    }
  },
  "home_banner.text_style.title_size": {
    "label": {
      "zh-CN": "标题字体大小",
      "en": "Title font size"
    },
    "description": {
      "zh-CN": "标题字体大小",
      "en": "Title font size"
    }
  },
  "home_banner.title": {
    "label": {
      "zh-CN": "首页横幅标题",
      "en": "Home banner title"
    },
    "description": {
      "zh-CN": "首页横幅标题",
      "en": "Home banner title"
    }
  },
  "info": {
    "label": {
      "zh-CN": "基本信息",
      "en": "BASIC INFORMATION"
    },
    "description": {
      "zh-CN": "基本信息；文档: https://redefine-docs.ohevan.com/basic/info",
      "en": "BASIC INFORMATION；Docs: https://redefine-docs.ohevan.com/basic/info"
    }
  },
  "info.author": {
    "label": {
      "zh-CN": "作者名称",
      "en": "Author name"
    },
    "description": {
      "zh-CN": "作者名称",
      "en": "Author name"
    }
  },
  "info.subtitle": {
    "label": {
      "zh-CN": "网站副标题",
      "en": "Site subtitle"
    },
    "description": {
      "zh-CN": "网站副标题",
      "en": "Site subtitle"
    }
  },
  "info.title": {
    "label": {
      "zh-CN": "网站标题",
      "en": "Site title"
    },
    "description": {
      "zh-CN": "网站标题",
      "en": "Site title"
    }
  },
  "info.url": {
    "label": {
      "zh-CN": "网站 URL",
      "en": "Site URL"
    },
    "description": {
      "zh-CN": "网站 URL",
      "en": "Site URL"
    }
  },
  "inject": {
    "label": {
      "zh-CN": "注入",
      "en": "INJECT"
    },
    "description": {
      "zh-CN": "注入；文档: https://redefine-docs.ohevan.com/inject",
      "en": "INJECT；Docs: https://redefine-docs.ohevan.com/inject"
    }
  },
  "inject.enable": {
    "label": {
      "zh-CN": "是否启用注入",
      "en": "Whether to enable inject"
    },
    "description": {
      "zh-CN": "是否启用注入",
      "en": "Whether to enable inject"
    }
  },
  "inject.footer": {
    "label": {
      "zh-CN": "注入自定义页脚 HTML 代码",
      "en": "Inject custom footer html code"
    },
    "description": {
      "zh-CN": "注入自定义页脚 HTML 代码",
      "en": "Inject custom footer html code"
    }
  },
  "inject.head": {
    "label": {
      "zh-CN": "注入自定义头部 HTML 代码",
      "en": "Inject custom head html code"
    },
    "description": {
      "zh-CN": "注入自定义头部 HTML 代码",
      "en": "Inject custom head html code"
    }
  },
  "navbar": {
    "label": {
      "zh-CN": "导航栏",
      "en": "NAVIGATION BAR"
    },
    "description": {
      "zh-CN": "导航栏；文档: https://redefine-docs.ohevan.com/home/navbar",
      "en": "NAVIGATION BAR；Docs: https://redefine-docs.ohevan.com/home/navbar"
    }
  },
  "navbar.auto_hide": {
    "label": {
      "zh-CN": "自动隐藏导航栏",
      "en": "Auto hide navbar"
    },
    "description": {
      "zh-CN": "自动隐藏导航栏",
      "en": "Auto hide navbar"
    }
  },
  "navbar.color": {
    "label": {
      "zh-CN": "导航栏背景颜色",
      "en": "Navbar background color"
    },
    "description": {
      "zh-CN": "导航栏背景颜色",
      "en": "Navbar background color"
    }
  },
  "navbar.color.left": {
    "label": {
      "zh-CN": "左侧",
      "en": "left side"
    },
    "description": {
      "zh-CN": "左侧",
      "en": "left side"
    }
  },
  "navbar.color.right": {
    "label": {
      "zh-CN": "右侧",
      "en": "right side"
    },
    "description": {
      "zh-CN": "右侧",
      "en": "right side"
    }
  },
  "navbar.color.transparency": {
    "label": {
      "zh-CN": "百分比（10-99）",
      "en": "percent (10-99)"
    },
    "description": {
      "zh-CN": "百分比（10-99）",
      "en": "percent (10-99)"
    }
  },
  "navbar.links": {
    "label": {
      "zh-CN": "导航栏链接",
      "en": "Navbar links"
    },
    "description": {
      "zh-CN": "导航栏链接",
      "en": "Navbar links"
    }
  },
  "navbar.links.About": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.About.icon": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.About.path": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.Archives": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.Archives.icon": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.Archives.path": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.Home": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.links.Home.icon": {
    "label": {
      "zh-CN": "可以为空",
      "en": "can be empty"
    },
    "description": {
      "zh-CN": "可以为空",
      "en": "can be empty"
    }
  },
  "navbar.links.Home.path": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "navbar.search": {
    "label": {
      "zh-CN": "导航栏搜索（本地搜索）。需要 hexo-generator-searchdb（npm i hexo-generator-searchdb）。参见 https://github.com/theme-next/hexo-generator-searchdb",
      "en": "Navbar search (local search). Requires hexo-generator-searchdb (npm i hexo-generator-searchdb). See https://github.com/theme-next/hexo-generator-searchdb"
    },
    "description": {
      "zh-CN": "导航栏搜索（本地搜索）。需要 hexo-generator-searchdb（npm i hexo-generator-searchdb）。参见 https://github.com/theme-next/hexo-generator-searchdb",
      "en": "Navbar search (local search). Requires hexo-generator-searchdb (npm i hexo-generator-searchdb). See https://github.com/theme-next/hexo-generator-searchdb"
    }
  },
  "navbar.search.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "navbar.search.preload": {
    "label": {
      "zh-CN": "页面加载时预加载搜索数据",
      "en": "Preload search data when the page loads"
    },
    "description": {
      "zh-CN": "页面加载时预加载搜索数据",
      "en": "Preload search data when the page loads"
    }
  },
  "navbar.width": {
    "label": {
      "zh-CN": "导航栏宽度（通常无需修改）",
      "en": "Navbar width (usually no need to modify)"
    },
    "description": {
      "zh-CN": "导航栏宽度（通常无需修改）",
      "en": "Navbar width (usually no need to modify)"
    }
  },
  "navbar.width.home": {
    "label": {
      "zh-CN": "首页",
      "en": "home page"
    },
    "description": {
      "zh-CN": "首页",
      "en": "home page"
    }
  },
  "navbar.width.pages": {
    "label": {
      "zh-CN": "其他页面",
      "en": "other pages"
    },
    "description": {
      "zh-CN": "其他页面",
      "en": "other pages"
    }
  },
  "page_templates": {
    "label": {
      "zh-CN": "页面模板",
      "en": "PAGE TEMPLATES"
    },
    "description": {
      "zh-CN": "页面模板；文档: https://redefine-docs.ohevan.com/page_templates",
      "en": "PAGE TEMPLATES；Docs: https://redefine-docs.ohevan.com/page_templates"
    }
  },
  "page_templates.friends_column": {
    "label": {
      "zh-CN": "友情链接页面列数",
      "en": "Friend Links page column number"
    },
    "description": {
      "zh-CN": "友情链接页面列数",
      "en": "Friend Links page column number"
    }
  },
  "page_templates.masonry": {
    "label": {
      "zh-CN": "",
      "en": "Masonry page batch size"
    },
    "description": {
      "zh-CN": "",
      "en": "Masonry page batch size"
    }
  },
  "page_templates.masonry.batch_size": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "page_templates.masonry.initial_batch_size": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "page_templates.tags_style": {
    "label": {
      "zh-CN": "标签页面样式",
      "en": "Tags page style"
    },
    "description": {
      "zh-CN": "标签页面样式；blur（模糊）、cloud（云）",
      "en": "Tags page style；blur, cloud"
    }
  },
  "plugins": {
    "label": {
      "zh-CN": "插件",
      "en": "PLUGINS"
    },
    "description": {
      "zh-CN": "插件；文档: https://redefine-docs.ohevan.com/plugins",
      "en": "PLUGINS；Docs: https://redefine-docs.ohevan.com/plugins"
    }
  },
  "plugins.aplayer": {
    "label": {
      "zh-CN": "Aplayer。参见 https://github.com/DIYgod/APlayer",
      "en": "Aplayer. See https://github.com/DIYgod/APlayer"
    },
    "description": {
      "zh-CN": "Aplayer。参见 https://github.com/DIYgod/APlayer",
      "en": "Aplayer. See https://github.com/DIYgod/APlayer"
    }
  },
  "plugins.aplayer.audios": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.aplayer.audios.artist": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.aplayer.audios.cover": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.aplayer.audios.lrc": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.aplayer.audios.url": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.aplayer.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "plugins.aplayer.type": {
    "label": {
      "zh-CN": "fixed（固定）、mini（迷你）",
      "en": "fixed, mini"
    },
    "description": {
      "zh-CN": "fixed（固定）、mini（迷你）",
      "en": "fixed, mini"
    }
  },
  "plugins.feed": {
    "label": {
      "zh-CN": "RSS 订阅。需要 hexo-generator-feed（npm i hexo-generator-feed）。参见 https://github.com/hexojs/hexo-generator-feed",
      "en": "RSS feed. Requires hexo-generator-feed (npm i hexo-generator-feed). See https://github.com/hexojs/hexo-generator-feed"
    },
    "description": {
      "zh-CN": "RSS 订阅。需要 hexo-generator-feed（npm i hexo-generator-feed）。参见 https://github.com/hexojs/hexo-generator-feed",
      "en": "RSS feed. Requires hexo-generator-feed (npm i hexo-generator-feed). See https://github.com/hexojs/hexo-generator-feed"
    }
  },
  "plugins.feed.enable": {
    "label": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    },
    "description": {
      "zh-CN": "是否启用",
      "en": "Whether to enable"
    }
  },
  "plugins.mermaid": {
    "label": {
      "zh-CN": "Mermaid JS。需要 hexo-filter-mermaid-diagrams（npm i hexo-filter-mermaid-diagrams）。参见 https://mermaid.js.org/",
      "en": "Mermaid JS. Requires hexo-filter-mermaid-diagrams (npm i hexo-filter-mermaid-diagrams). See https://mermaid.js.org/"
    },
    "description": {
      "zh-CN": "Mermaid JS。需要 hexo-filter-mermaid-diagrams（npm i hexo-filter-mermaid-diagrams）。参见 https://mermaid.js.org/",
      "en": "Mermaid JS. Requires hexo-filter-mermaid-diagrams (npm i hexo-filter-mermaid-diagrams). See https://mermaid.js.org/"
    }
  },
  "plugins.mermaid.enable": {
    "label": {
      "zh-CN": "是否启用 mermaid",
      "en": "enable mermaid or not"
    },
    "description": {
      "zh-CN": "是否启用 mermaid",
      "en": "enable mermaid or not"
    }
  },
  "plugins.mermaid.theme": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.mermaid.theme.dark": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.mermaid.theme.light": {
    "label": {
      "zh-CN": "",
      "en": ""
    },
    "description": {
      "zh-CN": "",
      "en": ""
    }
  },
  "plugins.mermaid.version": {
    "label": {
      "zh-CN": "默认 v11.4.1",
      "en": "default v11.4.1"
    },
    "description": {
      "zh-CN": "默认 v11.4.1",
      "en": "default v11.4.1"
    }
  }
};

module.exports = { REDEFINE_METADATA };

