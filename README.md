# Claude Code Auto Refresh Agent

一个智能的 Claude Code 自动刷新代理，用于保持后端 5 小时计价的活跃状态。通过在每个整点后的随机 1-5 分钟发送保活消息，确保您的 Claude Code 服务始终保持活跃。

## 🎯 使用场景

**目标**：活用一天约 5 个 Claude 会话配额

**典型场景**：工作时间 9:00-12:00，14:00-18:00，20:00-22:00

**最佳配置**：
```env
SCHEDULE_MODE=custom
CUSTOM_START_HOUR=6
CUSTOM_END_HOUR=22
```

**效果对比**：
- ❌ 普通配置：9:00-14:00，14:00-19:00，19:00-24:00（浪费早晨时段）
- ✅ 优化配置：6:00-11:00，11:00-16:00，16:00-21:00，21:00-2:00（完全覆盖工作时间）

[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/typescript-5.5+-blue)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/node.js-22+-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## ✨ 功能特性

- 🚀 **首次启动立即发送**：启动后立即发送保活消息，无需等待
- 🔄 **智能调度系统**：支持 24*7 和自定义时间段两种调度模式
- ⏱️ **自定义执行间隔**：支持 5-1440 分钟任意间隔，默认 60 分钟
- 🕰️ **自定义模式**：支持工作日和工作时间段限制（如周一到周五 9:00-18:00）
- 🔑 **灵活配置方式**：支持统一 Endpoint + 多个 API Key 配置
- 🏠 **独立实例管理**：每个 API Key 使用独立的 Claude Code 实例
- 📊 **完整日志输出**：显示 AI 回复内容和成本信息
- 🐳 **Docker 部署**：支持 Docker 和 docker-compose 一键部署
- 🕐 **时区支持**：默认使用 Asia/Shanghai 时区
- 🔧 **向下兼容**：支持传统的分组配置方式
  
说明：应用内部显式使用 `TZ` 指定的时区（默认 `Asia/Shanghai`）来安排与触发定时任务，避免服务器/容器本地时区差异导致的偏移。

## 🚀 快速开始

### 方式一：推荐配置（统一 Endpoint）

```bash
# 1. 克隆项目
git clone https://github.com/helloandworlder/claude-code-auto-refresh.git
cd claude-code-auto-refresh

# 2. 配置环境变量
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 统一 Endpoint + 多个 API Key 配置（推荐）
CLAUDE_ENDPOINT=https://claude-relay.synex.im/api
CLAUDE_API_KEYS=your-api-key-1,your-api-key-2,your-api-key-3

# 调度模式配置
SCHEDULE_MODE=hourly  # hourly: 24*7模式, custom: 自定义模式

# 自定义模式配置（可选，仅在 SCHEDULE_MODE=custom 时生效）
CUSTOM_START_HOUR=9      # 开始小时 (0-23)
CUSTOM_END_HOUR=18       # 结束小时 (0-23)
CUSTOM_WEEKDAYS=1,2,3,4,5  # 工作日 (0=周日,1=周一,...,6=周六)

# 可选：自定义间隔（分钟，5-1440，默认60）
INTERVAL_MINUTES=30  # 每30分钟执行一次

# 可选：日志级别
LOG_LEVEL=info
```

### 方式二：传统分组配置

```env
# 传统分组方式（向下兼容）
CLAUDE_GROUP_1_ENDPOINT=https://claude-relay.synex.im/api
CLAUDE_GROUP_1_API_KEY=your-api-key-1

CLAUDE_GROUP_2_ENDPOINT=https://api.anthropic.com
CLAUDE_GROUP_2_API_KEY=your-api-key-2

# 可选：日志级别
LOG_LEVEL=info
```

### 🐳 Docker 部署（推荐）

#### 方式1：使用预构建镜像（推荐）
```bash
# 1. 克隆仓库或下载配置文件
git clone https://github.com/sczheng189/claude-code-auto-refresh.git
cd claude-code-auto-refresh

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置你的 API keys

# 3. 启动服务（使用预构建镜像，无需构建时间）
docker-compose up -d

# 查看实时日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 方式2：本地构建（适合开发者）
```bash
# 1. 克隆仓库
git clone https://github.com/sczheng189/claude-code-auto-refresh.git
cd claude-code-auto-refresh

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 修改 docker-compose.yml
# 注释 image: 行，取消注释 build: . 行

# 4. 构建并启动
docker-compose up -d --build
```

#### 仅下载配置文件（最轻量）
```bash
# 只下载必要文件，无需完整仓库
curl -O https://raw.githubusercontent.com/sczheng189/claude-code-auto-refresh/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/sczheng189/claude-code-auto-refresh/main/.env.example

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件
nano .env

# 启动服务
docker-compose up -d
```

### 💻 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产模式
npm run build
npm start
```

## 📋 运行日志示例

```
Claude Code Auto Refresh Agent Starting...
Loaded unified configuration: 2 API keys with endpoint: https://claude-relay.synex.im/api
Initialized with 2 Claude groups
Starting task scheduler...
Sending initial keep-alive messages for all groups...
[INITIAL] Sending keep-alive message for key_1...
[key_1] Sending keep-alive message to https://claude-relay.synex.im/api
[key_1] Response: "1" | Cost: $0.0311
[key_1] Keep-alive message sent successfully
Scheduling tasks for hour 18:00
Scheduled task for key_1 at 8/21/2025, 6:03:00 PM
Scheduled task for key_2 at 8/21/2025, 6:01:00 PM
Agent is running. Press Ctrl+C to stop.
```

## ⚙️ 工作原理

