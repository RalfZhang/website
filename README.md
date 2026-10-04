# ralfz.com

个人网站。Vite + React + TypeScript，运行时只依赖 React，没有动画库，也不加载网络字体。

## 设计约定

风格参考 Apple 的产品介绍页：

- **一种字体**：用系统字体（Apple 设备上是 SF Pro + 苹方，Windows 上是 Segoe UI + 微软雅黑），字号阶梯和字距按 SF Pro 的规范设置。
  代码演示里用系统等宽字体。
- **实心，不用细线**：用半粗体标题、灰色延续句（"**Works.** Apps, extensions…"）、圆角色块来组织内容，不用 1px 分隔线。
- **动效克制**：装饰性的动效只有一种——元素第一次进入视野时淡入上浮（`data-reveal`，见 [src/lib/motion.ts](src/lib/motion.ts)）。
  其余动的都是内容本身：InkCity 路网从钟楼长出来、File Template 的编辑器演示、大笨钟的表针。
- **原生滚动**：首页用 CSS scroll-snap 一屏一页。普通鼠标滚轮单格滚动距离太短，强制吸附会把它弹回去，
  所以只有滚轮额外做了"一格翻一页"（调用浏览器自己的平滑滚动）；触屏、键盘、滚动条都完全交给浏览器。

配色只有两套，取自 InkCity 的地图主题：

| 主题 | 背景 | 墨色 |
| --- | --- | --- |
| light | `#eee8d6` | `#2d2d2d` |
| dark | `#000000` | `#5e5d58` |

暗色下 `#5e5d58` 对黑底只有约 3.2:1，所以它只用于路网线条和次要的大字。标题和正文用纸色 `#eee8d6` 及其变暗的色调。
所有颜色 token 定义在 [src/styles/base.css](src/styles/base.css)。

## 开发

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 打包到 dist/ + 生成各路由的 index.html
pnpm preview    # 本地预览 dist/
```

## 部署

把 `dist/` 里的全部内容上传到 nginx 的站点根目录即可。

构建时会把 `index.html` 复制到每个路由目录（`works/`、`works/<slug>/`、`contact/`），并生成 `404.html`，
所以 nginx **不改配置**也能直接打开深链接。想让未知路径也显示站内的 404 页，可以加：

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
- 联系方式：[src/data/contacts.ts](src/data/contacts.ts)。
- 站点信息（名字、博客地址）：[src/data/site.ts](src/data/site.ts)。

## 给某个作品做单独的页面

每个作品默认用 [DefaultWorkPage](src/pages/work/DefaultWorkPage.tsx)。要定制某一个，在
[src/pages/work/custom/](src/pages/work/custom/) 里写一个组件，然后在 `custom/index.ts` 里按 slug 注册：

```ts
export const customPages = {
  inkcity: lazy(() => import("./InkCityPage")),
};
```

组件会收到 `{ work }`，即 works.ts 里对应的数据。

## 数据脚本

- `pnpm data:map` — 从 `../ink-city/road-test/json/` 里的西安路网数据裁剪、简化出 `src/data/xian-map.json`
  （约 230 KB，gzip 后约 80 KB，按需加载）。每条路在离钟楼最近的点切开并朝外定向，前端按这个距离依次绘制，
  就形成了墨从中心晕开的效果。地图数据 © OpenStreetMap contributors（ODbL）。
- `pnpm data:qr` — 生成 `src/data/qr.json`，即联系方式二维码的模块矩阵，前端用 SVG 绘制。
  内容是从旧站三张二维码图片里解出来的链接。

## 结构

```
src/
  lib/          路由、主题（切换时交叉淡化）、淡入上浮与可见性 hook
  components/   导航、页脚、联系方式色块、二维码与弹窗
  visuals/      InkCityVisual（笔记本 + 路网壁纸）、CodeWindow（编辑器演示）、WatchClock（大笨钟）、Poster
  pages/        home、works、work（作品详情）、contact、404
  data/         作品、联系方式、生成的数据
scripts/        数据生成和构建后处理
```

## 备注

- 站点目前是 HTTP。剪贴板、`crypto.randomUUID` 这类只在安全上下文里可用的 API 不要直接依赖。
- 尊重系统的「减弱动态效果」设置：淡入、路网生长、打字演示都会退化为静态，首页吸附也会关闭。
