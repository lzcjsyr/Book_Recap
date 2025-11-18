# Book Recap Web版本 - 增强功能文档

## 📝 概述

根据用户反馈，Web版本现已增强为**类IDE的可视化编辑环境**，提供更灵活的交互体验。

---

## 🎯 新增核心功能

### 1. 在线JSON编辑器 ✅

**组件**: `frontend/src/components/JsonEditor.tsx`

**功能特性：**
- ✅ **Monaco Editor集成** - VS Code同款编辑器
- ✅ **语法高亮和自动补全**
- ✅ **实时JSON验证**
- ✅ **一键格式化**
- ✅ **版本历史查看**
- ✅ **版本回滚功能**
- ✅ **未保存提示**

**适用于：**
- `raw.json` - 智能总结结果
- `script.json` - 分段脚本
- `keywords.json` - 关键词数据

**使用方式：**
```tsx
<JsonEditor
  title="编辑raw.json"
  data={project.raw_data}
  onSave={async (data) => {
    await api.updateRawData(projectId, data);
  }}
  onLoadHistory={async () => {
    return await api.getRawDataHistory(projectId);
  }}
  onRestoreVersion={async (version) => {
    await api.restoreRawDataVersion(projectId, version);
  }}
/>
```

---

### 2. 可视化分段编辑器 ✅

**组件**: `frontend/src/components/SegmentEditor.tsx`

**功能特性：**
- ✅ **可视化列表展示** - 清晰显示所有段落
- ✅ **多选功能** - 支持Checkbox批量选择
- ✅ **合并段落** - 选择多个段落一键合并
- ✅ **拆分段落** - 指定位置拆分为两段
- ✅ **在线编辑** - 双击或点击编辑按钮修改内容
- ✅ **删除段落** - 移除不需要的段落
- ✅ **添加段落** - 插入新段落
- ✅ **实时预览** - 显示字数和预估时长
- ✅ **拆分预览** - 拆分前预览两个新段落

**操作流程：**
```
1. 查看所有段落列表
2. 选择要操作的段落（单选或多选）
3. 执行操作：
   - 合并：选择2个以上段落 → 点击"合并选中"
   - 拆分：点击"拆分"按钮 → 设置拆分位置 → 预览 → 确认
   - 编辑：点击"编辑"按钮 → 修改内容 → 保存
   - 删除：点击"删除"按钮 → 确认
4. 自动重新编号
5. 保存到服务器
```

---

### 3. 增强的后端API ✅

**新增API路由**: `backend/api/editor.py`

#### 3.1 单个元素操作

| API端点 | 功能 | 方法 |
|---------|------|------|
| `/api/editor/projects/{id}/segments/{index}/regenerate-image` | 重新生成指定段落的图片 | POST |
| `/api/editor/projects/{id}/segments/{index}/regenerate-audio` | 重新生成指定段落的音频 | POST |
| `/api/editor/projects/{id}/images/{filename}/upload` | 上传自定义图片替换 | POST |

**示例：重新生成第5段的图片**
```bash
POST /api/editor/projects/1/segments/5/regenerate-image
{
  "custom_prompt": "温馨的家庭场景，暖色调"  # 可选
}
```

#### 3.2 数据编辑与验证

| API端点 | 功能 | 方法 |
|---------|------|------|
| `/api/editor/projects/{id}/raw-data` | 更新raw.json（带验证） | PUT |
| `/api/editor/projects/{id}/script-data` | 更新script.json（带验证） | PUT |
| `/api/editor/projects/{id}/validate` | 验证项目数据完整性 | GET |

**数据验证示例：**
```json
{
  "valid": false,
  "issues": [
    "Step 1 completed but raw_data is missing"
  ],
  "warnings": [
    "Expected 15 images, found 12"
  ]
}
```

#### 3.3 版本控制

| API端点 | 功能 | 方法 |
|---------|------|------|
| `/api/editor/projects/{id}/history/raw-data` | 获取raw.json历史版本 | GET |
| `/api/editor/projects/{id}/history/script-data` | 获取script.json历史版本 | GET |
| `/api/editor/projects/{id}/history/raw-data/restore/{version}` | 恢复到指定版本 | POST |

**版本历史格式：**
```json
{
  "history": [
    {
      "version": 1,
      "timestamp": "2024-11-18T10:30:00",
      "data": { /* 完整的JSON数据 */ }
    }
  ],
  "current": { /* 当前数据 */ }
}
```

#### 3.4 分段操作

