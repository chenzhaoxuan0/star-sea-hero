---
name: star-sea-hero 部署链路
description: star-sea-hero 无 CI，靠手动上传 out/ 到 Cloudflare Pages；线上域名 galaxy.zxcorner.cn
metadata:
  type: project
---

`star-sea-hero`（`C:\Users\chenziyu\project\Agent\antigravity\star-sea-hero`）**没有 CI**，仓库里没有 `.github/`，推送到 GitHub 不会触发任何部署。部署方式是手动把 `next build` 产出的 `out/` 整个目录上传到 Cloudflare Pages。线上域名 `https://galaxy.zxcorner.cn/`（仓库里查不到这个域名，只在对话里出现过）。

**Why:** 2026-10-01 修完 8K 银河渐进加载后，用户"已经部署成功"了，但线上跑的还是修复前的旧构建——因为 `git push` 与 `out/` 上传是两个独立动作，中间没有任何东西保证它们同步。诊断时我先怀疑托管侧、最后靠 chunk 内容哈希比对才定位到是构建过期。

**How to apply:** 每次改完代码告诉用户两件事：(1) 需要 `npm run build`，(2) 需要重新上传 `out/`。不要因为"已经 push 了"就假定线上已更新。要确认线上版本是否最新，比对 `out/index.html` 与线上首页引用的 `_next/static/chunks/app/page-*.js` 文件名（Next.js 用内容哈希做 chunk 名，不同即不同构建）。

注意 `next build` 和 `next dev` 共用同一个 `.next` 目录，在 dev server 运行时执行 build 会让 dev 报 `MODULE_NOT_FOUND`，需要重启 dev server。
