/**
 * Interface copy in English — the source language: its shape is the type every
 * other language must match (see ./cn.ts). Placeholders are {name}, filled in
 * by fmt / rich from ../index.tsx. Work descriptions live with the works, in
 * src/data/works.ts.
 */
export const en = {
  meta: {
    description: "Ralf Zhang — InkCity, File Template, Big Ben and other things I’ve made.",
    contact: "All the ways to reach Ralf Zhang: GitHub, Telegram, WeChat and more.",
    title: "{page} — {name}",
  },
  nav: {
    home: "Home",
    works: "Works",
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
    seeWork: "See the work",
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
    scanWith: { wechat: "Scan with WeChat · 用微信扫一扫" } as Record<string, string>,
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
    caption: "Xi’an, centred on the Bell Tower.",
  },
  bigben: {
    ring: "Ring the bell",
    slipped: "{pct} of {year} has quietly slipped away.",
  },
};

export type Messages = typeof en;
