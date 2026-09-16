# 星辰大海 Hero 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个可以独立运行、独立预览、后续可嵌入 `czxwebsite` 的交互式“星辰大海”首屏：上方是可按真实观测参数计算的星穹，下方是动态海面和星空倒影，支持拖拽旋转、星宿选择，并且首屏先快速呈现接近当前视频/图片版本的视觉效果。

**Architecture:** 在 `antigravity/star-sea-hero` 下创建一个独立的 Next.js 静态导出项目，复用主站的 Next.js 15、React 19、TypeScript、Tailwind 方向，但不直接修改主站。视觉渲染核心使用原生 Three.js 封装为可复用的 `StarSeaHero` 客户端组件；星体位置由静态星表加观测地点、UTC 时间和坐标转换得到，天空、海面、倒影使用可独立降级的渲染层。独立页面和可复用组件共用同一套核心代码，未来接入主站时只需要动态加载组件并复用现有文案、导航和 loading 状态。

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Three.js, `astronomy-engine`, Tailwind CSS, Vitest, Playwright。

---

## 0. 关键产品决策

先固定以下约束，避免“真实星空”变成无法验收的抽象目标：

- “真实对应”必须绑定三个参数：观测地点、观测时间、观察方向。首版默认使用配置中的地点和当前时间；浏览器定位只在用户明确授权后启用，失败时回退到默认地点。
- 真实模式下，星星的赤经/赤纬会转换为指定地点和时间下的地平坐标，画面中的北、东、天顶关系可解释。自由旋转时允许浏览整个天幕，但界面要明确标识为自由探索，不把任意旋转后的画面继续称为实时地平视图。
- “整个星穹”采用 360 度可旋转浏览，而不是试图把不可同时看见的整颗天球压进一个视口。
- 星表首版优先覆盖肉眼可见的亮星和主要星宿，不在第一阶段接入体量过大的完整 Gaia 数据。数据源、授权和署名记录在 `DATA_SOURCES.md`。
- 初始体验先显示轻量静态 poster，再在首屏完成后挂载 WebGL；WebGL 不可用、用户开启减少动态或设备性能不足时，仍保留可读的静态/视频降级画面。
- 第一阶段不修改 `czxwebsite/src/components/Hero.tsx`、`src/app/page.tsx` 或主站 `public` 资源。

## 1. 目标目录结构

最终独立项目应接近以下结构：

```text
star-sea-hero/
  package.json
  next.config.mjs
  tsconfig.json
  tailwind.config.ts
  README.md
  DATA_SOURCES.md
  public/
    star-sea-poster.webp
    stars/
      stars.json
      constellation-lines.json
  src/
    app/
      globals.css
      layout.tsx
      page.tsx
    components/
      StarSeaHero.tsx
      StarSeaCanvas.tsx
      StarSeaControls.tsx
      StarSeaFallback.tsx
      StarSeaLoading.tsx
    data/
      defaultObserver.ts
    lib/
      astronomy/
        coordinates.ts
        observer.ts
        constellation.ts
      rendering/
        quality.ts
        scene.ts
        sky.ts
        ocean.ts
        reflection.ts
    types/
      astronomy.ts
  scripts/
    build-star-catalog.ts
  tests/
    coordinates.test.ts
    constellation.test.ts
    quality.test.ts
    smoke.spec.ts
```

## 2. 分阶段任务

### Task 1: 创建独立应用骨架

**Files:**

- Create: `star-sea-hero/package.json`
- Create: `star-sea-hero/next.config.mjs`
- Create: `star-sea-hero/tsconfig.json`
- Create: `star-sea-hero/tailwind.config.ts`
- Create: `star-sea-hero/src/app/layout.tsx`
- Create: `star-sea-hero/src/app/page.tsx`
- Create: `star-sea-hero/src/app/globals.css`
- Create: `star-sea-hero/DATA_SOURCES.md`

**Step 1: 写入与主站兼容的依赖和脚本**

`package.json` 至少提供：

