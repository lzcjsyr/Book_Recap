---
name: video-book-direct-read
description: 将长书、长文档或复杂报告转成中文视频号读书解说稿；先抽取文本（复杂表格 PDF 可用 MinerU）并建立可恢复覆盖台账，覆盖自检通过后再按入口定义的正文长度生成初稿、多轮修订和最终 raw JSON。
---

# 长资料直接大块读稿策略

这个 skill 是一个薄入口，负责把长文档处理拆成几个可单独维护的模块：

- `references/reading-strategy.md`：Bash 按每窗不超过 23000 字符连续读取、覆盖台账格式、落盘路径、失败条件。
- `references/mineru-pdf-extraction.md`：投资、商业、研报类复杂表格 PDF 的 MinerU 抽取分支。记住，一般书籍不要走这个路径。
- `references/writing-standard.md`：视频号读书解说稿的具体文稿要求和最终 raw JSON 字段格式。
- `references/revision-workflow.md`：初稿、结构稿、终稿和差异审计的精简可复盘落盘流程。

## 正文长度配置

这是本 skill 中正文成稿长度的唯一真相来源。其他 reference 不得重复写具体字数，只能引用本节。

```yaml
draft_min_chars: 3000
final_target_chars: 3300
```

- `_draft_v1.txt` 保存前必须达到 `draft_min_chars`。
- 后续所有正文稿原则上不得低于 `draft_min_chars`。
- 最终 raw JSON 的 `content` 目标长度按 `final_target_chars` 执行，`total_length` 写实际 `content` 字符数。

## 端到端流程

不要一轮直接输出。按「理解 -> 定角度 -> 写初稿 -> 多轮修订 -> 包装输出」执行：

1. 资料理解：先读 `references/reading-strategy.md`；复杂表格 PDF 再读 `references/mineru-pdf-extraction.md`。抽取文本、制定 Bash 字符窗口计划、建立并更新覆盖台账。
2. 覆盖闸门：覆盖检查通过前，不得写初稿、修订稿或最终 JSON。
3. 类型和角度：静默判断资料类型，提取核心问题、解释框架和一个跟观众有关的锋利角度。
4. 初稿写作：读 `references/writing-standard.md`，生成达到 `draft_min_chars` 的 `_draft_v1.txt`。
5. 多轮修订：读 `references/revision-workflow.md`，保存结构稿、终稿和修订审计。
6. 包装输出：从 `_draft_final.txt` 生成标题、封面文案、金句、引导语和最终 raw JSON；除非用户要求展示过程，最终只输出项目可用的 raw JSON，并确保可被 `json.loads` 解析。

## 运行原则

- 先覆盖，再写稿。没有覆盖台账，不要进入初稿或最终 JSON。
- 先建台账，再读正文；每个窗口读完必须立即更新 `_coverage_ledger.json`，不要等全部读完后一次性写。
- 覆盖台账用于证明“读到了哪些区域”，不是普通摘要；写稿前你必须自己核对 `_coverage_ledger.json` 是否真实、完整。
- 最终 JSON 前必须产生 `_draft_v1.txt`、`_draft_v2_structure.txt`、`_draft_final.txt`、`_revision_audit.json`，且 audit 必须基于相邻版本差异。
- 不要把局部段落误说成全书观点。
- 正文只用 Bash 读，默认每窗不超过 23000 字符；截断时减半重读，不要改用 `Read` 或跳读抽样。
- MinerU 只负责复杂 PDF 抽取，不代表阅读完成；MinerU 输出仍必须转成 `{extract_path}` 并走 Bash 字符窗口阅读和覆盖台账。
- 覆盖率按全文字符数分档：`source_total_chars <= 150000` 必须 100% 覆盖；`150000 < source_total_chars <= 200000` 必须覆盖至少 80%；`source_total_chars > 200000` 必须覆盖至少 50%，且不能只读前半部分或局部热点，必须均匀覆盖开头、中段、结尾和主要章节，形成对全书轮廓与核心思想的完整理解。

## 自检要求

提交最终 JSON 前，静默确认：

- 已按全文字符数分档达到覆盖率要求，覆盖开头、中段、结尾和主要章节，且台账中 `coverage_check.passed=true` 与事实一致。
- 文稿符合 `writing-standard.md` 的开头、节奏、文风、禁用表达和修订要求。
- 每轮修订都重新读取一下 `writing-standard.md` ，确保没有遗忘要求。
- 修订过程已按 `revision-workflow.md` 逐轮落盘，终稿来自 `_draft_final.txt`，audit 能对应每一轮的真实差异。
- JSON 符合 `writing-standard.md` 的最终 JSON 输出契约。
