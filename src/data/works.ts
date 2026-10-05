/**
 * Everything the site knows about each work. The home page features the ones
 * marked `featured` (in this order), the Works page lists them all, and each gets
 * a page at /<lang>/works/<slug> — the default layout, unless a custom page is
 * registered for its slug in src/pages/work/custom.
 *
 * Copy is written once per language: a field is either a plain string (the same
 * everywhere — names, brands) or { en, zh }. Pages never see that; they ask for
 * worksIn(lang) and get plain strings back.
 */
import { pick, type Lang, type Localized, type Text } from "../i18n/locales";

/** Which live visual a work gets; works without one get a typographic poster. */
export type VisualKind = "roadmap" | "code" | "clock";

/** One highlight: a short lead-in, set dark, followed by the detail, set grey. */
export interface Feature {
  title: string;
  text: string;
}

interface StatSource {
  value: number;
  label: Text;
  prefix?: Text;
  suffix?: Text;
  /** "grouped" → 36,000 · "plain" → 2017 (no separator, e.g. years) */
  format?: "grouped" | "plain";
}

interface WorkSource {
  slug: string;
  title: Text;
  kind: Text;
  year: string;
  tagline: Text;
  summary: Text;
  features?: Localized<Feature[]>;
  stack: string[];
  platforms?: string;
  stats?: StatSource[];
  links: { label: Text; href: string }[];
  credits?: Text;
  featured?: boolean;
  visual?: VisualKind;
}

