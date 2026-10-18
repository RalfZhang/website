# ralfz.com

Personal site.

<details>
<summary>Info</summary>

## 设计约定

配色只有两套，取自 InkCity 的地图主题：

| 主题 | 背景 | 墨色 |
| --- | --- | --- |
| light | `#eee8d6` | `#2d2d2d` |
| dark | `#000000` | `#5e5d58` |

暗色下 `#5e5d58` 对黑底只有约 3.2:1，所以它只用于画出来的物体（显示器、路网）。文字用纸色 `#eee8d6` 和一个灰色。
所有颜色 token 定义在 [src/styles/base.css](src/styles/base.css)。

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 打包到 dist/ + 生成各语言、各路由的 index.html
pnpm preview    # 本地预览 dist/
```

## 部署

放在 Cloudflare Workers 上，只用静态资源（没有 Worker 脚本，免费套餐够用）。仓库连着 Workers Builds，
**push 到 main 就自动构建上线**：`pnpm build`，然后 `npx wrangler deploy` 把 `dist/` 传上去，配置见
[wrangler.jsonc](wrangler.jsonc)。其他分支的 push 只生成预览版本，不影响线上。

首次连接：Cloudflare 控制台 → Workers & Pages → Create application → Import a repository，选这个仓库；
项目名必须和 `wrangler.jsonc` 里的 `name`（`ralfz-www`）一致，构建命令填 `pnpm build`，部署命令保持默认的 `npx wrangler deploy`。

构建时（[scripts/route-shells.ts](scripts/route-shells.ts)，一个 Vite 插件）会给每种语言的每个路由生成一份 `index.html`
（`en/`、`zh/works/`、`zh/works/<slug>/`…，各带自己的 lang、标题和 hreflang），给不带语言的旧地址
（`works/`、`about/`、`contact/`…）生成负责跳转的副本，再生成 `404.html`，所以服务器只要按路径返回文件，不需要 SPA 回退。
在 Cloudflare 上，`/en/works` 会跳到 `/en/works/`（和 canonical 地址一致），找不到文件的路径返回 `404.html`。

`dist/` 也能原样放到别的静态服务器上：nginx 不改配置就能打开深链接，想让未知路径也显示站内的 404 页，加一行
`error_page 404 /404.html;`。

旧站的 `/telegram.png`、`/whatsapp.png`、`/wechat.png` 原样保留在 `public/` 里，老链接不会失效。

## 改内容

- 作品：[src/data/works.ts](src/data/works.ts)。`featured: true` 的作品按顺序出现在首页；
  `visual` 决定用哪个动态视觉（`roadmap` / `code` / `clock`），不填则显示一张以作品名为主体的海报。
  需要翻译的字段写成 `{ en, zh }`，各语言相同的（名字、品牌）直接写字符串。页面里用 `useI18n().works` 取当前语言的版本。
- 工作经历（首页第二屏和关于页）：[src/data/experience.ts](src/data/experience.ts)，按时间倒序写，写法同作品。个人介绍在界面文案的 `about.intro`。
- 联系方式：[src/data/contacts.ts](src/data/contacts.ts)。有中文名的平台把 `name` 写成 `{ en, zh }`。
- 界面文案：[src/i18n/messages/](src/i18n/messages/)。
- 站点信息（名字、博客地址）：[src/data/site.ts](src/data/site.ts)。

## 给某个作品做单独的页面

每个作品默认用 [DefaultWorkPage](src/pages/work/DefaultWorkPage.tsx)。要定制某一个，在
[src/pages/work/custom/](src/pages/work/custom/) 里写一个组件，然后在 `custom/index.ts` 里按 slug 注册：

```ts
export const customPages = {
  inkcity: lazy(() => import("./InkCityPage")),
};
```

组件会收到 `{ work }`，即 works.ts 里对应的、已经是当前语言的数据；其余文案用 `useI18n()` 取。

## 给某个作品单独设计首页的一屏

首页每个 `featured` 作品占一屏，默认是 [Feature](src/pages/home/Feature.tsx)：左边文字，右边动态视觉。要单独设计某一屏，
在 `src/pages/home/` 里写一个组件和它自己的 CSS（如 `InkCityFeature`、`FileTemplateFeature`、`BigBenFeature`），然后在
[Home.tsx](src/pages/home/Home.tsx) 的 `screens` 里按 slug 注册：

```ts
const screens = {
  inkcity: InkCityFeature,
  "file-template": FileTemplateFeature,
  "big-ben": BigBenFeature,
};
```

各屏之间只共用下面几样，其余样式都写在各自的 CSS 里，改一屏不会影响别的屏：

- `screen` 类（Home.css）：整屏吸附滚动，高度 100svh。屏里的内容要给导航栏留出 `--nav-h`。
- `FeatureCopy`（Feature.tsx）：作品的文字和按钮。默认随滚动淡入；传 `reveal={false}` 由这一屏自己安排入场，
  传 `words` 自己绘制每一段文字（File Template 用它做打字机效果）。
- `useTimeline`（[src/lib/timeline.ts](src/lib/timeline.ts)）：可暂停的脚本时钟。传入的 `playing` 为假时暂停（通常是屏幕离开视口
  或标签页隐藏），回来后从停下的地方接着播。编辑器演示的 `useEditorDemo`（editorDemo.ts）已经接好了这些。

## 数据脚本

- `pnpm data:map <payload.json> <slug>` — 把 InkCity 抓取的 20 km × 20 km OSM 数据（在 `../ink-city` 里运行
  `pnpm render <lat>/<lon> --fetch-only --km 20 -o road-test/json` 得到）裁剪、简化成 `src/data/maps/<slug>.json`，
  图层和 InkCity 的 standard 样式一致：道路（含小路）、铁路、机场跑道和滑行道、湖泊河流和海面。
  现在有纽约、香港、吉隆坡、摩纳哥四座城市，首页按这个顺序循环；城市列表、中心点和各自用的数据文件都在
  `src/data/cities.ts`。每座城市 brotli 压缩后 140–700 KB，页面滚到前一屏时才加载第一座，之后在当前城市展示时
  加载下一座，解析放在 Web Worker 里。每条线在离中心最近的点切开并朝外定向，前端按这个距离依次绘制，
  就形成了墨从中心晕开的效果。地图数据 © OpenStreetMap contributors（ODbL）。
- `pnpm data:qr` — 生成 `src/data/qr.json`，即二维码的模块矩阵，前端用 SVG 绘制。现在只有微信需要
  （其他平台都有网页链接）；内容是从旧站二维码图片里解出来的链接。
- `pnpm data:icons` — 从 `simple-icons` 里只抽出用到的 7 个平台 logo，生成 `src/data/brands.json`，
  这样网站不用打包整个图标库。新增联系方式时，在 `scripts/build-icons.mjs` 里加上对应的图标再运行一次。

## 结构

```
src/
  lib/          路由（routes.ts 不含 React，构建脚本也用）、主题（切换时交叉淡化）、淡入与可见性 hook、可暂停的脚本时钟
  i18n/         语言定义与检测、界面文案、各页面的 head 信息
  components/   导航、页脚、图标、联系方式图标行、二维码与弹窗
  visuals/      InkCityVisual（显示器 + 路网壁纸）、CodeWindow（窗口里的编辑器演示）、WatchClock（大笨钟和它的帖子）、Poster；
                编辑器演示的脚本在 editorDemo.ts，文件、命令面板、键帽这些部件在 Editor.tsx，首页的全屏编辑器也用它们；
                大笨钟的时区、报时、指针和钟声在 bigBen.ts，表盘在 Dial.tsx（颜色由 --w-* 指定），首页的大笨钟一屏也用它们；
                dotPrint.ts 是点阵打印机式的逐行入场（一张盖在内容上的画布，按打印头的顺序一点一点擦掉）
  pages/        home（含各作品单独设计的一屏）、works、work（作品详情）、about、contact、404
  data/         作品、联系方式、生成的数据
scripts/        数据生成；route-shells.ts 是生成各路由 HTML 的 Vite 插件
```

## TODO

- 优化单个作品
  - InkCity 全屏图
  - File-Template 的编辑器全屏
  - 大笨钟进度条全屏
- xian-map.json 你从哪儿搞的？能不能换个海边的城市，不要太过大。

</details>