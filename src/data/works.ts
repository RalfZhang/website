/**
 * Everything the site knows about each work. The home page features the ones
 * marked `featured` (in this order), the Works page lists them all, and each gets
 * a page at /works/<slug> — the default layout, unless a custom page is
 * registered for its slug in src/pages/work/custom.
 */

/** Which live visual a work gets; works without one get a typographic poster. */
export type VisualKind = "roadmap" | "code" | "clock";

export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  /** "grouped" → 36,000 · "plain" → 2017 (no separator, e.g. years) */
  format?: "grouped" | "plain";
}

export interface WorkLink {
  label: string;
  href: string;
}

/** One highlight: a short lead-in, set dark, followed by the detail, set grey. */
export interface Feature {
  title: string;
  text: string;
}

export interface Work {
  slug: string;
  title: string;
  titleZh?: string;
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

export const works: Work[] = [
  {
    slug: "inkcity",
    title: "InkCity",
    kind: "Desktop app",
    year: "2026",
    tagline: "Your desktop wallpaper, redrawn every day as the road map of a different city.",
    summary:
      "A small cross-platform app. Every day at midnight it picks a city, renders its road network as an ink-on-paper map sized to your screen, and sets it as your wallpaper.",
    features: [
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
    stack: ["Tauri", "Rust", "React", "TypeScript"],
    platforms: "macOS · Windows · Linux",
    stats: [
      { value: 1000, prefix: "~", label: "cities", format: "grouped" },
      { value: 3, label: "platforms" },
      { value: 20, label: "languages" },
    ],
    links: [
      { label: "Download", href: "https://github.com/RalfZhang/ink-city/releases/latest" },
      { label: "GitHub", href: "https://github.com/RalfZhang/ink-city" },
    ],
    credits: "App icon and map visual design by Jie Xu. Map data © OpenStreetMap contributors.",
    featured: true,
    visual: "roadmap",
  },
  {
    slug: "file-template",
    title: "File Template",
    kind: "VS Code extension",
    year: "2017 — 2026",
    tagline: "Start every new file from a template — header, boilerplate and all.",
    summary:
      "A Visual Studio Code extension for creating files from templates. Run “Insert Template” in a new file and the header and boilerplate for its language land at the cursor, with tab stops for the parts that change.",
    features: [
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
    stack: ["TypeScript", "VS Code API"],
    stats: [
      { value: 36000, suffix: "+", label: "installs", format: "grouped" },
      { value: 2017, prefix: "since ", label: "first released", format: "plain" },
      { value: 11, label: "templates" },
    ],
    links: [
      { label: "Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=RalfZhang.filetemplate" },
      { label: "GitHub", href: "https://github.com/RalfZhang/File-Template" },
    ],
    featured: true,
    visual: "code",
  },
  {
    slug: "big-ben",
    title: "Big Ben",
    titleZh: "大笨钟",
    kind: "Social bot",
    year: "2017 — 2026",
    tagline: "A clock tower for social media. Every hour, on the hour: 咣！",
    summary:
      "A remake of Renren’s much-missed Big Ben. On the hour it posts the time in Beijing — one 咣 for every hour — and how much of the year has quietly slipped away, to Douban, Threads and Mastodon at once.",
    features: [
      {
        title: "Three platforms, one chime.",
        text: "Each round posts to Douban, Threads and Mastodon, with the same progress figure everywhere, to the third decimal.",
      },
      { title: "Retries built in.", text: "Transient failures are retried per platform, so a flaky network doesn’t cost an hour." },
      {
        title: "Talks back, if you like.",
        text: "On Threads it can answer replies: the exact time for “what time is it?”, a freshly written quip for anything else. Off by default.",
      },
    ],
    stack: ["Node.js", "Docker"],
    stats: [
      { value: 300, label: "咣 a day" },
      { value: 3, label: "platforms" },
      { value: 2017, prefix: "since ", label: "first released", format: "plain" },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/RalfZhang/big-ben" },
      { label: "Douban", href: "https://www.douban.com/people/160931760/" },
      { label: "Threads", href: "https://www.threads.com/@threads_big_ben" },
      { label: "Mastodon", href: "https://m.cmx.im/@cmxBigBen" },
    ],
    credits: "Inspired by Renren’s Big Ben and DoubanYearProgress.",
    featured: true,
    visual: "clock",
  },
  {
    slug: "vdo",
    title: "Vdo",
    titleZh: "微豆",
    kind: "Web app",
    year: "2017",
    tagline: "Douban, rebuilt as a Material Design single-page app.",
    summary:
      "A Douban movie web app built with Vue 2, Vuex and vue-router, dressed in Material Design — and a tutorial series on the blog about how it was put together.",
    stack: ["Vue", "Vuex", "vue-router"],
    stats: [{ value: 269, label: "stars" }],
    links: [
      { label: "GitHub", href: "https://github.com/RalfZhang/Vdo" },
      { label: "Write-up", href: "http://blog.ralfz.com/2017/04/04/vdo/" },
    ],
  },
  {
    slug: "zender",
    title: "Zender",
    kind: "Framework",
    year: "2017",
    tagline: "A lightweight MVVM engine.",
    summary: "A lightweight MVVM engine in plain JavaScript: templates bound to a view model that keeps the DOM in sync.",
    stack: ["JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/RalfZhang/Zender" }],
  },
  {
    slug: "sort-problem",
    title: "Sort Problem",
    kind: "Visualization",
    year: "2016",
    tagline: "Sorting algorithms, explained and animated.",
    summary: "An introduction to the classic sorting algorithms, each one shown step by step as an animation. 介绍排序算法并展示动画。",
    stack: ["HTML", "JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/RalfZhang/sort-problem" }],
  },
  {
    slug: "jrender",
    title: "JRender",
    kind: "Library",
    year: "2016",
    tagline: "A small but complete front-end template engine.",
    summary: "A lightweight JavaScript template engine with the features you actually reach for. 前端轻量并功能齐备的 JS 模板。",
    stack: ["JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/RalfZhang/JRender" }],
  },
  {
    slug: "ingress-passcode",
    title: "Ingress Passcode",
    kind: "Tool",
    year: "2016",
    tagline: "Look up Ingress materials by passcode.",
    summary: "A small helper from the Ingress days: enter a passcode and see which materials it gives.",
    stack: ["JavaScript"],
    links: [{ label: "GitHub", href: "https://github.com/RalfZhang/ingress-passcode" }],
  },
];

export const featuredWorks = works.filter((w) => w.featured);
export const otherWorks = works.filter((w) => !w.featured);

export const getWork = (slug: string) => works.find((w) => w.slug === slug);

export function nextWork(slug: string): Work {
  const i = works.findIndex((w) => w.slug === slug);
  return works[(i + 1) % works.length];
}

/** "01", "02"… — position in the full list. */
export const workIndex = (slug: string) => String(works.findIndex((w) => w.slug === slug) + 1).padStart(2, "0");
