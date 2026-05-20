# Output Contract

最终只输出严格 JSON，不要使用 Markdown，不要添加额外解释。若运行环境要求保存文件，保存到用户指定 raw JSON 路径，并确保 Python `json.loads` 可解析。

## Fields

```json
{
  "source_name": "作品本身标题，不用文件名后缀",
  "video_titles": ["3条发布标题候选，互不重复，信息完整"],
  "cover_titles": ["3条封面主标题，4到10字，短、强、易扫读"],
  "cover_subtitles": ["3条封面副标题，15字以内"],
  "golden_quotes": ["3条开场金句，观点鲜明，像一句能让人停下来的真话"],
  "comment_hook_options": ["3条评论引导，优先判断句、对照句、追问句，不像运营话术"],
  "share_hook_options": ["3条转发引导，像观众看完后会自然转发的话"],
  "content": "完整口播终稿，约3500字，不分段，不写Markdown或小标题",
  "total_length": 0,
  "target_segments": 70
}
```

`content` 由 `_draft_final.txt` 去掉换行和多余空白生成，不改正文措辞。`total_length` 写实际 `content` 字符数；`target_segments` 使用用户或程序传入的目标段数。

## Quality gate

输出前确认：

- 已存在 `_draft_v1.txt`、`_draft_v2_faithfulness.txt`、`_draft_v3_structure.txt`、`_draft_v4_oral_style.txt`、`_draft_final.txt`、`_revision_audit.json`。
- `_revision_audit.json` 基于相邻版本真实差异写成；忠实性、结构、口语三轮必须有实质差异，格式轮可无差异。
- JSON 的 `content` 来自 `_draft_final.txt`；终稿 txt 可以分段，写入 JSON 时只允许去掉换行和多余空白，不允许改正文措辞。
- JSON 没有尾随逗号。
- 所有字符串正确转义。
- 数组数量正确。
- `content` 没有分段、小标题或列表格式。
- 没有使用 writing-standard 中的禁用表达。
