#!/bin/bash

echo "🛑 停止 Book Recap 开发服务..."

# 读取并终止进程
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "✅ 后端API已停止"
    fi
    rm .backend.pid
fi

if [ -f .celery.pid ]; then
    CELERY_PID=$(cat .celery.pid)
    if ps -p $CELERY_PID > /dev/null; then
        kill $CELERY_PID
        echo "✅ Celery Worker已停止"
    fi
    rm .celery.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    fi
    rm .frontend.pid
fi

echo "✅ 所有服务已停止"