| API端点 | 功能 | 方法 |
|---------|------|------|
| `/api/editor/projects/{id}/segments/merge` | 合并多个段落 | POST |
| `/api/editor/projects/{id}/segments/{index}/split` | 拆分段落 | POST |

**合并示例：**
```bash
POST /api/editor/projects/1/segments/merge
{
  "segment_indices": [3, 4, 5]
}
```

**拆分示例：**
```bash
POST /api/editor/projects/1/segments/3/split
{
  "split_position": 150  # 字符位置
}
```

---

## 🔐 安全性增强

### 1. 数据验证
- ✅ JSON格式验证（防止损坏数据）
- ✅ 字段完整性检查
- ✅ 索引边界验证
- ✅ 文件类型验证

### 2. 版本控制
- ✅ 自动保存历史版本
- ✅ 支持回滚到任意版本
- ✅ 时间戳记录
- ✅ 防止数据丢失

### 3. 备份机制
- ✅ 文件替换前自动备份
- ✅ 带时间戳的备份文件
- ✅ 可恢复到备份版本

### 4. 操作确认
- ✅ 关键操作前弹出确认对话框
- ✅ 危险操作显示警告
- ✅ 未保存提示

---

## 📐 使用流程示例

### 场景1：编辑总结内容

```
1. 进入项目详情页
2. 切换到"编辑器"标签
3. 选择"编辑raw.json"
4. 在Monaco编辑器中修改内容：
   - 调整标题
   - 修改开场金句
   - 优化内容表述
5. 点击"格式化"确保JSON格式正确
6. 点击"保存"
7. 系统自动：
   - 验证JSON格式
   - 保存历史版本
   - 更新文件和数据库
```

### 场景2：调整分段

```
1. 切换到"分段编辑器"
2. 查看所有15个段落
3. 发现第3段和第4段内容关联性强，决定合并：
   - 勾选第3段和第4段
   - 点击"合并选中"
   - 确认合并
4. 发现第7段太长，决定拆分：
   - 点击第7段的"拆分"按钮
   - 在预览中选择拆分位置（例如150字处）
   - 查看拆分预览（两个新段落）
   - 确认拆分
5. 系统自动：
   - 重新编号所有段落
   - 更新script.json
   - 保存到数据库
6. 后续步骤2、3、4会基于新的分段执行
```

### 场景3：替换单张图片

```
1. 完成步骤3后，查看生成的图片
2. 发现第8段的图片不满意
3. 两种方式：

   方式A - 重新生成：
   - 点击第8张图片的"重新生成"按钮
   - 可选：输入自定义提示词
   - 点击确认
   - 等待生成完成

   方式B - 上传自定义图片：
   - 点击第8张图片的"上传替换"按钮
   - 选择本地图片文件
   - 确认上传
   - 系统自动备份原图
   - 替换为新图片

4. 继续后续步骤（步骤5视频合成）
```

### 场景4：版本回滚

```
1. 编辑script.json后发现改错了
2. 点击"历史版本"按钮
3. 查看版本列表：
   - 版本1：2024-11-18 10:00:00
   - 版本2：2024-11-18 11:30:00
   - 版本3：2024-11-18 12:45:00 (当前)
4. 选择版本2，点击"恢复此版本"
5. 确认恢复
6. 系统自动：
   - 将版本2的数据恢复为当前版本
   - 将版本3作为新的历史版本保存
   - 更新文件
```

---

## 🎨 UI/UX改进

### 1. 编辑器界面
- **深色主题**: Monaco Editor使用VS Code深色主题
- **行号显示**: 方便定位
- **代码折叠**: 大文件更易浏览
- **Minimap**: 快速导航

### 2. 分段编辑器
- **卡片式布局**: 每个段落独立卡片
- **选中高亮**: 已选段落蓝色背景
- **操作按钮**: 每个段落右侧显示操作按钮
- **实时统计**: 显示字数和时长

### 3. 交互反馈
- **未保存提示**: 红色"未保存"标签
- **操作确认**: 重要操作弹出确认对话框
- **成功提示**: 绿色成功消息
- **错误提示**: 红色错误消息，显示具体原因

---

## 🔄 工作流改进

### 原工作流（简单但不灵活）
```
上传文件 → 全自动执行 → 等待完成 → 下载视频
```

