# ralfz.com

个人网站。Vite + React + TypeScript，运行时只依赖 React，没有动画库，也不加载网络字体。

## 设计约定

风格贴近 InkCity：墨印在纸上，扁平、简单。

- **两种颜色加一个灰**：纸色、墨色，再加一个灰色用于次要文字、一个淡色用于色块底。没有阴影、渐变和毛玻璃。
- **两档字重**：正文 400，标题 500。一种字体，用系统字体（Apple 设备上是 SF Pro + 苹方，Windows 上是 Segoe UI + 微软雅黑）；
  代码演示里用系统等宽字体。
- **4px 圆角**：卡片、按钮、色块统一 `--radius: 4px`。
- **图标**：自己画的线性图标（→ ↗ ↓ ✕ 等），方头线端、尖角转折，和地图线条一致。联系方式的平台 logo 来自
  [Simple Icons](https://simpleicons.org)（CC0），统一用当前文字颜色单色显示。
- **大笨钟的表**：中文页面和机器人一样走北京时间；英文页面走访客系统的时区（表盘下写时区名，如 `PDT`、`GMT+8`），
  年进度也按当地的元旦零点算（夏令时已计入）。帖子文案见 `src/i18n/messages/` 里的 `bigben`。
- **动效克制**：装饰性的动效只有一种——元素第一次进入视野时淡入（`data-reveal`，见 [src/lib/motion.ts](src/lib/motion.ts)）。
  其余动的都是内容本身：InkCity 路网从钟楼长出来、File Template 的编辑器演示、大笨钟的表针。
- **整页滚动，用 CSS 实现**：首页是 `scroll-snap-type: y mandatory` 的吸附容器，每屏 `scroll-snap-align: start` +
  `scroll-snap-stop: always`。没有任何滚动或滚轮监听，翻页全是浏览器原生行为：鼠标滚轮每格一屏；触控板或触屏
  滑一下翻一屏，用力甩也只走一屏，轻推不到半屏会弹回；↑ ↓ / PageUp / PageDown / 空格各翻一屏；滚动条照常可拖。
  强制吸附的前提是每屏内容都完整装得下（装不下的部分会滚不到），所以每屏固定 `100svh` 高，作品图按剩余空间缩放
  （尺寸容器 + `cqw` / `cqh`）；视口低于 600px（横屏手机）时不吸附，按普通页面滚动。改首页布局后，
  记得在几个尺寸下确认每屏都没有溢出。
- **联系方式**：一行平台图标，不用色块。悬停或聚焦某个图标时，其余图标变浅，下方那行文字显示平台名和账号；
  微信没有网页链接，点击后弹出二维码。

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

## 多语言

中英双语，语言写在 URL 里：每个页面都有 `/en/…` 和 `/cn/…` 两个地址（`/cn` 是简体中文）。

- **URL 是唯一依据**：打开 `/en/works` 就是英文，不看浏览器语言、也不看上次的选择。
- **没带语言的地址**（`/`，以及旧链接 `/works`、`/contact`…）由 `index.html` 里的内联脚本在首屏绘制前跳转：
  访客在切换按钮上选过语言就用那个（存在 `localStorage` 的 `lang`），否则看浏览器的语言列表，第一个是中文
  （任何繁简地区）就去 `/cn`，是英文就去 `/en`，都不是则 `/en`。逻辑和 [src/i18n/locales.ts](src/i18n/locales.ts) 保持一致。
- **切换按钮**在导航栏，用目标语言自己的名字（English / 中文）显示。切换后停在同一页面、同一位置。
- **站内链接不写语言**：`<Link to="/works">` 自动加上当前语言前缀。
- **SEO**：`<html lang>`（`en` / `zh-CN`）、标题、描述、`canonical`、`hreflang`（`en`、`zh`、`x-default`）
  在构建时写进每个页面的静态 HTML，客户端路由时同步更新。`x-default` 指向不带语言的地址，即按语言跳转的入口。
  绝对地址的域名取自 [src/data/site.ts](src/data/site.ts) 的 `origin`，换成 HTTPS 时记得改。

界面文案在 [src/i18n/messages/](src/i18n/messages/)：`en.ts` 是源语言，它的结构就是类型，`cn.ts` 少一个键都过不了
类型检查。占位符写成 `{name}`，纯文本用 `fmt`，需要嵌入元素（比如加粗的百分比）用 `rich`，语序由各语言自己的文案决定。
作品的文案和作品数据放在一起（见下面「改内容」）。每种语言只用自己的文字：英文页面上没有中文（只有切换按钮写着“中文”），
中文页面上的英文只留产品名、品牌这类本来就是英文的词，不做「大笨钟 Big Ben」这样的双语并列。数字用 `Intl.NumberFormat` 按语言格式化。没有用 i18n 库，
两种语言的文案加起来只有几 KB，一起打包。

## 部署

把 `dist/` 里的全部内容上传到 nginx 的站点根目录即可。

构建时（[scripts/route-shells.ts](scripts/route-shells.ts)，一个 Vite 插件）会给每种语言的每个路由生成一份 `index.html`
（`en/`、`cn/works/`、`cn/works/<slug>/`…，各带自己的 lang、标题和 hreflang），给不带语言的旧地址
（`works/`、`contact/`…）生成负责跳转的副本，再生成 `404.html`，所以 nginx **不改配置**也能直接打开深链接。想让未知路径也显示站内的 404 页，可以加：

```nginx
error_page 404 /404.html;
```

或者改成标准的 SPA 回退（这样也就不需要那些路由目录了）：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

旧站的 `/telegram.png`、`/whatsapp.png`、`/wechat.png` 原样保留在 `public/` 里，老链接不会失效。

## 改内容

- 作品：[src/data/works.ts](src/data/works.ts)。`featured: true` 的作品按顺序出现在首页；
  `visual` 决定用哪个动态视觉（`roadmap` / `code` / `clock`），不填则显示一张以作品名为主体的海报。
  需要翻译的字段写成 `{ en, cn }`，各语言相同的（名字、品牌）直接写字符串。页面里用 `useI18n().works` 取当前语言的版本。
- 联系方式：[src/data/contacts.ts](src/data/contacts.ts)。`nameZh` 是中文页面上显示的平台名。
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

## 数据脚本

- `pnpm data:map` — 从 `../ink-city/road-test/json/` 里的西安路网数据裁剪、简化出 `src/data/xian-map.json`
  （约 230 KB，gzip 后约 80 KB，按需加载）。每条路在离钟楼最近的点切开并朝外定向，前端按这个距离依次绘制，
  就形成了墨从中心晕开的效果。地图数据 © OpenStreetMap contributors（ODbL）。
- `pnpm data:qr` — 生成 `src/data/qr.json`，即二维码的模块矩阵，前端用 SVG 绘制。现在只有微信需要
  （其他平台都有网页链接）；内容是从旧站二维码图片里解出来的链接。
- `pnpm data:icons` — 从 `simple-icons` 里只抽出用到的 7 个平台 logo，生成 `src/data/brands.json`，
  这样网站不用打包整个图标库。新增联系方式时，在 `scripts/build-icons.mjs` 里加上对应的图标再运行一次。

## 结构

```
src/
  lib/          路由（routes.ts 不含 React，构建脚本也用）、主题（切换时交叉淡化）、淡入与可见性 hook
  i18n/         语言定义与检测、界面文案、各页面的 head 信息
  components/   导航、页脚、图标、联系方式图标行、二维码与弹窗
  visuals/      InkCityVisual（显示器 + 路网壁纸）、CodeWindow（编辑器演示）、WatchClock（大笨钟）、Poster
  pages/        home、works、work（作品详情）、contact、404
  data/         作品、联系方式、生成的数据
scripts/        数据生成；route-shells.ts 是生成各路由 HTML 的 Vite 插件
```

## 备注

- 站点目前是 HTTP。剪贴板、`crypto.randomUUID` 这类只在安全上下文里可用的 API 不要直接依赖。
- 尊重系统的「减弱动态效果」设置：淡入、路网生长、打字演示都会退化为静态。
