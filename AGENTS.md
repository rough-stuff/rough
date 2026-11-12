# 画讲（huajiang）—— 给 agent 的工作手册

这个仓库是一个底座：把**带逐字时间表的口播**做成“边画边讲”的手绘视频。
你的任务通常是：用户给你一份口播稿、时间表和配音，你来决定画面上画什么、什么时候画，然后交出成片。

成片的标准只有一条：**看起来像一个真人站在白板前，一边讲一边画给你看。**
不是 PPT，不是带插图的字幕。

## 铁律

1. **用户确认之前不渲染。** 流程有两道闸：文字分镜 → 关键帧 → 视频。`hj approve` 只能在用户明确说“可以”之后运行，`--by` 里填用户的原话。不要替用户确认，不要绕过闸门。
2. **画面演示口播，不抄写口播。** 板书只允许关键词、数字、标签。完整的话只出现在字幕里。检查器会拦截照抄口播 7 个字以上的板书。
3. **卡点写口播原文，不写秒数。** `at: "收走一百块税"`，而不是 `at: 31.2`。这样换配音、改语速后分镜自动跟随。
4. **`hj check` 零错误才能往下走**；警告要么修掉，要么向用户说明为什么保留。
5. **画面要有料。** 每个场景结束时，板上应该是一张信息丰富、值得截图的图解：主体、支撑数字、批注三层都有。稀疏的画面显得内容单薄。见 directing.md 第三节。
6. **改动要小。** 用户提修改意见时，改对应的那几行，不要重写场景。见 [docs/revising.md](docs/revising.md)。

## 工作流

```bash
npm install                                   # 首次
npx hj init work/<项目名> --voice <配音材料目录> --format portrait
npx hj brief work/<项目名>                    # 逐句时间、停顿、不可靠的字
# 读 docs/directing.md，然后在 work/<项目名>/scenes/ 里一个场景一个文件地写分镜
npx hj check work/<项目名>                    # 编译 + 质量检查，随时跑
npx hj plan work/<项目名>                     # 生成 storyboard.md
# ── 把 storyboard.md 交给用户，等用户确认 ──
npx hj approve work/<项目名> plan --by "<用户原话>"
npx hj stills work/<项目名>                   # 每拍一张关键帧 + 每场景一张联系表
# 自己先逐张看图、改到满意，再交给用户，等用户确认
npx hj approve work/<项目名> keyframes --by "<用户原话>"
npx hj render work/<项目名> --draft           # 半分辨率草稿，快
npx hj render work/<项目名>                   # 正式成片 out/video.mp4
```

`work/` 已被 git 忽略：用户的稿子和配音默认不进仓库。

**确认之后还能改吗？** 能。只调位置、大小、颜色、时长、动作细节，不会让确认失效。
改了场景划分、`from`、`intent` 或某一拍的 `at`（也就是“画什么、什么时候画”变了），确认自动失效，需要用户重新确认。

## 一个场景长什么样

大多数场景应该从一种**表现手法**起步（见 directing.md 第二节和 reference 的“表现手法”），下面是不用手法、从零摆元素的写法：

```yaml
# scenes/03-loop.yaml
from: "咱们跟着一百块钱"          # 这个场景从哪句口播开始
intent: 公司、政府、你站成三角，一张钞票绕一圈回到原点，公司一分没多赚。
enter: pan                        # pan 镜头平移到新板面 / wipe 擦掉重来 / cut 直接切

elements:                         # 画什么、放哪儿
  company: { doodle: factory, size: 280, at: [200, 300], label: 公司 }
  gov:     { doodle: gov, size: 280, at: [760, 300], label: 政府 }
  you:     { figure: stand, size: 420, at: [480, 950] }
  bill:    { doodle: banknote, size: 190, at: company.bottom, dy: 80 }
  tax:     { arrow: [company, gov], curve: -0.2 }

beats:                            # 什么时候、怎么动
  - at: "政府从公司"
    intent: 画出公司和政府
    do:
      - draw: [company, gov]
  - at: "收走一百块税"
    intent: 钞票沿箭头从公司滑到政府
    do:
      - draw: tax
      - { move: bill, along: tax, with: prev }
```

`elements` 管“是什么、在哪儿”，`beats` 管“什么时候、怎么动”。两者分开，改位置不碰时间，改时间不碰位置。

## 该读什么

| 你要做的事 | 读 |
|---|---|
| 想清楚每段话画什么（**最重要，先读这个**） | [docs/directing.md](docs/directing.md) |
| 查某个字段、动作、元素怎么写 | [docs/reference.md](docs/reference.md) |
| 用户提了修改意见 | [docs/revising.md](docs/revising.md) |
| 要给配音方提要求 / 自己生成配音 | [docs/voice-guide.md](docs/voice-guide.md) |
| 看九种表现手法各长什么样 | [examples/patterns/](examples/patterns/) |
| 看一个从零摆元素的完整例子 | [examples/compound/](examples/compound/) |

找手法和素材：

```bash
npx hj patterns                    # 九种表现手法：自带构图和动作编排（先看这个）
npx hj assets doodles              # 47 个手绘件，和小人同一画风（首选）
npx hj assets icons factory        # 5000+ 线条图标，英文关键词搜索（兜底）
npx hj assets figure               # 小人的姿势、表情、配饰
npx hj assets sheet --out sheet.png   # 把上面这些画成一张图，直接看长相
```

没有合适的素材时，在项目的 `doodles/` 目录里用基本图形自己画一个（格式见 reference），不要用文字顶替。

## 代码地图

```
src/rough/        原 rough.js：把几何图形抖成手绘线（笔画引擎，一般不用动）
src/core/
  alignment.ts    时间表加载、口播锚点解析、字幕切分
  strokes.ts      rough 输出 → 可按时间重放的笔画
  text.ts         手写字体字形 + 按笔顺书写
  figure.ts       火柴人：姿势、表情、配饰、手持物
  patterns.ts     表现手法：九种自带构图与编排的场景骨架
  icons.ts        Tabler 图标
  elements.ts     元素构建与相对布局
  compile.ts      分镜 → 绝对时间线（动作排程、镜头、擦除）
  lint.ts         质量检查、文字分镜表
  render.ts       drawFrame(ctx, 时间线, t)：画面是时间的纯函数；笔触、纸面、涂色的质感都在这里
  sfx.ts          落笔音效合成
src/cli/main.ts   hj 命令
doodles/          内置手绘件
assets/fonts/     手写字体（霞鹜漫黑，OFL）
```

改引擎之后跑 `npm test` 和 `npm run typecheck`。
