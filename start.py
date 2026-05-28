#!/usr/bin/env python
"""
🚀 智能视频制作系统 - 启动入口
"""
import os
import sys

# 确保项目根目录在 sys.path 中
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if __name__ == "__main__":
    try:
        from core.cli.main import main
        main()
    except KeyboardInterrupt:
        print("\n👋 已退出程序")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 启动失败: {e}")
