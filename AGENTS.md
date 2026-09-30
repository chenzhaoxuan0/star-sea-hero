---
name: star-sea-hero 部署链路
description: star-sea-hero 由 Cloudflare Pages 连接 GitHub 仓库自动部署，push 即上线
metadata:
  type: project
---

`star-sea-hero`（`C:\Users\chenziyu\project\Agent\antigravity\star-sea-hero`）的 Cloudflare Pages 项目 `star-sea-hero` **已连接 GitHub 仓库并开启自动构建**。`git push` 到 `main` 之后 Cloudflare 自己跑 build 并上线，**不需要手动上传 `out/`**。线上：`https://galaxy.zxcorner.cn/`（自定义域名）、`https://star-sea-hero.pages.dev/`（Pages 原生域名）。

**Why:** 2026-10-01 排查 8K 银河贴图问题时，我先入为主认为"没有 CI 就是手动上传 `out/`"，据此要求用户手动部署，还把这个错误结论写进了本文件。实际上 Pages 的 Git 集成在 Cloudflare 自己的环境里构建，**不需要仓库里有 `.github/workflows`** —— 仓库没有 CI 与 Pages 是否自动部署是两件事。当时用户已经手动传过一次，导致线上一度是旧构建，我误判成"用户没重新部署"。

**How to apply:** 改完代码 `git push` 到 `main` 即可，然后等 Cloudflare 构建完成再验收。**不要**要求用户手动 build 或上传 `out/`。确认线上是否已更新：比对 `out/index.html` 与线上首页引用的 `_next/static/chunks/app/page-*.js` 文件名（Next.js 用内容哈希做 chunk 名，不同即不同构建）；也可以在 chunk 里 grep 该次提交独有的常量做内容级确认。

另外，本机的代理 `127.0.0.1:7897` 到 `*.pages.dev` / `galaxy.zxcorner.cn` 的 TLS 是断的（隧道能建、源站握手失败）。用 curl 探测这些域名必须加 `--noproxy '*'`，否则会误判成站点故障。

注意 `next build` 和 `next dev` 共用同一个 `.next` 目录，在 dev server 运行时执行 build 会让 dev 报 `MODULE_NOT_FOUND`，需要重启 dev server。
