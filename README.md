# 画讲 huajiang

把**带逐字时间表的口播**做成“边画边讲”的手绘视频：板书、增量、擦除、移镜头，画面和声音逐字同步，像一个人站在白板前讲给你听。

这是一个给 AI agent 用的底座。agent 读口播、写分镜（YAML），框架负责把分镜变成一笔一笔画出来的视频，并在渲染前拦住“抄字幕、像 PPT、画面静止、不同步”这些毛病。

> agent 请从 [AGENTS.md](AGENTS.md) 开始读。

## 它做什么

- **按口播原文卡点**：`at: "收走一百块税"`。换配音后自动跟随，不用改秒数。
- **一笔一笔画**：图形经 rough.js 抖成手绘线，笔触有粗细变化；汉字用手写马克笔字体、按真实笔顺写出；画的速度自动匹配语速。
- **纸和笔的质感**：带纹理的纸面、马克笔式的涂色、落笔重收笔轻的墨线。
- **会动的画面**：元素可以移动、沿箭头走、缩放、被板擦擦掉；镜头可以平移到新板面、推近细节。
- **讲述者的替身**：可摆姿势、换表情、戴配饰的火柴人。
- **素材**：5000+ 线条图标（Tabler）、一组财经向手绘件、柱状图与折线图；不够时用基本图形自己画。
- **字幕与落笔音效**：字幕来自时间表；音效按每一笔的起止时间合成。
- **两道确认闸**：文字分镜 → 关键帧 → 视频。用户没确认，命令行拒绝出图和渲染。
- **为返工设计**：一个场景一个文件，位置与时间分开写，可以只看一帧、只渲染一段。

## 快速体验

```bash
npm install
```

```bash
npx hj check examples/compound
```

```bash
npx hj stills examples/compound
```

```bash
npx hj render examples/compound
```

示例是一段 22 秒的“复利”讲解，使用匀速的假时间表，没有配音。成片在 `examples/compound/out/video.mp4`。
需要 Node 20+ 和 ffmpeg。渲染不依赖浏览器。

## 文档

| | |
|---|---|
| [AGENTS.md](AGENTS.md) | 工作流、铁律、代码地图 |
| [docs/directing.md](docs/directing.md) | 导演手册：怎么把话变成画 |
| [docs/reference.md](docs/reference.md) | 全部字段、动作、元素 |
| [docs/revising.md](docs/revising.md) | 返工手册：修改意见对应改哪几行 |
| [docs/voice-guide.md](docs/voice-guide.md) | 给配音方的要求与时间表格式 |

## 现在还不支持

背景音乐；真人或手的出镜；位图图片素材；在浏览器里实时预览；图表按数据点逐个卡点（目前一张图表是一次 `draw`）。

## 致谢与许可

本项目以 MIT 许可发布，笔画引擎来自 [rough.js](https://github.com/rough-stuff/rough)（MIT，Preet Shihn）。
所用第三方数据与字体见 [THIRD_PARTY.md](THIRD_PARTY.md)。
