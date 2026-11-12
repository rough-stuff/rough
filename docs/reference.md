# 字段参考

## 项目目录

```
<项目>/
  project.yaml        项目设置
  voice/              alignment.json（时间表）、narration.wav（配音）
  scenes/             一个场景一个文件，按文件名排序：01-hook.yaml、02-xxx.yaml …
  doodles/            （可选）本项目自己画的手绘件
  brief.md            hj brief 生成：逐句时间简报
  storyboard.md       hj plan 生成：给用户确认的文字分镜表
  approvals.json      hj approve 写入：确认记录
  out/                关键帧与视频
```

## project.yaml

| 字段 | 默认 | 说明 |
|---|---|---|
| `title` | | 标题 |
| `format` | `portrait` | `portrait` 竖屏 1080×1920；`landscape` 横屏 1920×1080 |
| `fps` | 30 | |
| `voice` | `voice/alignment.json` | 时间表。也接受 `.srt`（降级：只有句级精度） |
| `audio` | 无 | 配音文件。没有则成片只有落笔音效 |
| `subtitles` | `true` | 字幕 |
| `subtitleMaxChars` | 竖 13 / 横 24 | 每行字幕最多字数 |
| `sfx` | `true` | 落笔音效。`true`：稀疏模式，每落一次笔一声很轻的短响，两声之间至少隔 0.9 秒；`full`：更密；`false`：关 |
| `sfxVolume` | 1 | 音效音量倍数 |
| `sfxSamples` | 无 | 用真实录音替换合成音：`{ pen: sfx/pen.wav, mark: sfx/circle.wav, erase: sfx/wipe.wav }`（16-bit WAV，路径相对项目目录）。合成音不如录音自然，有条件就换 |
| `pen` | `false` | 显示一个极小的笔尖 |
| `tail` | 0.6 | 口播结束后多留几秒 |

## 画板坐标

元素坐标以**画板**左上角为原点，x 向右、y 向下。画板已经避开了平台按钮和字幕区，画在里面就是安全的。

| 画幅 | 画板大小 |
|---|---|
| 竖屏 | 960 × 1250 |
| 横屏 | 1700 × 800 |

坐标可以写数字，也可以写百分比：`at: ["50%", "30%"]`。

## 场景文件

| 字段 | 必填 | 说明 |
|---|---|---|
| `from` | 第一个场景可省 | 场景开口的头几个字（口播锚点） |
| `intent` | 是 | 这个场景要让观众看到什么。写给用户看的人话 |
| `enter` | | `pan`（默认，镜头平移到新板面）/ `wipe`（把上一场擦掉）/ `cut` |
| `pattern` | | 表现手法：自带构图和动作编排的场景骨架，见下文 |
| `elements` | | `id: 定义` 的映射。id 只在本场景内有效 |
| `beats` | | 节拍列表，按口播顺序 |
| `id` | | 场景名，默认取文件名（去掉序号） |
| `note` | | 随便写的备注，不参与任何计算 |

## 表现手法（pattern）

手法替你决定位置、大小、箭头走向和动作顺序；你决定角色是谁、每一步卡在哪句话上。

```yaml
from: "咱们跟着一百块钱"
intent: 一张钞票从公司到政府、到你、再回公司，公司一分没多赚。
pattern:
  kind: cycle
  nodes:
    - { id: company, doodle: factory, label: 公司 }
    - { id: gov, doodle: gov, label: 政府 }
    - { id: you, figure: stand, label: 你 }
  result: "+0"
beats:
  - at: "收走一百块税"
    intent: 画出政府，钞票沿箭头滑过去
    do:
      - { step: show.2 }
      - { step: go.1 }
  - at: "一分没有"
    intent: 写下 +0
    do:
      - { step: result }
      - { pose: you, to: shrug, with: prev }     # 手法的步骤和自己的动作可以混着写
```