```json
{
  "scripts": {
    "dev": "next dev -p 4010",
    "build": "next build",
    "start": "next start -p 4010",
    "lint": "eslint .",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

依赖使用与主站相同的大版本方向，并额外加入 `three`、`astronomy-engine`、`vitest`、`@playwright/test` 和对应类型包。不要把独立项目做成依赖主站源码路径的隐式应用。

**Step 2: 配置静态导出**

在 `next.config.mjs` 中复用主站的 `output: "export"` 和 `images.unoptimized: true`，确保以后既可以直接打开导出的静态目录，也可以部署到与主站相同的静态托管环境。

**Step 3: 写入最小占位页面**

`src/app/page.tsx` 先只渲染一个带背景色的 `Star Sea Hero` 标题和状态文本，确保项目能独立启动、构建和生成静态输出。

**Step 4: 运行验证**

Run:

```powershell
cd C:\Users\chenziyu\project\Agent\antigravity\star-sea-hero
npm install
npm run lint
npm run build
```

Expected:

- `npm run lint` 返回 0。
- `npm run build` 返回 0，并生成静态输出目录。
- `npm run dev` 后访问 `http://localhost:4010` 可以看到占位页面。

**Step 5: Commit**

```powershell
git add star-sea-hero
git commit -m "chore: scaffold standalone star sea hero"
```

如果独立目录没有单独 Git 仓库，则在现有仓库中只提交 `star-sea-hero` 目录，不能提交主站的无关改动。

### Task 2: 先做快速首屏和降级路径

**Files:**

- Create: `star-sea-hero/public/star-sea-poster.webp`
- Create: `star-sea-hero/src/components/StarSeaFallback.tsx`
- Create: `star-sea-hero/src/components/StarSeaLoading.tsx`
- Modify: `star-sea-hero/src/app/page.tsx`
- Modify: `star-sea-hero/src/app/globals.css`

**Step 1: 准备 poster**

以现有主站的 `czxwebsite/public/hero-poster.webp` 的暗色、蓝灰色和上下分层为视觉基线，生成一张独立的 `star-sea-poster.webp`。poster 只负责首屏第一帧和 WebGL 失败时的降级，不要把交互效果预渲染成过大的图片。

验收约束：

- WebP 或 AVIF。
- 目标体积不超过 250 KB。
- 内容必须同时露出星空、海平线和水面反光方向。
- 不依赖远程图片或运行时 API。

**Step 2: 建立 loading 状态**

`StarSeaLoading` 只负责很短的视觉过渡，不复制主站完整的 2700ms loading。建议状态为 `poster -> initializing -> interactive`，最长等待时间由 WebGL 初始化决定，并在超时后显示 fallback。

**Step 3: 建立 fallback**

`StarSeaFallback` 使用 poster 加少量 CSS 星点和渐隐海平线，提供同样的标题、查看作品和关于我入口。它必须在以下情况可用：

- `HTMLCanvasElement.getContext("webgl2")` 不可用。
- `prefers-reduced-motion: reduce`。
- Three.js 动态 chunk 加载失败。
- 页面切到后台或设备质量档位主动关闭 WebGL。

**Step 4: 添加首屏烟雾测试**

在 `tests/smoke.spec.ts` 中验证页面加载后：

- poster 或 fallback 在 WebGL 初始化前可见。
- 页面存在一个有可访问名称的主标题。
- WebGL 初始化失败时不会出现空白全屏。

**Step 5: 运行验证**

```powershell
npm run test:e2e -- smoke.spec.ts
npm run build
```

Expected: Playwright smoke test 全部通过，构建成功，浏览器禁用 WebGL 时仍能看到 poster/fallback。

### Task 3: 实现可延迟加载的 Three.js 场景壳

**Files:**

- Create: `star-sea-hero/src/components/StarSeaHero.tsx`
- Create: `star-sea-hero/src/components/StarSeaCanvas.tsx`
- Create: `star-sea-hero/src/lib/rendering/scene.ts`
- Create: `star-sea-hero/src/lib/rendering/quality.ts`
- Modify: `star-sea-hero/src/app/page.tsx`

**Step 1: 将 WebGL 组件放在客户端边界**

`StarSeaHero` 使用动态导入或用户端空闲时加载，页面首屏默认先输出 poster。不要在 `layout.tsx` 中导入 Three.js，避免它进入所有页面的初始 JS。

**Step 2: 建立生命周期**

`StarSeaCanvas` 负责：

- 创建 renderer、scene、camera 和 resize observer。
- 在 `requestAnimationFrame` 中统一更新时间。
- 组件卸载时释放 geometry、material、texture、render target 和 renderer。
- `visibilitychange` 时暂停渲染。
- 根据 `devicePixelRatio` 设置上限，避免高密度屏幕放大 GPU 压力。

**Step 3: 建立质量档位**

`quality.ts` 输出 `high`、`balanced`、`low` 三档，至少包含星星数量、海面网格密度、倒影分辨率、最大 DPR 和目标帧率。默认根据屏幕尺寸、WebGL 能力和 `navigator.hardwareConcurrency` 选择 `balanced`，不把检测结果作为稳定性前提。

