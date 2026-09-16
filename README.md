# Star Sea Hero

这是个人网站“星辰大海”独立实验项目的规划目录。

实施计划：

- [2026-09-15 星辰大海 Hero 实施计划](docs/plans/2026-09-15-star-sea-hero.md)

## 本地预览

```powershell
cd C:\Users\chenziyu\project\Agent\antigravity\star-sea-hero
npm install
npm run dev
```

打开 `http://localhost:4010`。

生产静态构建：

```powershell
npm run lint
npm run build
npx tsc --noEmit
```

## 当前进度

- 已完成独立 Next.js 静态导出骨架。
- 已完成 52 KB 首屏 poster、WebGL 失败 fallback 和减少动态 fallback。
- 已完成延迟加载 Three.js 场景、质量档位、页面隐藏时暂停渲染和拖拽旋转。
- 已接入亮星坐标、观测地点/时间转换、星宿线段和动态海面 shader。
- 尚未完成：低分辨率镜像相机倒影、可视化星宿选择面板、浏览器定位、完整星表脚本、Playwright E2E 和跨设备截图验收。

第一阶段只在本目录内构建和预览，不修改上层 `czxwebsite`。通过完整验收后，再决定是否接入个人网站。
