<div align="center">
<img width="1200" height="475" alt="Grsai Batch Pro Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Grsai Batch Pro - 电商批量出图大师

这是一个专为电商领域设计的高级 AI 批量绘图工作流应用。它利用 **Grsai Nano Banana Pro** 引擎的高性能绘图能力，并结合 **Vision AI** 的多模态分析，实现“一张参考图生成数十张视角一致、光影专业”的商业主图。

## 🌟 核心功能

- **智能视觉锚定**：AI 深度识别产品或人物的“固定视觉指纹”，确保不同角度下细节一致。
- **20+ 视角一键生成**：内置专业摄影机位模板（全身、特写、俯拍、艺术视角等）。
- **4K 超清输出**：支持从 1K 到 4K 的多分辨率渲染。
- **一键打包下载**：生成的素材可直接打包为 ZIP 文件，无需手动点击。

---

## 💻 本地运行教程

按照以下步骤，您可以在自己的电脑上部署并运行此应用程序。

### 1. 环境准备

在开始之前，请确保您的电脑已安装以下软件：
- **Node.js**: 建议版本为 `v18.0.0` 或更高（推荐使用 LTS 版本）。
- **npm**: 随 Node.js 一起安装。
- **浏览器**: 推荐使用最新版的 Chrome、Edge 或 Safari。

### 2. 安装步骤

1. **下载项目代码**：
   将项目下载或克隆到本地文件夹中。

2. **打开终端 (Terminal)**：
   在项目根目录下打开终端或命令行工具。

3. **安装依赖项**：
   运行以下命令来安装所有必需的组件：
   ```bash
   npm install
   ```

### 3. 配置 API Key

虽然应用内部已硬编码了一些公共 Key，但为了保证稳定性，建议配置您自己的 API 环境：

1. 在项目根目录下，找到或创建一个名为 `.env.local` 的文件。
2. 添加以下内容：
   ```env
   AI_API_KEY=您的_API_KEY
   ```
   *注意：项目目前的 `visionService.ts` 已经预设了 Grsai 的 API Key，通常无需额外修改即可运行。*

### 4. 启动开发服务器

在终端中运行以下命令：
```bash
npm run dev
```

### 5. 访问应用

启动成功后，终端会显示类似以下的信息：
```
  VITE v6.2.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```
打开浏览器并访问 `http://localhost:3000/` 即可开始使用。

---

## 🛠️ 常见问题 (FAQ)

- **Q: 为什么图片生成很慢？**
  - A: 4K 分辨率的生成涉及大量的算力调度，通常需要 30-60 秒。1K 分辨率速度最快。
- **Q: 批量下载无法使用？**
  - A: 请确保浏览器没有阻止弹出窗口。由于涉及图片跨域下载，建议在最新版 Chrome 中运行。
- **Q: 能否修改提示词？**
  - A: 您可以使用“智能分析”自动生成后，切换到“手动配置”选项卡对生成的文字进行微调。

## 🚀 部署

如果您需要将其部署到服务器，请运行：
```bash
npm run build
```
编译后的静态文件将生成在 `dist` 目录中。

---

在 AI Studio 中查看您的应用: [AI Studio - Grsai Batch Pro](https://ai.studio/apps/drive/1h2V0s-wRvXYltllHuZiJL5fzs6aBD4qV)