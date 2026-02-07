# SSTI Master 部署与运行指南

这款工具使用了现代前端技术栈（React + ESM），为了安全起见，不能直接双击 `index.html` 运行。以下是两种最快的运行方式：

## 方式一：本地运行（推荐）

1. **安装环境**：确保电脑安装了 [Python](https://www.python.org/)（记得勾选 "Add Python to PATH"）。
2. **解压文件**：将所有下载的文件放在同一个文件夹里。
3. **双击启动**：运行 `start-app.bat`。它会自动开启一个本地服务并在浏览器中打开。

## 方式二：云端部署（永久访问）

如果你希望随时随地访问，推荐使用 Vercel 或 Netlify，完全免费：

### 1. 使用 Vercel (最快)
1. 访问 [Vercel](https://vercel.com/)。
2. 将该项目文件夹拖入 Vercel 的上传框。
3. 等待 10 秒，你就会得到一个专属于你的 `.vercel.app` 网址。

### 2. 使用 GitHub Pages
1. 在 GitHub 上创建一个新的仓库。
2. 上传所有文件。
3. 在仓库设置 (Settings) -> Pages 中，选择 `main` 分支发布。

---
**为什么直接打开 index.html 是白屏？**
现代浏览器为了防止跨站脚本攻击，禁止从 `file://` (本地文件路径) 加载模块化的 JavaScript 文件。必须通过 `http://` (服务器路径) 才能正常工作。