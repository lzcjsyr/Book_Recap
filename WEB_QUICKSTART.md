# Book Recap Web版本 - 快速开始指南

## 🎯 5分钟快速上手

### 第一步：准备环境

1. **克隆或获取项目代码**
```bash
cd Book_Recap
```

2. **配置API密钥**
```bash
cp .env.example .env
```

编辑 `.env` 文件，填写以下必要的API密钥：

```env
# OpenRouter API (用于LLM文本处理)
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# 豆包/字节跳动API (用于图像和语音生成)
SEEDREAM_API_KEY=xxxxx
BYTEDANCE_TTS_APPID=xxxxx
BYTEDANCE_TTS_ACCESS_TOKEN=xxxxx
```

> 💡 提示：您需要先注册以下服务并获取API密钥：
> - OpenRouter: https://openrouter.ai/
> - 豆包Seedream: https://www.volcengine.com/
> - 字节跳动TTS: https://www.volcengine.com/

### 第二步：选择启动方式

#### 方式A：Docker一键启动（推荐）

**适合：** 快速体验、生产部署

```bash
# 一键启动
./start_web.sh

# 或手动启动
docker-compose up -d
```

等待容器启动完成（约1-2分钟），然后访问：
- 前端: http://localhost:3000
- 后端API: http://localhost:8000/docs

停止服务：
```bash
docker-compose down
```

#### 方式B：本地开发模式

**适合：** 开发调试、自定义修改

**前置要求：**
- Python 3.10+
- Node.js 18+
- Redis

**启动步骤：**

```bash
# 安装Python依赖
pip install -r requirements.txt

# 启动Redis（根据系统选择）
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis

# Docker:
docker run -d -p 6379:6379 redis:7-alpine

# 初始化数据库
python -c "from backend.database import init_db; init_db()"

# 启动后端API（终端1）
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 启动Celery Worker（终端2）
celery -A backend.celery_app worker --loglevel=info --concurrency=2

# 启动前端（终端3）
cd frontend
npm install
npm run dev
```

或使用便捷脚本：
```bash
./start_dev.sh  # 一键启动所有服务
./stop_dev.sh   # 停止所有服务
```

### 第三步：创建第一个项目

1. **打开前端界面**
   访问 http://localhost:3000

2. **点击"创建新项目"**

3. **填写项目信息**
   - 项目名称：例如 "认知觉醒"
   - 上传文件：选择一个书籍文件（PDF/EPUB/MOBI/TXT）

4. **配置参数（可使用默认值）**
   - 目标字数：2000字
   - 分段数量：15段
   - 视频尺寸：1280x720（横屏）
   - 启用字幕：是

5. **点击"创建项目"**

6. **启动生成**
   - 点击"全自动模式"，系统将自动完成所有步骤
   - 或在"步骤控制"中单独执行每个步骤

7. **查看结果**
   - 在"结果查看"标签页预览和下载生成的视频

## 📸 功能截图

### 项目列表页
管理所有视频项目，查看进度和状态

### 创建项目页
上传书籍文件，配置生成参数

### 项目详情页
- **执行进度**：实时查看当前步骤和进度
- **步骤控制**：单独执行或重新生成某个步骤
- **结果查看**：预览图片、音频、视频
- **任务历史**：查看所有执行记录

## ⚡ 常见问题

### Q: 启动失败，提示端口被占用？
A: 修改端口号：
- 后端：编辑 `docker-compose.yml` 中的 `ports: "8000:8000"` 改为其他端口
- 前端：编辑 `docker-compose.yml` 中的 `ports: "3000:80"` 改为其他端口

### Q: Celery Worker无法启动？
A: 检查Redis是否正常运行：
```bash
redis-cli ping
# 应该返回: PONG
```

### Q: 视频生成失败？
A: 检查日志查看具体错误：
```bash
# Docker环境
docker-compose logs celery_worker

# 本地环境
tail -f celery.log
```

常见原因：
1. API密钥未配置或无效
2. API配额不足
3. 网络连接问题

### Q: 如何查看详细日志？
A:
```bash
# Docker环境
docker-compose logs -f backend
docker-compose logs -f celery_worker

# 本地环境
tail -f backend.log
tail -f celery.log
```

### Q: 如何修改配置？
A:
- 全局配置：编辑 `config.py`
- 项目配置：在创建项目时设置，或在项目详情页修改

## 🎓 进阶使用

### 1. 分步执行模式

适合需要精细控制的场景：

1. **步骤1**: 执行智能总结
2. **编辑**: 修改 `raw.json` 中的内容
3. **步骤1.5**: 执行脚本分段
4. **编辑**: 调整 `script.json` 中的分段
5. **步骤2-6**: 依次执行后续步骤

### 2. 重新生成特定内容

- 在"步骤控制"中点击"重新执行"
- 支持重新生成单个步骤
- 可以调整参数后重新生成

### 3. 批量处理

- 创建多个项目
- 每个项目独立执行
- 支持并发处理（取决于Celery Worker数量）

## 📚 下一步

- 查看完整文档：[README_WEB.md](README_WEB.md)
- API文档：http://localhost:8000/docs
- 自定义配置：编辑 `config.py`
- 前端开发：查看 `frontend/` 目录

## 🆘 获取帮助

- 查看日志文件了解详细错误
- 访问 API 文档调试接口
- 提交 Issue 到 GitHub

---

**祝使用愉快！🎉**
