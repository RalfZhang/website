/**
 * Where I've worked, most recent first — shown on the About page. Copy is
 * written as in works.ts: a plain string where every language says the same,
 * { en, zh } otherwise; pages ask for experienceIn(lang) and get plain strings.
 */
import { pick, type Lang, type Text } from "../i18n/locales";

interface JobSource {
  company: Text;
  team: Text;
  role: Text;
}

export interface Job {
  company: string;
  team: string;
  role: string;
}

const sources: JobSource[] = [
  {
    company: "Tubi",
    team: { en: "Growth team", zh: "Growth 团队" },
    role: { en: "Software Engineer", zh: "软件工程师" },
  },
  {
    company: { en: "Alibaba", zh: "阿里巴巴" },
    team: { en: "DingTalk Docs", zh: "钉钉文档" },
    role: { en: "Frontend Engineer", zh: "前端工程师" },
  },
];

export const experienceIn = (lang: Lang): Job[] =>
  sources.map((j) => ({ company: pick(j.company, lang), team: pick(j.team, lang), role: pick(j.role, lang) }));