**Step 4: 先放入静态天空占位**

先绘制深色天空渐变、少量程序化星点和海平线，不接真实星表。这样可以先验证画布尺寸、相机朝向、移动端裁切和 poster 到 WebGL 的切换。

**Step 5: 运行验证**

```powershell
npm run dev
```

使用桌面和窄屏浏览器检查：画布不会导致横向滚动；从 poster 切换到 WebGL 不会出现白屏、跳高或主站式文案遮挡；切换标签页后 CPU 使用量明显下降。

### Task 4: 接入真实星空数据和坐标转换

**Files:**

- Create: `star-sea-hero/src/types/astronomy.ts`
- Create: `star-sea-hero/src/data/defaultObserver.ts`
- Create: `star-sea-hero/src/lib/astronomy/observer.ts`
- Create: `star-sea-hero/src/lib/astronomy/coordinates.ts`
- Create: `star-sea-hero/src/lib/astronomy/constellation.ts`
- Create: `star-sea-hero/scripts/build-star-catalog.ts`
- Create: `star-sea-hero/public/stars/stars.json`
- Create: `star-sea-hero/public/stars/constellation-lines.json`
- Create: `star-sea-hero/tests/coordinates.test.ts`
- Create: `star-sea-hero/tests/constellation.test.ts`
- Modify: `star-sea-hero/DATA_SOURCES.md`

**Step 1: 定义数据模型**

至少定义：

```ts
type Observer = {
  latitude: number;
  longitude: number;
  elevation?: number;
  date: string;
};

type StarRecord = {
  id: string;
  name?: string;
  raHours: number;
  decDegrees: number;
  magnitude: number;
  colorIndex?: number;
  constellation?: string;
};

type ConstellationLine = {
  id: string;
  nameZh: string;
  nameEn: string;
  segments: Array<[string, string]>;
};
```

**Step 2: 固化星表构建过程**

脚本只把首版需要的亮星和星宿连线输出为浏览器可直接读取的压缩 JSON；不要在每次页面打开时解析原始大数据。脚本同时输出数据版本、来源、许可证和过滤规则到 `DATA_SOURCES.md`。

过滤规则先设为可配置，例如亮度阈值、星座数量和是否保留无名星。最终阈值以设备性能验收为准，不在代码里散落魔法数字。

**Step 3: 实现坐标转换**

`coordinates.ts` 需要完成：

1. 读取赤经/赤纬。
2. 根据 UTC 时间和观测地点计算当地恒星时。
3. 转换为地平坐标：方位角、地平高度。
4. 转换到 Three.js 世界坐标，约定 `Y` 为天顶、`-Y` 为海平面，并记录北、东、南、西的方向。
5. 对低于地平线的星体做过滤或放入海面下的反射候选集合。

**Step 4: 先写数学测试**

至少覆盖：

- 同一地点同一时间同一星体结果稳定。
- 时间前进后星体方位按恒星时变化。
- 北方、天顶、地平线边界的坐标方向正确。
- 纬度、经度输入越界会被拒绝。
- 低于地平线的星体不会被错误绘制到天空。

**Step 5: 运行验证**

```powershell
npm run test -- coordinates.test.ts constellation.test.ts --run
```

Expected: 所有坐标和星宿数据测试通过；抽取 3 个已知亮星，在固定地点和日期下与独立天文计算结果的误差落在预设角度容差内，并把该容差写进测试注释。

### Task 5: 绘制星穹、星宿和选择交互

**Files:**

- Modify: `star-sea-hero/src/lib/rendering/sky.ts`
- Modify: `star-sea-hero/src/lib/rendering/scene.ts`
- Modify: `star-sea-hero/src/components/StarSeaControls.tsx`
- Modify: `star-sea-hero/src/components/StarSeaCanvas.tsx`
- Modify: `star-sea-hero/src/lib/astronomy/constellation.ts`

**Step 1: 绘制星点**

使用 `THREE.Points` 和 buffer attributes 批量绘制星星，不为每颗星创建一个 mesh。星点大小、颜色和亮度由星等与质量档位计算，避免每帧重新创建对象。

**Step 2: 绘制星宿连线**

使用单个或少量 `LineSegments` buffer 绘制连线。默认低对比度，选中星宿后提高线宽/透明度并显示名称，避免整个画面变成密集的图表。

**Step 3: 增加旋转**

桌面支持拖拽和鼠标滚轮，移动端支持单指拖拽和双指缩放。旋转状态以“用户视角偏移”保存，不修改原始天文坐标；真实模式下显示当前朝向，手动旋转后切换为自由探索状态。