const sources: WorkSource[] = [
  {
    slug: "inkcity",
    title: "InkCity",
    kind: { en: "Desktop app", zh: "桌面应用" },
    year: "2026",
    tagline: {
      en: "Your desktop wallpaper, redrawn every day as the road map of a different city.",
      zh: "你的桌面壁纸，每天换成一座不同城市的路网地图。",
    },
    summary: {
      en: "A small cross-platform app. Every day at midnight it picks a city, renders its road network as an ink-on-paper map sized to your screen, and sets it as your wallpaper.",
      zh: "一个小巧的跨平台应用。每天零点，它挑选一座城市，按你的屏幕尺寸把那里的路网画成一张墨印在纸上的地图，再设为桌面壁纸。",
    },
    features: {
      en: [
        {
          title: "A new city every day.",
          text: "About a thousand of the world’s most notable cities, with no city repeating within a month and no country within five days.",
        },
        { title: "Real roads.", text: "Road geometry from OpenStreetMap, cover-fitted to your screen without stretching." },
        {
          title: "Paper and ink, your way.",
          text: "Light, dark or follow-system palettes, each with its own colours, plus three line weights.",
        },
        { title: "Mondrian mode.", text: "The very same street grid, repainted as a De Stijl composition." },
      ],
      zh: [
        { title: "每天一座新城市。", text: "收录全球约一千座知名城市，一个月内城市不重复，五天内国家不重复。" },
        { title: "真实的道路。", text: "道路数据来自 OpenStreetMap，按屏幕比例铺满，不拉伸变形。" },
        { title: "纸与墨，随你搭配。", text: "浅色、深色或跟随系统，每套都有自己的配色，另有三档线宽可选。" },
        { title: "蒙德里安模式。", text: "同一张街道网格，重新涂成一幅风格派（De Stijl）构图。" },
      ],
    },
    stack: ["Tauri", "Rust", "React", "TypeScript"],
    platforms: "macOS · Windows · Linux",
    stats: [
      { value: 1000, prefix: "~", label: { en: "cities", zh: "座城市" }, format: "grouped" },
      { value: 3, label: { en: "platforms", zh: "个平台" } },
      { value: 20, label: { en: "languages", zh: "种语言" } },
    ],
    links: [
      { label: { en: "Download", zh: "下载" }, href: "https://github.com/RalfZhang/ink-city/releases/latest" },
      { label: "GitHub", href: "https://github.com/RalfZhang/ink-city" },
    ],
    credits: {
      en: "App icon and map visual design by Jie Xu. Map data © OpenStreetMap contributors.",
      zh: "应用图标与地图视觉设计：Jie Xu。地图数据 © OpenStreetMap 贡献者。",
    },
    featured: true,
    visual: "roadmap",
  },
  {
    slug: "file-template",
    title: "File Template",
    kind: { en: "VS Code extension", zh: "VS Code 扩展" },
    year: "2017 — 2026",
    tagline: {
      en: "Start every new file from a template — header, boilerplate and all.",
      zh: "每个新文件都从模板开始，文件头和样板代码一应俱全。",
    },
    summary: {
      en: "A Visual Studio Code extension for creating files from templates. Run “Insert Template” in a new file and the header and boilerplate for its language land at the cursor, with tab stops for the parts that change.",
      zh: "一个用模板新建文件的 Visual Studio Code 扩展。在新文件里运行“Insert Template”，对应语言的文件头和样板代码就会出现在光标处，需要改的地方都留好了 Tab 跳转位。",
    },
    features: {
      en: [
        {
          title: "Built in.",
          text: "Templates for JavaScript, TypeScript, JSX and TSX, HTML, CSS, PHP, Python, Ruby, XML and Vue.",
        },
        {
          title: "Yours, for any language.",
          text: "Add or edit a template for any VS Code language. Your templates live outside the extension, so updates never touch them.",
        },
        {
          title: "Snippet syntax.",
          text: "Tab stops and placeholders in TextMate snippet syntax, plus ${date} for the moment the file was created.",
        },
      ],
      zh: [
        { title: "开箱即用。", text: "内置 JavaScript、TypeScript、JSX 与 TSX、HTML、CSS、PHP、Python、Ruby、XML 和 Vue 模板。" },
        {
          title: "任何语言，都能自定义。",
          text: "可以为 VS Code 支持的任何语言新增或修改模板。你的模板存放在扩展之外，更新扩展也不会动到它们。",
        },
        {
          title: "代码片段语法。",
          text: "Tab 跳转位和占位符沿用 TextMate 代码片段语法，另有 ${date} 填入文件创建的时间。",
        },
      ],
    },
    stack: ["TypeScript", "VS Code API"],
    stats: [
      { value: 36000, suffix: "+", label: { en: "installs", zh: "次安装" }, format: "grouped" },
      { value: 2017, prefix: { en: "since ", zh: "" }, suffix: { en: "", zh: " 年" }, label: { en: "first released", zh: "首次发布" }, format: "plain" },
      { value: 11, label: { en: "templates", zh: "个模板" } },
    ],
    links: [
      { label: { en: "Marketplace", zh: "扩展市场" }, href: "https://marketplace.visualstudio.com/items?itemName=RalfZhang.filetemplate" },
      { label: "GitHub", href: "https://github.com/RalfZhang/File-Template" },
    ],
    featured: true,
    visual: "code",
  },
  {
    slug: "big-ben",
    title: { en: "Big Ben", zh: "大笨钟" },
    kind: { en: "Social bot", zh: "社交机器人" },
    year: "2017 — 2026",
    tagline: {
      en: "A clock tower for social media. Every hour, on the hour: BONG!",
      zh: "社交网络上的钟楼。每到整点：咣！",
    },
    summary: {
      en: "A remake of Big Ben on renren.com. On the hour it posts the time — one BONG for every hour — and how much of the year has quietly slipped away, to Douban, Threads and Mastodon at once.",
      zh: "复刻人人网上的大笨钟。每到整点，它报出北京时间（几点就咣几声），再算算今年已经悄悄溜走了多少，同时发到豆瓣、Threads 和 Mastodon。",
    },
    features: {
      en: [
        {
          title: "Three platforms, one chime.",
          text: "Each round posts to Douban, Threads and Mastodon, with the same progress figure everywhere, to the third decimal.",
        },
        { title: "Retries built in.", text: "Transient failures are retried per platform, so a flaky network doesn’t cost an hour." },
        {
          title: "Talks back, if you like.",
          text: "On Threads it can answer replies.",
        },
      ],
      zh: [
        { title: "三个平台，同一声钟。", text: "每一轮都发到豆瓣、Threads 和 Mastodon，各处的进度数字完全一致，精确到小数点后三位。" },
        { title: "自带重试。", text: "临时失败会按平台分别重试，网络抖一下也不会错过一个整点。" },
        {
          title: "愿意的话，还能聊几句。",
          text: "在 Threads 可以回复评论区留言。",
        },
      ],
    },
    stack: ["Node.js", "Docker"],
    stats: [
      { value: 3, label: { en: "platforms", zh: "个平台" } },
      { value: 2017, prefix: { en: "since ", zh: "" }, suffix: { en: "", zh: " 年" }, label: { en: "first released", zh: "首次发布" }, format: "plain" },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/RalfZhang/big-ben" },
      { label: { en: "Douban", zh: "豆瓣" }, href: "https://www.douban.com/people/160931760/" },
      { label: "Threads", href: "https://www.threads.com/@threads_big_ben" },
      { label: "Mastodon", href: "https://m.cmx.im/@cmxBigBen" },
    ],
    credits: {
      en: "Inspired by Renren’s Big Ben and DoubanYearProgress.",
      zh: "灵感来自人人网的大笨钟和 DoubanYearProgress。",
    },
    featured: true,
    visual: "clock",
  },
  {
    slug: "vdo",
    title: { en: "Vdo", zh: "微豆" },
    kind: { en: "Web app", zh: "网页应用" },
    year: "2017",
    tagline: {
      en: "Douban, rebuilt as a Material Design single-page app.",
      zh: "用 Material Design 重做的单页版豆瓣。",
    },
    summary: {
      en: "A Douban movie web app built with Vue 2, Vuex and vue-router, dressed in Material Design — and a tutorial series on the blog about how it was put together.",
      zh: "一个用 Vue 2、Vuex 和 vue-router 写的豆瓣电影网页应用，换上了 Material Design 的外观；博客上还有一组教程，讲它是怎么一步步搭起来的。",
    },
    stack: ["Vue", "Vuex", "vue-router"],
    stats: [{ value: 269, label: { en: "stars", zh: "个 Star" } }],
    links: [
      { label: "GitHub", href: "https://github.com/RalfZhang/Vdo" },
      { label: { en: "Write-up", zh: "教程" }, href: "http://blog.ralfz.com/2017/04/04/vdo/" },
    ],
  },
  {
    slug: "zender",
    title: "Zender",
    kind: { en: "Framework", zh: "框架" },
    year: "2017",
    tagline: { en: "A lightweight MVVM engine.", zh: "一个轻量的 MVVM 引擎。" },
    summary: {
      en: "A lightweight MVVM engine in plain JavaScript: templates bound to a view model that keeps the DOM in sync.",
      zh: "用原生 JavaScript 写的轻量 MVVM 引擎：模板绑定到视图模型，由它让 DOM 保持同步。",
    },
    stack: ["JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/RalfZhang/Zender" }],
  },
];