1. **🎯 智能调度**：按配置的间隔（默认每小时，可通过 INTERVAL_MINUTES 自定义），为每个 API Key 安排一个随机时间（1-5 分钟内）的保活任务
2. **💬 保活消息**：发送简单的消息 `"Please only output '1'"` 来保持后端活跃
3. **🔄 首次启动**：启动后立即发送一次保活消息，确保服务立即激活
4. **⚡ 并行执行**：多个 API Key 的任务并行处理，提高效率
5. **📊 完整监控**：显示 AI 回复内容、成本信息和调度状态
6. **🔒 并发安全**：对每个分组调用时，通过专属 `env` 向 SDK 注入该组的 `endpoint`/`apiKey`，不修改全局环境变量，避免并发竞态

## 📊 配置说明

### 环境变量

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `CLAUDE_ENDPOINT` | 统一的 API 端点 | `https://claude-relay.synex.im/api` | 是* |
| `CLAUDE_API_KEYS` | API 密钥列表（逗号分隔） | `key1,key2,key3` | 是* |
| `SCHEDULE_MODE` | 调度模式 | `hourly`/`custom` | 否 |
| `CUSTOM_START_HOUR` | 自定义模式开始小时 | `9` | 否*** |
| `CUSTOM_END_HOUR` | 自定义模式结束小时 | `18` | 否*** |
| `CUSTOM_WEEKDAYS` | 自定义模式工作日 | `1,2,3,4,5` | 否*** |
| `INTERVAL_MINUTES` | 自定义执行间隔（分钟） | `30` | 否 |
| `CLAUDE_GROUP_N_ENDPOINT` | 第 N 组的 API 端点 | `https://api.anthropic.com` | 否** |
| `CLAUDE_GROUP_N_API_KEY` | 第 N 组的 API 密钥 | `your-api-key` | 否** |
| `LOG_LEVEL` | 日志级别 | `info`/`debug`/`warn`/`error` | 否 |
| `TZ` | 时区设置 | `Asia/Shanghai` | 否 |
| `KEEPALIVE_TIMEOUT_MS` | 单次保活请求超时（毫秒） | `60000` | 否 |

\* 使用统一配置时必填  
\*\* 使用传统分组配置时必填  
\*\*\* 仅在 `SCHEDULE_MODE=custom` 时相关


## 🔄 调度机制

### Hourly 模式（默认）
- **24*7 运行**：全天候保活
- **启动时**：立即发送保活消息给所有配置的 API Key
- **定时任务**：按配置的间隔执行（默认每小时，可通过 INTERVAL_MINUTES 自定义）
- **任务分布**：不同 API Key 的任务时间随机分布，避免同时请求

### Custom 自定义模式
- **工作时间限制**：仅在指定时间段内发送保活消息（如 9:00-18:00）
- **工作日限制**：仅在指定工作日发送（如周一到周五）
- **排程阶段过滤非工作日**：为"下一小时"生成任务时，会同时检查其对应的星期；非工作日不生成任务，避免产生不可执行的排程
- **灵活配置**：支持跨天时间段（如 22:00-6:00 夜班模式）
- **智能跳过**：在非工作时间自动跳过任务调度和执行
- **自定义间隔**：同样支持通过 INTERVAL_MINUTES 设置执行间隔

### 监控功能
- **状态监控**：每 30 分钟输出一次调度状态
- **配置日志**：启动时显示当前使用的调度模式和参数

## 📝 最佳实践

### 1. 配置优化
```env
# 推荐：同一个端点使用多个 API Key
CLAUDE_ENDPOINT=https://claude-relay.synex.im/api
CLAUDE_API_KEYS=key1,key2,key3

# 而不是：每个 key 配置不同端点
```

### 2. 监控和日志
```bash
# 实时查看日志
docker-compose logs -f

# 查看最近的日志
docker-compose logs --tail=50

# 查看特定时间的日志
docker-compose logs --since="2h"
```

### 3. 资源管理
- 建议每个 API Key 配置足够的配额
- 定期检查日志中的成本信息
- 根据使用情况调整 API Key 数量

## 🛠️ 开发

### 项目结构
```
claude-code-auto-refresh/
├── src/
│   ├── strategies/       # 调度策略
│   │   ├── ScheduleStrategy.ts   # 策略接口
│   │   ├── HourlyStrategy.ts     # 24*7 模式
│   │   └── CustomStrategy.ts     # 自定义模式
│   ├── index.ts          # 主入口
│   ├── config.ts         # 配置管理
│   ├── agent.ts          # Claude 代理
│   ├── scheduler.ts      # 任务调度器
│   └── types.ts          # 类型定义
├── docker-compose.yml    # Docker 配置
├── Dockerfile           # Docker 镜像
└── README.md           # 使用说明
```

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发模式（支持热重载）
npm run dev

# 类型检查
npm run build

# 代码规范检查
npm run lint
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 注意事项

- 确保 API Key 有足够的配额用于定期保活请求
- 每个 API Key 使用独立的 Claude Code 实例，互不干扰
- 保活消息成本通常在 $0.01-0.05 之间，请根据需要配置合适的数量
- 建议在服务器上使用 Docker 部署以获得最佳稳定性
- 时区默认设置为 Asia/Shanghai，可通过 `TZ` 环境变量修改；应用会显式使用该时区进行定时调度
- 不需要设置全局 `ANTHROPIC_BASE_URL`/`ANTHROPIC_API_KEY`；应用在每次调用时按分组注入，保证并发安全

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Docker 官方文档](https://docs.docker.com/)

---

如果这个项目对您有帮助，请给个 ⭐ Star 支持一下！