**Step 4: 增加选择**

对星点或星宿建立可控的 picking 层。命中后更新 `selectedConstellation`，显示中文名、英文名、主要亮星和当前高度/方位角。点击空白区域取消选择，键盘 `Escape` 也能取消。

**Step 5: 添加时间、地点和模式控件**

控件至少包括：

- 真实模式 / 自由探索模式。
- 当前地点的只读摘要和“允许定位”操作。
- 日期时间输入或时间滑杆。
- 星宿选择菜单。
- 质量档位和减少动态开关。

控件使用 DOM 覆盖层而不是把文字画进 WebGL，保证可访问、可翻译和移动端可折叠。按钮使用现有设计语言，并为纯图标控件提供可访问名称和 tooltip。

**Step 6: 运行验证**

桌面和移动端分别验证：

- 拖拽不会触发页面意外滚动。
- 选中星宿后连线、标签和控制面板不会互相遮挡。
- 键盘可以聚焦、选择和退出。
- 时间改变会让星空位置变化，地点改变会改变地平关系。

### Task 6: 实现动态海面和星空倒影

**Files:**

- Create: `star-sea-hero/src/lib/rendering/ocean.ts`
- Create: `star-sea-hero/src/lib/rendering/reflection.ts`
- Modify: `star-sea-hero/src/lib/rendering/scene.ts`
- Modify: `star-sea-hero/src/components/StarSeaCanvas.tsx`
- Modify: `star-sea-hero/src/lib/rendering/quality.ts`

**Step 1: 创建海面几何**

使用有限分辨率的平面网格作为海面，避免无限高密度细分。顶点位移由两到三组不同方向、不同速度的波函数叠加生成，波面要保持小幅度，避免遮住星空主体。

**Step 2: 创建海面材质**

海面材质需要支持：

- 深蓝黑底色。
- 远处海平线的低亮度雾化。
- 随时间变化的法线/扰动。
- 根据视角变化的高光。
- 倒影混合强度随距离和波面角度衰减。

**Step 3: 创建倒影**

优先使用镜像相机和低分辨率 render target 渲染天空，再把结果采样到海面材质。倒影 render target 的分辨率随质量档位变化；如果设备不支持或帧率低于阈值，退化为基于星点高度和噪声的近似倒影，而不是关闭整片海面。

**Step 4: 处理海平线和相机**

天空与海面必须在同一世界坐标中共享北、东、南、西方向。调整相机俯仰时，海平线不能漂移；旋转天穹时，星空和倒影使用同一视角偏移。

**Step 5: 运行验证**

检查默认视角、拖拽旋转、时间变化和窗口 resize：

- 海面始终有连续涟漪。
- 星光倒影随星空旋转和波面变化而变化。
- 没有明显的倒影撕裂、上下方向颠倒或海平线跳动。
- `low` 档不创建高分辨率 render target。

### Task 7: 性能、首屏和无障碍验收

**Files:**

- Modify: `star-sea-hero/src/components/StarSeaHero.tsx`
- Modify: `star-sea-hero/src/components/StarSeaCanvas.tsx`
- Modify: `star-sea-hero/src/components/StarSeaFallback.tsx`
- Modify: `star-sea-hero/src/lib/rendering/quality.ts`
- Modify: `star-sea-hero/src/app/globals.css`
- Modify: `star-sea-hero/tests/smoke.spec.ts`
- Create: `star-sea-hero/docs/performance-budget.md`

**Step 1: 延迟加载重依赖**

确认主页面初始 bundle 不包含 Three.js 和星表；只有进入 Hero、浏览器空闲或用户主动点击“探索星空”后才加载交互模块。首屏 poster 不能等待星表或 WebGL 初始化。

**Step 2: 增加运行时降级**

实现以下策略：

- `requestIdleCallback` 不存在时使用短延迟 fallback。
- `visibilitychange` 时暂停 render loop。
- 使用 `prefers-reduced-motion` 时停用涟漪和自动动画，但保留拖拽查看。
- 连续帧率低于阈值时降级星点数量、海面网格和倒影分辨率。
- WebGL 初始化异常时记录可诊断错误并显示 poster/fallback，不阻塞页面内容。

**Step 3: 固化性能预算**

将目标写入 `docs/performance-budget.md`：

