# Direct Large-Block Reading Strategy

用这个 reference 执行“尽量直接读原文”的长文档方案。目标是用 Bash/Python 连续读取较大文本块，减少多轮 `Read` 带来的重复上下文成本。

## 1. 准备抽取文本

如果输入是 PDF、EPUB、MOBI、AZW3 或 DOCX，先用本地工具抽取成 UTF-8 文本。不要直接 `Read` 大型 PDF。

推荐保存路径：

```text
output/<project>/text/_claude_agent_extract.txt
```

## 2. 估算规模

先确认：

- 文件大小
- 总行数
- 是否有目录、章节标题、页码线索
- 是否明显超过单次工具输出的 token 或大小限制

先用 Bash/Python 统计行数和字符数，再决定读取块大小。

## 3. 制定读取计划

优先用 Bash/Python 连续读取或切块大文本，`Read` 主要用于 skill、reference 和小文件。

硬规则：

- “已读”只指文本已经通过 Bash 输出或 Read 完整进入当前上下文。
- 只写入临时文件、只看 head/tail、只读窗口开头，都不能算覆盖。

尺度：

- 每块优先 30k-50k 中文字符。
- 如果输出被截断、只剩 head/tail，立刻减半。
- 如果 Bash 输出转为 tool-result，需要用 Read 补读完整窗口；否则缩小窗口。
- 如果模型只能泛泛总结，也减半。
- 优先连续覆盖，不要用跳读抽样冒充全文覆盖。

可用命令示例：

```bash
python3 - <<'PY'
from pathlib import Path
p = Path("output/<project>/text/_claude_agent_extract.txt")
lines = p.read_text(errors="ignore").splitlines()
start, end = 1, 2500
print("\n".join(f"{i+1}\t{line}" for i, line in enumerate(lines[start-1:end], start-1)))
PY
```

读取计划示例：

```json
{
  "source_file": "output/<project>/text/_claude_agent_extract.txt",
  "read_strategy": "bash_large_block",
  "unit": "line_range",
  "planned_windows": [
    {"start_line": 1, "end_line": 2500, "estimated_chars": 60000},
    {"start_line": 2501, "end_line": 5000, "estimated_chars": 60000}
  ]
}
```

## 4. 建立覆盖台账

每次读取一个大块后，立即记录覆盖信息。覆盖台账不是完整摘要，而是证明哪些区域已经读过、这些区域对全书理解有什么作用。

台账结构：

```json
{
  "window_id": 1,
  "planned_range": "line 1-2500",
  "actual_read_range": "line 1-2500",
  "coverage_status": "complete",
  "section_hint": "序章/第一章",
  "main_points_seen": ["这一窗口的核心信息"],
  "important_examples_seen": ["关键例子或事件"],
  "relation_to_whole_book": "它如何影响全书主线",
  "uncertainties": ["需要后文验证的点"]
}
```

## 5. 覆盖检查

写稿前检查：

- 是否覆盖开头、中段、结尾。
- 是否覆盖目录或主要章节。
- 是否存在明显未读的大段。
- 是否所有窗口都是 `coverage_status: complete`；`partial` 不能进入写稿。
- 是否只读了最容易读的局部。
- 是否已经出现上下文压力，导致前面窗口只能靠粗略记忆。

## 6. 全书理解

覆盖通过后，基于覆盖台账和已读原文形成内部理解：

- 作品真正回答的问题
- 主要论证主线
- 最值得视频化的冲突点
- 必须包含的关键事实、例子或概念
- 不应夸大的边界

除非用户要求，不要输出这一步。

## 7. 失败和切换条件

遇到以下情况，停止直接读法并建议切换：

- 读取窗口太多，覆盖台账难以稳定维护。
- 文档超过可控规模，无法在一次 Agent 会话中可靠保持全书上下文。
- 章节多且论证复杂，直接读法容易遗漏。
- 用户要求可审计证据链、短引文、限制条件和回查文件。