- `hj patterns` 列出全部九种，`hj patterns cycle` 看某一种的参数和步骤。实际效果见 `examples/patterns/`。
- 手法里的角色写法和普通元素一样，只是不用写位置；大小可省（手法会给合适的默认值），也可以自己写 `size` 覆盖。
- 给角色写 `id`，之后就能在自己的动作里引用它（换姿势、圈起来、推镜头）。没写 id 的，用手法自动起的名字（`hj check` 报错信息里会列出）。
- `{ step: 名字 }` 上可以加 `at`、`with: prev`、`delay`，作用于这一步的第一个动作。
- `area: [x, y, w, h]` 让手法只占画板的一部分（可用百分比），剩下的地方放自己的元素。
- **一块板放多种手法**：`pattern` 写成列表，每种都写 `area`。这时步骤名要带前缀 `<kind>.<步骤>`（如 `cycle.go.1`、`bars.cut.1`）；同一种手法用两次时给它们各写一个 `name` 当前缀。
- `cycle` 的 `flows`、`chain` 的 `links` 给每条箭头写小字；`timeline` 的事件可以带 `note`。
- 手法展开后就是普通元素。位置不满意时，可以把 `hj check` 通过后的那个元素在 `elements` 里重新定义一个，或者干脆不用手法、照着它的布局自己摆。

## 口播锚点

节拍的 `at`、场景的 `from`、动作的 `at` 都用它。

| 写法 | 含义 |
|---|---|
| `"收走一百块税"` | 这几个字开口的那一刻 |
| `"一百块#2"` | 本场景口播里第 2 次出现的“一百块” |
| `"一分没有@end"` | 说完这几个字的那一刻 |
| `"发给你-0.3"` / `"发给你+0.2"` | 提前 / 推后若干秒 |
| `"一百块#2@end+0.1"` | 可以组合，顺序固定：文字、`#n`、`@end`、偏移 |

锚点只在**本场景的口播范围内**查找，所以片段不用写很长，够在本场景里唯一就行。标点会被忽略。

## 节拍

```yaml
- at: "收走一百块税"     # 必填：口播锚点
  lead: 0.3               # 可选：比锚点提前几秒起笔
  intent: 钞票从公司滑到政府   # 必填：这一拍画面上发生什么（人话）
  do: [ … ]               # 动作列表
```

**动作怎么排时间：** 默认一个接一个顺序执行，从节拍的时刻开始，到下一拍为止。
`draw` 的时长是自动的：按笔画长度估算“自然时长”，时间不够就整体加快，时间富余则最多放慢到 1.25 倍。

每个动作都可以加：

| 选项 | 说明 |
|---|---|
| `with: prev` | 和上一个动作同时开始（不排队） |
| `dur: 0.8` | 指定时长（秒） |
| `delay: 0.2` | 开始前多等一会儿 |
| `at: "口播片段"` | 这个动作自己卡一个点；它后面的动作接着它排 |

## 动作

| 动作 | 写法 | 说明 |
|---|---|---|
| 画 | `draw: id` 或 `draw: [a, b, c]` | 一笔一笔画出来。数组表示依次画 |
| 画（内联） | `draw: { mark: circle, target: x }` | 直接在动作里定义一个元素，省得去 elements 里起名 |
| 擦 | `erase: id` / `[ids]` / `all` | `style: wipe`（默认，板擦擦掉）或 `fade` |
| 走过去 | `walk: 小人id`，配 `to` / `by` | 边移动边迈步，到了恢复原姿势。时长默认 1.1 秒，远的话写 `dur` |
| 移动 | `move: id`，配 `to` / `by` / `along` | `to: gov` 或 `to: you.handR` 或 `to: [x, y]`；`by: [dx, dy]`；`along: 箭头id` 沿箭头走 |
| 缩放 | `scale: id, to: 1.6` | 相对原始大小的倍数 |
| 换姿势 | `pose: 小人id, to: shrug` | 可同时 `face: surprised` |
| 换表情 | `face: 小人id, to: worried` | |
| 弹出 / 淡入 | `pop: id` / `fade: id` | 不经过“画”直接出现。少用，这是 PPT 的出场方式 |
| 隐去 | `hide: id` | 快速淡出 |
| 晃动 / 放大强调 / 点头 | `shake: id` / `pulse: id` / `nod: id` | 吸引注意 |
| 镜头 | `camera: { focus: [a, b], pad: 90 }` / `camera: home` | 推近若干元素 / 回到全景 |
| 等待 | `wait: 0.5` | |

