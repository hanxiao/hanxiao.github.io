# 搜索是一种 test-time compute

腾讯云 × Elastic「AI 搜索技术大会」演讲 deck，**40 页 ≈ 35 分钟**（一页一分钟）。
讲者：肖涵，Elastic 副总裁。自包含 HTML，离线可放。

## 结构
论点先行，四个项目当注脚，最后回来扣题：

```
开场   2026 年搜索还剩什么可做          (2)
论断   搜索本来就是一种 test-time compute (3)
概念   什么叫 TTC + Noam Brown         (4-5)
论证   为什么搜索算 TTC                (6-7)
金句页 花推理时间，买相关性 + 买新能力    (8)
三类   Deeper pass / More passes / Calibration (9)
路线图 四块地方都能花这笔算力            (10)
02 向量模型的 TTC   Pareto / 十二个程序 / 迁移  (11-14)
03 重排模型的 TTC   双塔vs listwise / 页内 / 漏斗 (15-18)
04 用 TTC 换新能力  image tagging          (19-28)
05 Agentic search 的 TTC  dataroom / searchbox / KG / harness (29-35)
扣题   两个层次 / 三个判断问题 / 最后一句  (36-40)
```

**署名**：封面与尾页只写「肖涵 / Elastic 副总裁」。不写英文名，不写 Jina AI 创始人。

**内容取舍**（2026-08-15 定稿）：讲 autoresearch **搜出了什么**（Pareto 曲线、十二个程序、
迁移结果 = aie-sf-2026 的 #17/#18/#20），**不讲它的探索过程**。这三页是「冻结向量模型靠 TTC
能走多远」的实证，属于命题的一部分。模型外一层用 dataroom / searchbox / 知识图谱 / harness。
Omni 只在 image tagging 末尾提一句落地。

**正文不写个人感慨**。「这几个月我一直在想」「这活我没自己干」「当年给投资人准备 data room」
这类第一人称抒发一律删除，只留论点和证据。

**字号**（Han 2026-08-15 指定，单位是 PPT 磅，画布 960×540pt；本 deck stage 是 1280×720px，
所以 1pt = 1.3333px。改这几处务必换算，不要直接填磅值）：

| 位置 | 磅 | px |
| --- | --- | --- |
| 首页主标题 | 55 | 73.3 |
| 首页副标题 | 32 | 42.7 |
| 首页姓名 / 头衔 | 20 | 26.7 |
| 内容页标题（页眉那一行） | 22 | 29.3 |
| 内容页正文，一律 | 13 | 17.3 |

**每页只有一个标题**。内容页的标题写在页眉里（`data-title` 属性，由 JS 注入页眉的 `.ttl span`），
页面正文区不再有 h2。kicker（小标题 / 概述标题）已全部删除，只有封面还留一行。
新增内容页时：`<section class="slide" data-title="这页的标题">`，正文直接从内容开始，不要再写 `h2`
或 `kicker`。章节分隔页写 `data-title=""`，让页眉标题留空。

正文里所有能看到的字号都统一到 17.3px（cap / card 描述 / kpi 标签 / 列表 / 图注 / takeaway），
不要再引入 14px、15px 这种中间档。

**页眉图标**：用 Han 给的彩虹云 PNG（`img/cloud-mark.png`，原图 `Picture1.png` 裁掉留白后的版本），
不要用 CSS 画的圆点。同一张图缩放后也是封面和尾页的主视觉 `img/cloud.png`。

**结论一律走正向**：讲每个项目「成立的那部分」和它带来的东西，不做负面归纳。
（比如迁移那一段的说法是「最便宜的那批反而能搬走」，不是「贵的失败了」。）

## 数据
`data.js` 由两份源文件合并，**除变量名外一个字节没改**：
- `window.A` ← `aie-sf-2026/data.js`（144 程序 Pareto、money chart、per-model、transfer table 等）
- `window.B` ← `ttc-embedding-image-tagging-2026/data.js`（COCO-150、ladder、11 个杠杆、延迟-精度、词表直方图）

改数字请回源文件改再重新合并，不要直接编辑本目录的 `data.js`。
（`A.head` / `A.heatmap` 这两组数据保留在文件里但当前没有对应页面，将来要用可以直接接。）

## 图表（客户端画进 SVG）
`drawPareto` 域内 Pareto · `drawMoney` 迁移对照 · `drawPermodel` 分模型 · `fillTransfer` 迁移表 ·
`fillResults` 结果表 · `drawLadder` 两级台阶 · `drawLevers` 杠杆 delta · `drawTagPareto` 延迟-精度 ·
`drawVocabHist` 词表分布四阶段动画（打印时定格最后一帧）

## 视觉
大会官方 PPT 模板的设计系统，色值取自模板 theme/slide XML 高频色：底 `#070810`，
cyan `#26C6DA` / blue `#3B6FF0` / pink `#DC3CB4` / green `#27C08A` / amber `#F0A030`，
线 `#2A3040`，次级文字 `#9AA3B5`。页眉用模板原图的腾讯云 × Elastic 联合 logo。
从 aie-sf-2026 借来的 SVG 已整体改色适配深色底（`#0B64DD`→`#26C6DA`，`#F04E98`→`#DC3CB4`，`#1C1E23`→`#8FA0BC`）。

## 字体
模板指定的思源黑体 CN（Light/Regular/Medium/Bold）+ Inter，按实际用字子集化自托管。

