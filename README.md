# Claude Code Auto Refresh Agent

一个智能的 Claude Code 自动刷新代理，用于保持后端 5 小时计价的活跃状态。通过在每个整点后的随机 1-5 分钟发送保活消息，确保您的 Claude Code 服务始终保持活跃。

[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/typescript-5.5+-blue)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/node.js-22+-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## ✨ 功能特性

- 🚀 **首次启动立即发送**：启动后立即发送保活消息，无需等待
- 🔄 **智能调度系统**：支持两种调度模式
  - **HOURLY 模式**（默认）：每个整点后随机 1-5 分钟发送保活消息
  - **CUSTOM 模式**：自定义时间区间触发，支持跨天和工作日限制
- 🔑 **灵活配置方式**：支持统一 Endpoint + 多个 API Key 配置
- 🏠 **独立实例管理**：每个 API Key 使用独立的 Claude Code 实例
- 📊 **完整日志输出**：显示 AI 回复内容和成本信息
- 🐳 **Docker 部署**：支持 Docker 和 docker-compose 一键部署
- 🕐 **时区支持**：默认使用 Asia/Shanghai 时区
- 🔧 **向下兼容**：支持传统的分组配置方式

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

# 调度模式配置（可选）
SCHEDULE_MODE=hourly  # hourly(默认) 或 custom

# 自定义调度配置（当 SCHEDULE_MODE=custom 时生效）
# SCHEDULE_START_TIME=09:00    # 开始时间
# SCHEDULE_END_TIME=02:00      # 结束时间（支持跨天）
# SCHEDULE_INTERVAL=30         # 执行间隔（分钟）
# SCHEDULE_WEEKDAYS=1,2,3,4,5  # 工作日限制（1=周一，7=周日）

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

使用 Docker Hub 镜像快速部署：

```bash
# 1. 克隆仓库获取配置文件
git clone https://github.com/yourusername/claude-code-auto-refresh.git
cd claude-code-auto-refresh

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置你的 API keys

# 3. 启动服务（自动拉取镜像）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 更新到最新版本
docker-compose pull
docker-compose up -d
```

> 💡 镜像地址：[sczheng189/claude-auto-refresh](https://hub.docker.com/r/sczheng189/claude-auto-refresh)

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

1. **🎯 智能调度**：每个整点（如 12:00, 13:00）后，为每个 API Key 安排一个随机时间（1-5 分钟内）的保活任务
2. **💬 保活消息**：发送简单的消息 `"Please only output '1'"` 来保持后端活跃
3. **🔄 首次启动**：启动后立即发送一次保活消息，确保服务立即激活
4. **⚡ 并行执行**：多个 API Key 的任务并行处理，提高效率
5. **📊 完整监控**：显示 AI 回复内容、成本信息和调度状态

## 📊 配置说明

### 环境变量

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `CLAUDE_ENDPOINT` | 统一的 API 端点 | `https://claude-relay.synex.im/api` | 是* |
| `CLAUDE_API_KEYS` | API 密钥列表（逗号分隔） | `key1,key2,key3` | 是* |
| `CLAUDE_GROUP_N_ENDPOINT` | 第 N 组的 API 端点 | `https://api.anthropic.com` | 否** |
| `CLAUDE_GROUP_N_API_KEY` | 第 N 组的 API 密钥 | `your-api-key` | 否** |
| `SCHEDULE_MODE` | 调度模式 | `hourly`/`custom` | 否 |
| `SCHEDULE_START_TIME` | 自定义模式开始时间 | `09:00` | 否*** |
| `SCHEDULE_END_TIME` | 自定义模式结束时间 | `18:00` 或 `02:00`（跨天） | 否*** |
| `SCHEDULE_INTERVAL` | 执行间隔（分钟） | `30` | 否*** |
| `SCHEDULE_WEEKDAYS` | 工作日限制 | `1,2,3,4,5` (周一至周五) | 否 |
| `LOG_LEVEL` | 日志级别 | `info`/`debug`/`warn`/`error` | 否 |
| `TZ` | 时区设置 | `Asia/Shanghai` | 否 |

\* 使用统一配置时必填  
\*\* 使用传统分组配置时必填  
\*\*\* 使用自定义调度模式时必填

### Docker Compose 配置

```yaml
version: '3.8'
services:
  claude-agent:
    build: .
    container_name: claude-auto-refresh
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
      - CLAUDE_ENDPOINT=https://claude-relay.synex.im/api
      - CLAUDE_API_KEYS=your-key-1,your-key-2
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
```

## 🔄 调度机制

### HOURLY 模式（默认）
- **启动时**：立即发送保活消息给所有配置的 API Key
- **定时任务**：每个整点后的 1-5 分钟内随机发送
- **任务分布**：不同 API Key 的任务时间随机分布，避免同时请求
- **状态监控**：每 30 分钟输出一次调度状态

### CUSTOM 模式
- **时间区间**：在指定的开始和结束时间内执行
- **执行间隔**：按照设定的间隔时间（分钟）执行任务
- **跨天支持**：支持跨天时间设置（如 21:00 - 02:00）
- **工作日限制**：可选择只在特定工作日执行

### 配置示例

```env
# 示例1：工作时间模式（9:00-18:00，每30分钟）
SCHEDULE_MODE=custom
SCHEDULE_START_TIME=09:00
SCHEDULE_END_TIME=18:00
SCHEDULE_INTERVAL=30
SCHEDULE_WEEKDAYS=1,2,3,4,5

# 示例2：夜间模式（21:00-次日2:00，每45分钟）
SCHEDULE_MODE=custom
SCHEDULE_START_TIME=21:00
SCHEDULE_END_TIME=02:00
SCHEDULE_INTERVAL=45

# 示例3：全天模式（9:00-次日2:00，每60分钟）
SCHEDULE_MODE=custom
SCHEDULE_START_TIME=09:00
SCHEDULE_END_TIME=02:00
SCHEDULE_INTERVAL=60
```

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
│   ├── index.ts          # 主入口
│   ├── config.ts         # 配置管理
│   ├── agent.ts          # Claude 代理
│   ├── scheduler.ts      # 任务调度器
│   ├── types.ts          # 类型定义
│   └── strategies/       # 调度策略
│       ├── IScheduleStrategy.ts  # 策略接口
│       ├── HourlyStrategy.ts     # 每小时策略
│       ├── CustomStrategy.ts     # 自定义策略
│       └── StrategyFactory.ts    # 策略工厂
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
- 时区默认设置为 Asia/Shanghai，可通过 `TZ` 环境变量修改

## 🔗 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [Docker 官方文档](https://docs.docker.com/)

---

如果这个项目对您有帮助，请给个 ⭐ Star 支持一下！