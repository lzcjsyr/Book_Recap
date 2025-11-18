#!/bin/bash

echo "🚀 启动 Book Recap 开发环境..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，请先创建并配置API密钥"
    exit 1
fi

# 检查Python依赖
if ! python -c "import fastapi" &> /dev/null; then
    echo "📦 安装Python依赖..."
    pip install -r requirements.txt
fi

# 检查Redis
if ! redis-cli ping &> /dev/null; then
    echo "❌ Redis未运行，请先启动Redis服务"
    echo "  macOS: brew services start redis"
    echo "  Linux: sudo systemctl start redis"
    echo "  Docker: docker run -d -p 6379:6379 redis:7-alpine"
    exit 1
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
python -c "from backend.database import init_db; init_db()"

# 在后台启动各个服务
echo "🌐 启动后端API..."
nohup uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

echo "⚙️  启动Celery Worker..."
nohup celery -A backend.celery_app worker --loglevel=info --concurrency=2 > celery.log 2>&1 &
CELERY_PID=$!

echo "💻 启动前端开发服务器..."
cd frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# 保存PID到文件
echo $BACKEND_PID > .backend.pid
echo $CELERY_PID > .celery.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📌 访问地址："
echo "   - 前端界面: http://localhost:3000"
echo "   - 后端API: http://localhost:8000"
echo "   - API文档: http://localhost:8000/docs"
echo ""
echo "📊 查看日志："
echo "   tail -f backend.log"
echo "   tail -f celery.log"
echo "   tail -f frontend/frontend.log"
echo ""
echo "🛑 停止服务："
echo "   ./stop_dev.sh"
echo ""
