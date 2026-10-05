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

把 `dist/` 里的全部内容上传到 nginx 的站点根目录即可。

构建时（[scripts/route-shells.ts](scripts/route-shells.ts)，一个 Vite 插件）会给每种语言的每个路由生成一份 `index.html`
（`en/`、`zh/works/`、`zh/works/<slug>/`…，各带自己的 lang、标题和 hreflang），给不带语言的旧地址
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
  需要翻译的字段写成 `{ en, zh }`，各语言相同的（名字、品牌）直接写字符串。页面里用 `useI18n().works` 取当前语言的版本。
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

## TODO

- 优化单个作品
  - InkCity 全屏图
  - File-Template 的编辑器全屏
  - 大笨钟进度条全屏
- xian-map.json 你从哪儿搞的？能不能换个海边的城市，不要太过大。

</details>