`move` 之后，元素的新位置会被后续的 `move ... to` 和 `camera focus` 认到；但先前已经画好的箭头和标记不会跟着动。

## 元素

### 不重叠是引擎保证的

手绘的板面上，东西不会互相压着。这一条不靠你自己检查，由引擎在布局时保证：

- **压到了就自动挪开。** 一个元素按你写的位置会压到同时在板上的其他元素时，引擎把它挪到最近的空位，并在 `hj check` 里用一条“提示”告诉你挪了多少。
- **出了画板就自动拉回来。**
- **连线自动绕路。** 箭头、连线如果会从别的元素身上穿过，引擎换一个弯度绕开。
- **小字和批注自动换边。** 箭头上的小字、批注想放的那一侧放不下，就换到另一侧或就近的空地。
- **位置可以不写。** 不写任何定位的元素，由引擎像人在板上找地方一样，从上到下、从左到右找第一块放得下的空地；写 `near: 某元素` 则放在离它最近的空地。拿不准坐标时，不写比乱写好。
- 只有**同时在板上**的元素才互相避让：一个东西被擦掉之后，它的位置可以再画别的。

以下情况不算重叠，引擎不会动它们：标记（圈、叉、下划线，本来就是画在目标上的）；用 `at: 某元素` 明确放在另一个元素上面的东西（气泡里的字、手里的钞票），以及挨着它们摆的元素；写了 `overlap: true` 的元素。

板上实在挤到找不到空位时，引擎会放弃并给出警告——这说明这块板该擦掉一些，或者该换一块板了。

### 定位（可以不写；要写就选一种）

| 写法 | 说明 |
|---|---|
| `at: [x, y]` | 元素中心放在这个点 |
| `at: other` / `at: other.top` | 放在另一个元素的中心 / 某个锚点上 |
| `rightOf: other`、`leftOf`、`above`、`below` | 贴在另一个元素旁边，`gap`（默认 40）控制间距，`align: start/center/end` 控制对齐 |
| `anchor: bottom` | 配合 `at`：用自己的哪个点去对齐（默认 `center`；可选 `top bottom left right topLeft …`） |
| `dx`、`dy` | 在以上基础上再微调。**改位置优先用它** |
| （都不写） | 引擎自动找空位。可加 `near: other` 指定靠近谁 |
| `overlap: true` | 声明“我就是要压在别的东西上”，引擎不再挪它 |

被引用的元素必须写在前面。锚点有：`center top bottom left right topLeft topRight bottomLeft bottomRight`，小人另有 `head handL handR hip feet`。

### 通用外观

`size`（大小）、`color`、`fill`（填充色）、`fillAlpha`（填充浓度）、`fillStyle`（`marker` 马克笔涂色，默认 / `hachure` 细排线 / `solid` 平涂 / `zigzag` / `cross-hatch` / `dots`）、`pen`（线宽，默认 5.5）、`rough`（抖动程度，默认 0.9）、`label` + `labelSize`（写在元素正下方的标签，随元素一起画）。

颜色名：`ink red blue green yellow orange purple gray paper`，也可以直接写 `"#rrggbb"`。

### 各类元素

