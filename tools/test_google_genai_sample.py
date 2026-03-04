#!/usr/bin/env python3
"""
基于 Google 官方示例的最小可运行测试脚本。

用途：
1) 验证当前 key 是否可调用 gemini-3.1-flash-image-preview
2) 可选并发压测（如 10 并发）
"""

from __future__ import annotations

import argparse
import concurrent.futures
import os
import time
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types


def _build_client() -> genai.Client:
    api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")
    if not api_key:
        raise ValueError("未找到 GOOGLE_CLOUD_API_KEY")
    return genai.Client(vertexai=True, api_key=api_key)


def _generate_once(
    client: genai.Client,
    model: str,
    prompt: str,
    out_dir: Path,
    idx: int,
) -> Dict[str, Any]:
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        max_output_tokens=32768,
        response_modalities=["TEXT", "IMAGE"],
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF"),
        ],
        image_config=types.ImageConfig(
            aspect_ratio="auto",
            image_size="1K",
            output_mime_type="image/png",
        ),
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
        ),
    )

    t0 = time.time()
    image_bytes = b""
    text_chunks = []
    try:
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if getattr(chunk, "text", None):
                text_chunks.append(chunk.text)
            candidates = getattr(chunk, "candidates", None) or []
            for candidate in candidates:
                content = getattr(candidate, "content", None)
                parts = getattr(content, "parts", None) or []
                for part in parts:
                    inline_data = getattr(part, "inline_data", None)
                    data = getattr(inline_data, "data", None) if inline_data else None
                    if not data:
                        continue
                    if isinstance(data, memoryview):
                        data = data.tobytes()
                    if isinstance(data, (bytes, bytearray)):
                        image_bytes = bytes(data)
                        break
                if image_bytes:
                    break
            if image_bytes:
                break

        elapsed = round(time.time() - t0, 2)
        if not image_bytes:
            return {
                "idx": idx,
                "success": False,
                "elapsed": elapsed,
                "error": "未返回图片字节数据",
                "path": "",
                "text_preview": ("".join(text_chunks)[:120]).replace("\n", " "),
            }

        out_path = out_dir / f"google_sample_{idx}.png"
        out_path.write_bytes(image_bytes)
        return {
            "idx": idx,
            "success": True,
            "elapsed": elapsed,
            "error": "",
            "path": str(out_path),
            "bytes": len(image_bytes),
            "text_preview": ("".join(text_chunks)[:120]).replace("\n", " "),
        }
    except Exception as exc:
        return {
            "idx": idx,
            "success": False,
            "elapsed": round(time.time() - t0, 2),
            "error": str(exc),
            "path": "",
            "text_preview": ("".join(text_chunks)[:120]).replace("\n", " "),
        }


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Google GenAI 官方示例最小测试脚本")
    parser.add_argument("--model", default="gemini-3.1-flash-image-preview")
    parser.add_argument("--prompt", default="A clean minimalist poster of a sunrise over mountains, cinematic lighting")
    parser.add_argument("--concurrency", type=int, default=1, help="并发请求数，例如 10")
    parser.add_argument("--out-dir", default="output/google_sample_test", help="输出目录")
    args = parser.parse_args()

    if args.concurrency < 1:
        print("concurrency 必须 >= 1")
        return 2

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")
    if not api_key:
        print("未找到 GOOGLE_CLOUD_API_KEY")
        return 2

    key_masked = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) >= 10 else "*" * len(api_key)
    print(f"model={args.model}")
    print(f"concurrency={args.concurrency}")
    print("auth_mode=vertex_api_key")
    print(f"key(masked)={key_masked}")
    print(f"out_dir={out_dir}")

    start = time.time()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(_generate_once, _build_client(), args.model, args.prompt, out_dir, i)
            for i in range(args.concurrency)
        ]
        for fut in concurrent.futures.as_completed(futures):
            results.append(fut.result())

    results.sort(key=lambda x: x["idx"])
    success_count = sum(1 for r in results if r["success"])
    fail_count = len(results) - success_count
    total_elapsed = round(time.time() - start, 2)

    print("\n=== Summary ===")
    print(f"success={success_count} fail={fail_count} total_elapsed={total_elapsed}s")
    for item in results:
        if item["success"]:
            print(f"#{item['idx']} OK elapsed={item['elapsed']}s bytes={item.get('bytes', 0)} path={item['path']}")
        else:
            print(f"#{item['idx']} FAIL elapsed={item['elapsed']}s error={item['error']}")

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