/* ------------------------------------------------------------------ resolved, per language */

export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  format?: "grouped" | "plain";
}

export interface WorkLink {
  label: string;
  href: string;
}

export interface Work {
  slug: string;
  title: string;
  kind: string;
  year: string;
  tagline: string;
  summary: string;
  features?: Feature[];
  stack: string[];
  platforms?: string;
  stats?: Stat[];
  links: WorkLink[];
  credits?: string;
  featured?: boolean;
  visual?: VisualKind;
}

const pickOpt = (t: Text | undefined, lang: Lang) => (t === undefined ? undefined : pick(t, lang));

function localize(w: WorkSource, lang: Lang): Work {
  return {
    ...w,
    title: pick(w.title, lang),
    kind: pick(w.kind, lang),
    tagline: pick(w.tagline, lang),
    summary: pick(w.summary, lang),
    features: w.features?.[lang],
    stats: w.stats?.map((s) => ({
      ...s,
      label: pick(s.label, lang),
      prefix: pickOpt(s.prefix, lang),
      suffix: pickOpt(s.suffix, lang),
    })),
    links: w.links.map((l) => ({ ...l, label: pick(l.label, lang) })),
    credits: pickOpt(w.credits, lang),
  };
}

export interface Catalog {
  all: Work[];
  featured: Work[];
  other: Work[];
  get(slug: string): Work | undefined;
  /** The one after `slug`, wrapping round. */
  next(slug: string): Work;
}

const catalogs = new Map<Lang, Catalog>();

export function worksIn(lang: Lang): Catalog {
  let c = catalogs.get(lang);
  if (!c) {
    const all = sources.map((w) => localize(w, lang));
    c = {
      all,
      featured: all.filter((w) => w.featured),
      other: all.filter((w) => !w.featured),
      get: (slug) => all.find((w) => w.slug === slug),
      next: (slug) => all[(all.findIndex((w) => w.slug === slug) + 1) % all.length],
    };
    catalogs.set(lang, c);
  }
  return c;
}

export const workSlugs = sources.map((w) => w.slug);
export const hasWork = (slug: string) => workSlugs.includes(slug);