**改过文案后必须重跑，否则新字掉字形：**
```
source ~/.openclaw/workspace/.venv/bin/activate
python3 -c "html=open('index.html',encoding='utf-8').read();chars=set(html)|set('0123456789.·×→←—–%「」↻±≈');open('/tmp/subset-chars.txt','w',encoding='utf-8').write(''.join(sorted(c for c in chars if ord(c)>31)))"
F='<模板解压路径>/字体'
for p in "SOURCEHANSANSCN-LIGHT_2.OTF:shs-light" "SOURCEHANSANSCN-REGULAR_4.OTF:shs-regular" \
         "SOURCEHANSANSCN-MEDIUM_2.OTF:shs-medium" "SOURCEHANSANSCN-BOLD_6.OTF:shs-bold" "Inter.ttf:inter"; do
  python -m fontTools.subset "$F/${p%%:*}" --text-file=/tmp/subset-chars.txt \
    --output-file="fonts/${p##*:}.woff2" --flavor=woff2 --layout-features='' --no-hinting
done
```

## 文案口径
中文按**口语讲稿**写，不是书面报告：短句、白话、有人称（「我」「你」）。
避免「四个论断指向同一个结论」这类翻译腔和排比式总结。写完念一遍，念着别扭就改。

改稿时对照 `~/Documents/omni-odi2026/paper/STYLE.md`（Han 的写作风格规则）。落到这个 deck 上，
每次 revise 至少查这几条：

1. **四种被点名禁掉的句式**：clipped fragment（「A，单词」式的同位语尾巴）、riddle metaphor
   （要解码才懂的句子）、staccato fragment list（冒号后一串没有谓语的短语）、casual idiom
   （「热闹在别处」「功劳跟锅」「逼出汗」这类）。
2. **不写过程、不写负面**：只讲成立的部分和它换来了什么，不写试过什么没用、不写被否掉的路线。
3. **不留失效引用**：删掉某个项目后，别的页面里「对应上一轮的 c = 1.0」这种指向就成了空引用，
   必须一并清掉。
4. **标题一个规矩**：短陈述句，不加句号，不用「什么是 X」「X 是如何 Y 的」这类博客式标题。
   **每一页的标题都必须服务 TTC 主线**（Han 2026-08-17）：只要一眼扫过全部页眉，就能看出整个 deck 在讲推理期算力。
   - 标题里要出现算力 / 推理期 / 多算一遍 / 花这笔账 这类词，至少要能间接指回 TTC。
   - **禁标题里出现内部代号 A / B / C**（「三种花法」可以写，正文里再挂 A/B/C 标号）。
   - **禁「免训练」当标题卖点**：training-free 只是 TTC 里最省的一种做法，不是本 deck 的命题。
   - **禁拿项目名 / 工具名开头**（dataroom：…、searchbox：…、harness：…、Autoresearch、Agentic search）。
     项目名写进正文和二维码，标题只说这页在拿算力换什么。
   - 章节分隔页同理：章名是「…的 test-time compute」或「…就在推理时花算力」这类，不用产品形态命名。
5. **数字必须能追到源文件**。写之前先 grep 出处，别凭记忆。
6. **中文引号用「」**，不用直角双引号。删优于改：说不清的句子直接删掉更干净。

已知一次实例：标注开销曾被写成「~4%」，而 `~/Documents/omni-odi2026/data/measurements.md`
记的是 **+1.29 / +1.52 ms、约编码成本的 3%**，论文给的区间是 −5.4% 到 +2.4%（噪声内）。
以测量文件为准。

## 文件
`index.html` 全部 41 页 · `data.js` 合并数据 · `vendor/tex-svg.js` 自托管 MathJax ·
`img/` 图片与四个项目二维码 · `fonts/` 子集化字体 · `slides.pdf` 导出版

## 放映
右/空格/点击 = 下一页，左 = 上一页，`f` = 全屏，`Home`/`End` = 首/末页，`#n` 深链。

## 重新导出 PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=13000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```
页眉页脚是 JS 逐页 clone 进每个 `.slide` 的（`position:fixed` 分页打印只出现在第 1 页），首末页不带。

## 坑
1. `.row` 必须显式 `flex-direction:row`：`.body` 是 column，`.body.row` 会继承成竖排。
2. 从别的 deck 搬 HTML 片段，**对应 CSS 类要一起搬**（`.rgrid/.rcell/.rsvg`、`.trendrow`、`.synp` 都踩过）。

## 缓存陷阱（踩过一次）

`data.js` 和 `fonts/*.woff2` 都带 `?v=N` 查询串，**改了内容就必须把 N 加一**。

Cloudflare 对这些静态资源发 `cache-control: max-age=14400`（4 小时）。2026-08-15 出过一次事故：
`data.js?v=1` 的版本号从建站起没动过，而中途有一版 `data.js` 删掉了 `window.A`。后来 `window.A`
恢复了，但边缘缓存还在发那份删掉的副本，于是线上第 12、14 页的图表**画不出来，显示为空**，
本地 PDF 却完全正常——这种「本地对、线上空」的现象基本就是它。

排查命令：
```
curl -s -D- -o /dev/null "https://hanxiao.io/tencent-elastic-search-ai-2026/data.js?v=N" \
  | grep -iE "cf-cache-status|age:|cache-control"
node -e "global.window={};require('./data.js');console.log(Object.keys(window.A))"
```
