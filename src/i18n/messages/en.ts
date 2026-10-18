/**
 * Interface copy in English — the source language: its shape is the type every
 * other language must match (see ./zh.ts). Placeholders are {name}, filled in
 * by fmt / rich from ../index.tsx. Work descriptions live with the works, in
 * src/data/works.ts.
 */
export const en = {
  meta: {
    description: "Ralf Zhang — InkCity, File Template, Big Ben and other things I’ve made.",
    contact: "All the ways to reach Ralf Zhang: GitHub, Telegram, WeChat and more.",
    about: "Ralf Zhang, software engineer — front end and full stack. Experience at Tubi and Alibaba.",
    title: "{page} — {name}",
    /**
     * Each page's <meta name="keywords">, after the name and its spellings
     * (src/data/site.ts). The works, work and contact pages also add what they
     * list: titles and stacks from works.ts, platforms from contacts.ts.
     */
    keywords: {
      home: [
        "software engineer",
        "front-end engineer",
        "full-stack developer",
        "web developer",
        "personal website",
        "portfolio",
        "React",
        "TypeScript",
        "JavaScript",
        "Node.js",
        "Rust",
        "Tauri",
        "Vue",
        "InkCity",
        "File Template",
        "Big Ben bot",
        "VS Code extension",
        "wallpaper app",
      ],
      works: ["portfolio", "side projects", "open source"],
      about: ["software engineer", "front-end engineer", "full-stack developer", "Tubi", "Alibaba", "DingTalk", "DingTalk Docs"],
      contact: ["contact"],
    },
  },
  nav: {
    home: "Home",
    works: "Works",
    about: "About",
    blog: "Blog",
    contact: "Contact",
    primary: "Primary",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
  footer: {
    label: "Footer",
    copyright: "Copyright © {year} {name}. Map data © OpenStreetMap contributors.",
  },
  home: {
    role: "Software Engineer",
    toAbout: "About me",
    learnMore: "Learn more",
    sayHello: "Say hello",
  },
  works: {
    lead: "Apps, extensions and bots — and the experiments before them.",
    selected: "Selected works",
    more: "More",
    moreLead: "Older things, still on GitHub.",
  },
  work: {
    year: "Year",
    type: "Type",
    builtWith: "Built with",
    runsOn: "Runs on",
    highlights: "Highlights",
    inNumbers: "In numbers",
    details: "Details",
    links: "Links",
    credits: "Credits",
    next: "Next",
    list: ", ",
  },
  about: {
    title: "About",
    intro: "I’m a software engineer, mostly on the front end and full stack — but not tied to any one stack. I like trying different things.",
    experience: "Experience",
  },
  contact: {
    title: "Contact",
    hint: "Find me on any of these.",
    rowLabel: "Find me on",
    showQr: "{name} — show QR code",
    qr: "QR code",
  },
  qr: {
    label: "QR code: {text}",
    close: "Close",
    open: "Open {name}",
    original: "Original image",
    scan: "Scan with your phone’s camera.",
    scanWith: { wechat: "Scan with WeChat." } as Record<string, string>,
  },
  notFound: {
    title: "Not found",
    headline: "Off the map",
    text: "There’s no road here. The page you’re after may have moved.",
    home: "Back home",
  },
  inkcity: {
    wallpaper: "Wallpaper",
    light: "Light",
    dark: "Dark",
    caption: "{city}, centred on {centre}.",
  },
  cstu: {
    pages: "Pages",
    home: "Home",
    courses: "Courses",
    caption: "Screenshots of short.cstu.cloud.",
    /** A screenshot's alt text; {page} is one of the two above. */
    alt: "CSTU Courses: {page}",
  },
  bigben: {
    ring: "Ring the bell",
    /** Under the hands: which time the clock keeps. {zone} is the visitor's, e.g. "PDT". */
    face: "{zone}",
    app: "Big Ben Bot",
    /** The post: one {strikes} per hour (24 at midnight), then {time} {zone}, or {hour}; {pct} is to 3 decimals. */
    strike: "BONG! ",
    post: "{strikes}Big Ben Bot here: it’s {time} {zone} — {year} is already {pct}% gone.",
    slipped: "{pct} of {year} has quietly slipped away.",
    /** Under it on the home screen, where the year is the screen: {n} of its {total} pixels are inked. */
    pixels: "That’s {n} of this screen’s {total} pixels.",
    /** Under the loupe on the pixel being inked: how long each pixel's slice of the year is, as a map gives its scale. */
    perPixel: "1 pixel ≈ {s} s",
  },
};

export type Messages = typeof en;