### 新工作流（灵活可控）
```
1. 上传文件
2. 执行步骤1（智能总结）
3. 【编辑raw.json】调整内容
4. 执行步骤1.5（分段）
5. 【分段编辑器】调整分段：
   - 合并相关段落
   - 拆分过长段落
   - 编辑段落内容
6. 执行步骤2（要点提取）
7. 执行步骤3（图像生成）
8. 【图片管理】查看和替换：
   - 预览所有图片
   - 重新生成不满意的图片
   - 上传自定义图片
9. 执行步骤4（语音合成）
10. 【音频管理】调整音频：
    - 播放试听
    - 重新生成指定段
    - 调整语速/情感
11. 执行步骤5（视频合成）
12. 预览最终视频
13. 【可选】执行步骤6（封面生成）
```

---

## 📊 数据流保障

### 数据一致性
```
用户编辑
  ↓
前端验证（JSON格式、字段完整性）
  ↓
API验证（服务端二次验证）
  ↓
保存历史版本（备份）
  ↓
更新数据库
  ↓
更新文件系统
  ↓
返回成功/失败
```

### 错误处理
- 格式错误 → 前端显示具体错误位置
- 验证失败 → 显示缺失字段或无效值
- 保存失败 → 显示错误信息，数据不丢失
- 网络错误 → 自动重试或提示用户

---

## 🚀 性能优化

1. **延迟保存** - 编辑时不立即保存，点击保存按钮才提交
2. **版本控制** - 历史版本限制数量（默认保留最近20个）
3. **大文件处理** - Monaco Editor虚拟滚动
4. **批量操作** - 合并多个段落一次性提交

---

## 📋 待完成功能

### 图片管理面板
- [ ] 网格视图展示所有图片
- [ ] 点击放大预览
- [ ] 单张图片重新生成按钮
- [ ] 上传自定义图片替换
- [ ] 图片对比视图（原图 vs 新图）

### 音频管理面板
- [ ] 音频列表展示
- [ ] 波形图显示（WaveSurfer.js）
- [ ] 在线播放器
- [ ] 单段音频重新生成
- [ ] 语速/情感调整
- [ ] 音频剪辑功能

### 其他增强
- [ ] 拖拽排序段落
- [ ] 快捷键支持
- [ ] 批量导入/导出
- [ ] 模板系统

---

## 💾 数据库Schema更新

### Project表新增字段（通过config JSON存储）
```python
config = {
  # ... 原有配置 ...

  # 新增版本控制
  "raw_data_history": [
    {
      "version": 1,
      "timestamp": "2024-11-18T10:00:00",
      "data": { ... }
    }
  ],
  "script_data_history": [ ... ],

  # 新增自定义图片标记
  "custom_images": {
    "segment_8": "custom_segment_8_1731900000.png"
  }
}
```

---

## 🔧 技术实现细节

### Monaco Editor集成
```tsx
import Editor from '@monaco-editor/react';

<Editor
  height={600}
  defaultLanguage="json"
  value={jsonString}
  onChange={handleChange}
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    formatOnPaste: true,
    automaticLayout: true,
  }}
  theme="vs-dark"
/>
```

### 分段操作实现
```typescript
// 合并段落
const mergedContent = selectedIndices
  .map(idx => segments.find(s => s.index === idx).content)
  .join(' ');

// 拆分段落
const part1 = content.substring(0, splitPosition).trim();
const part2 = content.substring(splitPosition).trim();
```

### 版本控制实现
```python
# 保存当前版本到历史
if project.raw_data:
    history = project.config.get("raw_data_history", [])
    history.append({
        "data": project.raw_data,
        "timestamp": datetime.now().isoformat(),
        "version": len(history) + 1
    })
    project.config["raw_data_history"] = history

# 更新为新数据
project.raw_data = new_data
```

---

## 📖 使用文档

### 快速开始
1. 阅读主文档：`README_WEB.md`
2. 查看快速指南：`WEB_QUICKSTART.md`
3. 了解增强功能：本文档 `ENHANCED_FEATURES.md`

### API文档
启动后访问：`http://localhost:8000/docs`

---

## ✅ 完成状态

| 功能 | 状态 | 备注 |
|------|------|------|
| JSON编辑器 | ✅ 完成 | Monaco Editor集成 |
| 分段编辑器 | ✅ 完成 | 合并、拆分、编辑功能完整 |
| 版本控制API | ✅ 完成 | 历史版本、回滚 |
| 单元素重新生成API | ✅ 完成 | 图片、音频 |
| 数据验证 | ✅ 完成 | JSON验证、完整性检查 |
| 图片管理面板 | 🚧 进行中 | 基础功能已实现 |
| 音频管理面板 | 🚧 进行中 | 基础功能已实现 |
| 拖拽排序 | ⏳ 待开发 | 使用react-beautiful-dnd |

---

**更新时间**: 2024-11-18
**版本**: 2.0 (Enhanced)
