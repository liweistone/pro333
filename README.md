# 万象智造 (BatchMaster Pro) - Enterprise Vision OS

![Version](https://img.shields.io/badge/version-5.5.0--STABLE-red) ![React](https://img.shields.io/badge/React-19-cyan) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![API](https://img.shields.io/badge/API-Apimart%20Gateway-orange)

**万象智造 (BatchMaster Pro)** 是一款企业级 AI 电商视觉生产系统。本项目采用**第三方 API 网关集成方案 (Apimart Gateway)**，通过统一的接口标准调用高性能 AI 模型（如 Gemini 3 Pro, Sora-2 等），实现了从**策略分析 -> 3D 辅助 -> 批量生图 -> 视频生成**的全链路闭环，无需依赖官方 SDK 或特定云厂商环境。

---

## 🏗 技术架构 (Tech Stack)

### 核心框架
*   **前端框架**: React 19, TypeScript, Vite
*   **UI 系统**: Tailwind CSS, Lucide React
*   **3D 引擎**: Three.js, React Three Fiber (用于 Pro Studio 虚拟影棚)

### AI 模型集成 (Third-Party Gateway)
本项目**不使用** Google 官方 SDK 直接通信，而是通过适配器模式封装了第三方网关调用。

*   **API Provider**: `ApimartProvider` (`services/providers/apimartProvider.ts`)
*   **API Endpoint**: `https://api.apimart.ai/v1` (及兼容接口)
*   **核心模型映射**:
    *   **图像生成**: `gemini-3.1-flash-image-preview` (旗舰 4K 输出，带自动兜底)
    *   **多模态分析**: `gemini-3.1-pro` (用于深度策划与剧本解析)
    *   **视频生成**: `sora-2` (支持图生视频与流光特效)

---

## 🚀 快速开始 (Getting Started)

### 1. 环境准备
```bash
node -v # 需 v18+
npm install
```

### 2. 配置 API 密钥
由于使用第三方网关，您需要在 `.env.local` 中配置网关提供的 Key，或者在应用启动后的**设置面板**中直接输入。

**方式 A: 环境变量**
```env
# .env.local
# 请填入您的 Apimart 或兼容网关的 API Key (通常以 sk- 开头)
AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**方式 B: 前端配置 (推荐)**
1. 启动应用。
2. 点击右上角 <Settings /> 图标。
3. 在弹出的“API 配置管理”中输入密钥，系统将存储于本地 `LocalStorage`。

### 3. 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

---

## 🧩 子应用架构与 API 调用分析

系统采用 **Bento Grid** 启动台，包含 11 个独立子应用。所有应用均通过 `services/adapters` 目录下的适配器与后端通信。

| 应用 ID | 应用名称 | 核心功能 | API 调用路径 |
| :--- | :--- | :--- | :--- |
| **App 1** | **3D Studio Pro** | 3D 骨骼/布光辅助生图 | `ImageAdapter` -> `ApimartProvider` |
| **App 2** | **Batch Master** | 图像裂变与变体生成 | `ImageAdapter` -> `ApimartProvider` |
| **App 3** | **Poster Lab** | 海报重构与元素拆解 | `MultimodalAdapter` (分析) + `ImageAdapter` (重绘) |
| **App 4** | **E-com Planner** | 全案策划书生成 | `MultimodalAdapter` (生成长文案) |
| **App 5** | **Refine Factory** | 画质增强与精修 | `ImageAdapter` (高分辨率模式) |
| **App 6** | **Lumiere Flux** | 静态图转光效视频 | `MultimodalAdapter` (剧本) + `VideoAdapter` (视频) |
| **App 7** | **Preset Hub** | 提示词资产库 | 连接 Cloudflare D1 (独立 API) |
| **App 8** | **Batch Correct** | 局部重绘与元素替换 | `ImageAdapter` (Inpainting 模式) |
| **App 9** | **Lumiere Station** | 多模态综合工作站 | 聚合调用 `ImageAdapter` & `VideoAdapter` |
| **App 10** | **Vision Director** | 视觉基因解构与 9 组分镜 | `MultimodalAdapter` (解构) + `ImageAdapter` (拍摄) |
| **App 11** | **CNY Station** | 2026 马年贺岁海报全案策划 | `MultimodalAdapter` (策划) + `ImageAdapter` (生图) |

---

## 🛠️ 关键目录结构

```
/
├── services/               # 核心服务层
│   ├── adapters/           # [适配器模式] 统一封装不同类型的 AI 能力
│   │   ├── imageAdapter.ts       # 图像生成适配器 (旗舰/VIP 模型切换)
│   │   ├── videoAdapter.ts       # 视频生成适配器 (Sora-2 等模型)
│   │   ├── multimodalAdapter.ts  # 多模态分析适配器 (支持 Structured JSON)
│   │   └── taskAdapter.ts        # 异步任务轮询适配器
│   └── providers/          # [供应商实现] 具体对接第三方 API
│       └── apimartProvider.ts    # Apimart 网关的具体请求实现
├── app1/ ~ app11/          # 各子应用源码 (独立沙箱)
├── apiConfig.ts            # 全局密钥管理 (LocalStorage 读写)
└── App.tsx                 # 主启动台 (Launcher)
```

## ⚠️ 开发注意

1.  **模型一致性**: 所有子应用默认强制使用 `gemini-3.1-flash-image-preview` 以保证画质统一。
2.  **异步轮询**: 由于高清生图耗时较长，务必使用 `TaskAdapter` 进行状态监控，并提供清晰的百分比进度反馈。
3.  **安全性**: API 密钥仅在客户端 LocalStorage 存储，请勿将测试密钥提交至代码仓库。

---

**© 2025 万象智造 (BatchMaster Pro) 团队.**
*让每一位电商人拥有顶级视觉生产力。*