| 类型 | 写法 | 说明 |
|---|---|---|
| 文字 | `{ text: "+0", size: 150, color: red }` | `\n` 换行；`align`。`size` 是字高。字体是手写马克笔体「霞鹜漫黑」 |
| 小人 | `{ figure: stand, face: happy, wear: [tophat, tie], size: 420 }` | `size` 是身高；`accent` 是配饰颜色；`carry: { doodle: moneybag, hand: left }` 手里拿一样东西（默认右手，跟着手动）。姿势/表情/配饰清单：`hj assets figure` |
| 手绘件 | `{ doodle: banknote, size: 200, vars: { text: "100" } }` | **首选**。47 个，和小人同一画风：`hj assets doodles` 查看；`vars` 是该手绘件开放的可调项 |
| 图标 | `{ icon: building-bank, size: 280 }` | 兜底。5000+ 个线条图标，`hj assets icons <英文关键词>` 搜索。造型偏“界面图标”，手绘件里有的就别用它 |
| 形状 | `{ shape: rect, w: 300, h: 180 }` | `rect ellipse circle diamond triangle cloud` |
| 批注 | `{ note: 写进州宪法, target: safe, side: right }` | 一行小字贴在目标旁边，用细线牵过去。`side`: `right`（默认）`left top bottom`；`gap` 距离；`size` 默认 40；默认灰色。用来补数字、名字、出处 |
| 箭头 | `{ arrow: [a, b], curve: 0.2, label: 交税 }` | 起终点可以是元素 id（自动停在边缘外）、`"id.锚点"` 或 `[x, y]`。`curve` 弯曲程度（正负决定朝向）、`both: true` 双向、`head` 箭头大小、`pad` 离元素的距离、`label` 写在箭头中段的小字（`labelSize` 默认 42） |
| 连线 | `{ line: [a, b] }` | 同箭头，没有箭头尖 |
| 标记 | `{ mark: circle, target: x }` | `circle box underline strike cross highlight check burst`。`target` 可以是数组；`pad` 调松紧；默认红色 |
| 图表 | `{ chart: bar, data: [3800, 1200], labels: [法定, 实发], values: true }` | `bar` / `line`。`highlight: 1` 或 `highlight: {1: red}` 标红某项；`unit` 数值后缀；`w`、`h` |
| 自由图形 | `{ parts: [ … ], box: [w, h], size: 200 }` | 就地用基本图形拼一个，格式同手绘件 |

折线图和箭头、连线一样，可以当作 `move … along` 的轨迹。

## 自己画手绘件

在项目的 `doodles/<名字>.yaml` 里：

```yaml
desc: 钞票
box: [220, 120]              # 设计尺寸；使用时 size 对应长边
vars: { text: "100", tint: green }   # 可调项及默认值
parts:                       # 按书写顺序排列，坐标在 box 内
  - rect: [0, 0, 220, 120]   # x, y, w, h
    color: $tint
    fill: $tint
  - ellipse: [110, 60, 96, 76]   # cx, cy, w, h
  - text: $text
    at: [110, 60]
    size: 46
```

可用图形：`line: [x1,y1,x2,y2]`、`rect: [x,y,w,h]`、`ellipse: [cx,cy,w,h]`、`circle: [cx,cy,直径]`、`arc: [cx,cy,w,h,起始角,终止角]`、`poly: [[x,y],…]`（加 `close: true` 闭合）、`curve: [[x,y],…]`（过这些点的平滑曲线）、`path: "SVG 路径"`、`icon: 名字`（配 `at`、`size`）、`text`（配 `at`、`size`）。
每个图形可带 `color fill fillStyle fillAlpha fillGap pen rough`。

画完用 `hj assets sheet` 看效果。内置的在仓库根目录 `doodles/`，可以照着写。

## 检查器会拦什么

| 级别 | 情况 |
|---|---|
| 错误 | 锚点在口播里找不到；引用了不存在的元素；缺 `intent`；板书照抄口播 ≥7 字；元素整个在画板外 |
| 警告 | 画得太赶（超过自然速度 2.5 倍）；一拍的动作拖过了下一拍；画面静止超过 4.2 秒；元素重叠（引擎没能自动挪开时）；画面太空；纯文字场景；信息密度偏低（讲得久、东西少）；板书太多；字号太小；弹出/淡入用得太多；卡点落在时间不可靠的字上；锚点有歧义 |
