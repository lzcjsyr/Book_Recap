#!/bin/bash

echo "🚀 启动 Book Recap Web 服务..."

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，请先创建并配置API密钥"
    echo "可以复制 .env.example 并修改："
    echo "  cp .env.example .env"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker 和 Docker Compose"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 启动服务
echo "📦 启动Docker容器..."
docker-compose up -d

echo ""
echo "✅ 服务已启动！"
echo ""
echo "📌 访问地址："
echo "   - 前端界面: http://localhost:3000"
echo "   - 后端API: http://localhost:8000"
echo "   - API文档: http://localhost:8000/docs"
echo ""
echo "📊 查看日志："
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务："
echo "   docker-compose down"
echo ""
