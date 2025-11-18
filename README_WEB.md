# Book Recap - Web版本使用文档

## 📖 概述

Book Recap Web版本是一个完整的前后端分离架构的书籍内容转视频系统，提供友好的Web界面进行项目管理和视频生成。

## 🏗️ 系统架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   前端Web   │ ───> │  FastAPI    │ ───> │   Celery    │
│   React     │      │   后端      │      │   Worker    │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                      │
                            ├──────────────────────┤
                            │                      │
                      ┌─────▼──────┐       ┌──────▼─────┐
                      │  SQLite/   │       │   Redis    │
                      │ PostgreSQL │       │  消息队列   │
                      └────────────┘       └────────────┘
```

### 技术栈

**后端：**
- **FastAPI**: 现代化Python Web框架，支持异步和自动API文档
- **SQLAlchemy**: ORM数据库操作
- **Celery**: 异步任务队列，处理长时间运行的视频生成任务
- **Redis**: 任务队列broker和结果存储
- **WebSocket**: 实时进度推送

**前端：**
- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全
- **Ant Design**: 企业级UI组件库
- **Vite**: 快速的前端构建工具
- **Socket.IO**: WebSocket客户端

## 🚀 快速开始

### 方式1：Docker Compose（推荐）

1. **配置环境变量**

复制 `.env.example` 为 `.env` 并填写API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要的API密钥：
```env
# LLM服务
OPENROUTER_API_KEY=your_openrouter_key
SILICONFLOW_KEY=your_siliconflow_key

# 图像生成
SEEDREAM_API_KEY=your_seedream_key

# 语音合成
BYTEDANCE_TTS_APPID=your_appid
BYTEDANCE_TTS_ACCESS_TOKEN=your_token
```

2. **启动服务**

```bash
docker-compose up -d
```

3. **访问应用**

- **前端界面**: http://localhost:3000
- **后端API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

4. **查看日志**

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f celery_worker
docker-compose logs -f frontend
```

5. **停止服务**

```bash
docker-compose down
```

### 方式2：本地开发

#### 后端启动

1. **安装依赖**

```bash
pip install -r requirements.txt
```

2. **启动Redis**

```bash
# MacOS/Linux
redis-server

# 或使用Docker
docker run -d -p 6379:6379 redis:7-alpine
```

3. **初始化数据库**

```bash
python -c "from backend.database import init_db; init_db()"
```

4. **启动后端API**

```bash
# 开发模式（支持热重载）
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

5. **启动Celery Worker**

在新的终端窗口：

```bash
celery -A backend.celery_app worker --loglevel=info --concurrency=2
```

#### 前端启动

1. **进入前端目录**

```bash
cd frontend
```

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm run dev
```

4. **访问前端**

打开浏览器访问: http://localhost:3000

## 📚 功能说明

### 1. 项目管理

#### 创建项目
1. 点击"创建新项目"
2. 填写项目名称和描述
3. 上传书籍文件（支持 PDF, EPUB, MOBI, TXT）
4. 配置生成参数（可使用默认值）
5. 点击"创建项目"

#### 项目列表
- 查看所有项目
- 按状态筛选（已创建、处理中、已完成、失败）
- 查看项目进度
- 删除项目

### 2. 视频生成

#### 全自动模式
点击"全自动模式"按钮，系统将自动执行所有6个步骤：
1. **步骤1**: 智能总结 - 提取书籍核心内容
2. **步骤1.5**: 脚本分段 - 将内容分成多个段落
3. **步骤2**: 要点提取 - 提取每段的视觉关键词
4. **步骤3**: 图像生成 - AI生成配图
5. **步骤4**: 语音合成 - TTS语音配音
6. **步骤5**: 视频合成 - 生成最终视频

#### 分步执行模式
在"步骤控制"标签页，可以单独执行任意步骤：
- 适合需要中途编辑的场景
- 可以重新执行某个步骤
- 支持自定义参数

### 3. 实时进度监控

- **WebSocket实时推送**: 无需刷新页面即可看到最新进度
- **进度条显示**: 当前步骤的详细进度
- **任务状态**: 查看历史任务执行情况

### 4. 结果查看

在"结果查看"标签页：
- **文本数据**: 查看生成的raw.json和script.json
- **图片**: 预览所有生成的配图
- **音频**: 播放语音文件
- **最终视频**: 在线预览和下载

### 5. 在线编辑

支持编辑中间结果：
- 编辑raw.json（修改总结内容）
- 编辑script.json（调整分段）
- 重新生成指定段落的图片

## 🔧 配置说明

### 项目配置参数

#### 步骤1：智能总结
- `target_length`: 目标字数 (500-5000)，默认2000
- `llm_model_step1`: LLM模型，推荐 Kimi-K2-Instruct
- `llm_temperature_script`: 随机性 (0-1)，默认0.7

#### 步骤1.5：脚本分段
- `num_segments`: 分段数量 (5-50)，默认15