- poster 是首个可见内容，不等待 WebGL。
- 首屏主线程不执行大规模星表转换。
- 初始交互模块按需加载。
- 默认档位在中等设备上目标 30 FPS 以上，桌面设备目标 45 FPS 以上。
- 页面不可因 WebGL 失败出现全屏空白。
- 页面切到后台后停止动画循环。

具体数值以 Playwright 和浏览器 Performance 面板实测为准，不能只用主观“感觉流畅”验收。

**Step 4: 做可访问性检查**

确保：

- Hero 有明确的 `section` label 和可读标题。
- 所有控制项有可访问名称。
- 星宿选择结果同步到 DOM 文本，而不是只有画布视觉变化。
- 减少动态模式下没有快速移动的涟漪和自动旋转。
- 小屏幕上控件可折叠，且不覆盖主要星空区域。

**Step 5: 运行验证**

```powershell
npm run lint
npm run test -- --run
npm run test:e2e
npm run build
```

Expected:

- lint、单元测试、E2E 全部通过。
- 静态构建成功。
- 桌面 1440px、平板 768px、手机 390px 三种视口没有横向滚动或内容重叠。
- 禁用 WebGL、启用减少动态、切换后台三种场景都能正常结束加载并保留可用页面。

### Task 8: 独立预览和接入主站准备

**Files:**

- Modify: `star-sea-hero/README.md`
- Create: `star-sea-hero/docs/integration-to-czxwebsite.md`
- Do not modify: `czxwebsite/src/components/Hero.tsx`
- Do not modify: `czxwebsite/src/app/page.tsx`

**Step 1: 写独立项目运行说明**

README 说明：

```powershell
cd C:\Users\chenziyu\project\Agent\antigravity\star-sea-hero
npm install
npm run dev
```

访问 `http://localhost:4010` 查看完整效果；生产预览使用 `npm run build` 后执行 `npm run start`。

**Step 2: 记录未来接入方案**

`docs/integration-to-czxwebsite.md` 记录两种方案：

1. 推荐：把 `StarSeaHero` 的组件和 `src/lib` 核心代码作为本地包或 workspace package 引入主站，在主站 `Hero.tsx` 中通过 `dynamic(..., { ssr: false })` 按需加载。
2. 备选：把独立项目的 `src/components` 和 `src/lib` 复制进主站，保留独立项目作为演示和回归基准。

接入时需要复用主站现有的：

- `useLanguage` 和 `translations.hero`。
- `LoadingScreen` 的结束时机或已有 sessionStorage 逻辑。
- `/hero-poster.webp` 的视觉基线，或把新的 poster 迁移到主站 `public`。
- `Hero.tsx` 现有的 CTA 滚动行为。

接入时不要让 Three.js 进入主站所有页面的公共 bundle，也不要在 SSR 阶段创建 WebGL 对象。

**Step 3: 建立接入前验收门槛**

只有以下条件全部满足，才开始修改主站：

- 独立项目能 `npm run build`。
- poster 到交互场景的切换稳定。
- 真实地点/时间/方向的坐标测试通过。
- 星宿选择和自由旋转在桌面、移动端都可用。
- 海面倒影在默认和降级质量档位都存在。
- 无 WebGL 和减少动态模式仍可用。
- 性能预算和截图/录屏结果已记录。

## 3. 最终验收清单

- [ ] `star-sea-hero` 可以脱离 `czxwebsite` 单独安装、启动、构建和预览。
- [ ] 第一帧先显示接近当前主站的视频/图片版本的星空海面视觉，不等待 WebGL。
- [ ] 默认星空由真实星表和明确的地点、时间、方向计算得到。
- [ ] 用户可以拖拽旋转天穹，并能区分真实模式与自由探索模式。
- [ ] 用户可以选择主要星宿，看到名称、连线和基本观测信息。
- [ ] 海面有持续但克制的涟漪，星空能在海面产生方向一致的动态倒影。
- [ ] 低性能设备、WebGL 失败、减少动态和后台切换都有可接受的降级行为。
- [ ] 桌面、平板、手机没有横向滚动、内容遮挡或控制项溢出。
- [ ] 没有在第一阶段修改 `czxwebsite`；主站接入作为单独决策和单独变更。

## 4. 建议的提交顺序

```text
chore: scaffold standalone star sea hero
feat: add poster first loading and webgl fallback
feat: add deferred three scene shell
feat: add astronomy catalog and coordinate conversion
feat: add constellation selection and sky controls
feat: add animated ocean and star reflection
perf: add adaptive quality and reduced motion support
docs: record standalone preview and website integration
```

每个提交都应能单独构建；不要把主站 Hero 替换和独立项目的渲染开发放在同一个提交中。
