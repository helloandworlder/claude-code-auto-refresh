FROM node:22-alpine

WORKDIR /app

# 安装所有依赖（包括devDependencies用于构建）
COPY package*.json ./
RUN npm ci

# 复制源代码和编译
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# 清理devDependencies，只保留生产依赖
RUN npm ci --only=production

# 清理源代码，只保留编译后的文件
RUN rm -rf src tsconfig.json

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 改变文件所有者
RUN chown -R nextjs:nodejs /app
USER nextjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# 启动应用
CMD ["npm", "start"]