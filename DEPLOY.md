# SSTI Master 部署与运行终极指南

## 核心问题解答：为什么 Vercel 部署后是黑色界面？
Vercel 默认会将本项目识别为“静态 HTML”。然而，本项目包含大量的 `.tsx` (TypeScript) 文件。如果直接作为静态文件分发，浏览器无法运行这些代码，导致页面无法初始化。

**解决方案**：通过提供 `package.json`，Vercel 会自动切换到 **Vite 构建模式**，在云端将代码编译为标准的 JavaScript，从而解决黑屏问题。

---

## 方案一：Vercel 云端部署 (推荐)

如果 Vercel 拖放文件夹失败（通常是因为文件过多或网络不稳定），请使用 **GitHub 关联法**，这是目前最稳健的方式：

1. **上传到 GitHub**：
   - 创建一个新的 **Private (私有)** 仓库。
   - 将下载的所有文件（包含新生成的 `package.json`）上传到仓库中。
2. **在 Vercel 中导入**：
   - 登录 [Vercel](https://vercel.com/)。
   - 点击 **Add New** -> **Project**。
   - 找到您刚才创建的 GitHub 仓库，点击 **Import**。
3. **完成配置**：
   - Vercel 会自动识别到 `package.json`。
   - 在 **Framework Preset** 中，确保它显示为 **Vite**。
   - 点击 **Deploy**。等待约 30 秒，您的工具就永久上线了。

---

## 方案二：本地运行 (Windows)

1. **解压**：确保所有文件都在同一文件夹。
2. **安装 Node.js (强烈推荐)**：
   - 访问 [nodejs.org](https://nodejs.org/) 安装 LTS 版本。
   - 安装后，双击 `start-app.bat`，它会自动运行 `npm install` 并启动。
3. **降级运行 (Python)**：
   - 如果您不想安装 Node.js，只要安装了 Python 也可以运行。
   - 但注意：在本地使用 Python 启动时，浏览器可能会因为安全策略拦截某些 TS 功能。**云端部署到 Vercel 始终是最佳体验。**

---

## 故障排除
- **界面依然黑色**：打开浏览器开发者工具 (F12)，查看 Console 报错。如果是 `MIME type` 报错，请检查 Vercel 的构建设置是否为 "Vite"。
- **API Key 无效**：确保您的项目环境中有正确的 API 配置。