#### 步骤2：要点提取
- `images_method`: 图像生成方式
  - `keywords`: 关键词模式
  - `description`: 描述模式（推荐）

#### 步骤3：图像生成
- `image_size`: 图像尺寸，默认 2560x1440
- `image_style_preset`: 风格预设
  - `style01`: 概念极简
  - `style05`: 综合平衡（推荐）
- `max_concurrent_image_generation`: 最大并发数，默认5

#### 步骤4：语音合成
- `voice`: 音色ID
- `tts_speech_rate`: 语速调整 (-50到100)
- `tts_emotion`: 情感（neutral/happy/sad）

#### 步骤5：视频合成
- `video_size`: 视频尺寸
  - `1280x720`: 横屏16:9（推荐）
  - `720x1280`: 竖屏9:16
  - `1024x1024`: 方形1:1
- `enable_subtitles`: 是否启用字幕
- `opening_quote`: 是否显示开场金句
- `bgm_filename`: 背景音乐文件名
- `enable_transitions`: 是否启用过渡效果

## 🔍 API文档

访问 http://localhost:8000/docs 查看完整的交互式API文档（Swagger UI）。

### 主要API端点

#### 项目管理
- `POST /api/projects/` - 创建项目
- `GET /api/projects/` - 获取项目列表
- `GET /api/projects/{id}` - 获取项目详情
- `PUT /api/projects/{id}` - 更新项目
- `DELETE /api/projects/{id}` - 删除项目

#### 任务执行
- `POST /api/tasks/projects/{id}/full-auto` - 启动全自动模式
- `POST /api/tasks/projects/{id}/step` - 执行单个步骤
- `GET /api/tasks/projects/{id}/tasks` - 获取任务列表
- `POST /api/tasks/{id}/cancel` - 取消任务

#### 文件服务
- `GET /api/files/{project_id}/images/{filename}` - 获取图片
- `GET /api/files/{project_id}/audio/{filename}` - 获取音频
- `GET /api/files/{project_id}/video` - 获取视频

#### WebSocket
- `WS /ws/projects/{id}` - 项目实时更新

## 🐛 故障排查

### 后端问题

1. **数据库初始化失败**
```bash
# 手动初始化数据库
python -c "from backend.database import init_db; init_db()"
```

2. **Celery Worker无法启动**
```bash
# 检查Redis是否运行
redis-cli ping

# 检查Redis连接
python -c "import redis; r = redis.Redis(); r.ping()"
```

3. **API启动失败**
```bash
# 检查端口占用
lsof -i :8000

# 查看详细错误日志
uvicorn backend.main:app --reload --log-level debug
```

### 前端问题

1. **无法连接后端**
- 检查 `vite.config.ts` 中的proxy配置
- 确认后端服务已启动在8000端口

2. **WebSocket连接失败**
- 检查浏览器控制台错误
- 确认WebSocket路径正确

### Docker问题

1. **容器无法启动**
```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs celery_worker

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

2. **数据持久化问题**
```bash
# 检查volumes
docker-compose down -v  # 清除所有数据（谨慎使用）
docker-compose up -d
```

## 📊 监控和维护

### 日志管理

#### 查看实时日志
```bash
# Docker环境
docker-compose logs -f backend
docker-compose logs -f celery_worker

# 本地开发
tail -f backend.log
tail -f celery.log
```

### 性能优化

1. **并发控制**
- 调整 `MAX_CONCURRENT_IMAGE_GENERATION` 控制图像生成并发数
- 调整 `MAX_CONCURRENT_VOICE_SYNTHESIS` 控制语音合成并发数

2. **Celery Worker调优**
```bash
# 增加worker数量
celery -A backend.celery_app worker --concurrency=4

# 使用多个worker进程
celery -A backend.celery_app worker --autoscale=10,3
```

3. **数据库优化**
- 生产环境建议使用PostgreSQL替代SQLite
- 定期清理历史任务记录

## 🔐 安全建议

1. **API密钥保护**
- 不要将 `.env` 文件提交到Git
- 使用环境变量或密钥管理服务

2. **CORS配置**
- 生产环境修改 `backend/main.py` 中的CORS设置
- 限制允许的域名

3. **文件上传安全**
- 限制上传文件大小
- 验证文件类型
- 使用病毒扫描

## 📈 扩展开发

### 添加新功能

1. **后端API**
- 在 `backend/api/` 添加新路由
- 在 `backend/models/` 添加数据模型
- 在 `backend/tasks/` 添加Celery任务

2. **前端页面**
- 在 `frontend/src/pages/` 添加页面
- 在 `frontend/src/components/` 添加组件
- 更新路由配置

### 自定义样式

修改 `frontend/src/index.css` 或组件内的style属性。

## 📞 技术支持

如遇问题，请：
1. 查看日志文件
2. 检查API文档
3. 提交Issue到GitHub

## 📄 许可证

请参考主README文件。
