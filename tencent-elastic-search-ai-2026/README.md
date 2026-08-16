# 搜索是一种 test-time compute

腾讯云 × Elastic「AI 搜索技术大会」演讲 deck，**36 页 ≈ 35 分钟**（一页一分钟）。
讲者：肖涵，Elastic 副总裁。自包含 HTML，离线可放。

## 结构
论点先行，四个项目当注脚，最后回来扣题：

```
开场   2026 年搜索还有什么可做的        (2)
论断   搜索本来就是一种 test-time compute (3)
概念   什么叫 TTC + Noam Brown         (4-5)
论证   为什么搜索算 TTC                (6-8)   multi-pass / deeper pass / compose
金句页 花推理时间，买相关性 + 买新能力    (9)     ← 全场记忆点
项目一 重排 / 页内检索 / 两段漏斗  买精度  (11-14)
项目二 image tagging          买新能力  (15-24)  末页收在 Omni（一句带过）
项目三 dataroom               买召回    (25-27)
项目四 searchbox + 知识图谱     买精度    (28-29)
项目五 dataroom harness        单独拷问检索 (30)
扣题   两个层次 / 三个判断问题 / 最后一句  (31-36)
```

**署名**：封面与尾页只写「肖涵 / Elastic 副总裁」。不写英文名，不写 Jina AI 创始人。

**项目取舍**（2026-08-15 定稿）：**autoresearch 已整段移除**，Han 判断它跟这个命题关系不大。
模型内一层用重排 / 页内检索 / 两段漏斗 / image tagging；模型外一层用 dataroom / searchbox /
知识图谱 / harness。Omni 只在 image tagging 末尾提一句落地。

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
5. **数字必须能追到源文件**。写之前先 grep 出处，别凭记忆。
6. **中文引号用「」**，不用直角双引号。删优于改：说不清的句子直接删掉更干净。

已知一次实例：标注开销曾被写成「~4%」，而 `~/Documents/omni-odi2026/data/measurements.md`
记的是 **+1.29 / +1.52 ms、约编码成本的 3%**，论文给的区间是 −5.4% 到 +2.4%（噪声内）。
以测量文件为准。

## 文件
`index.html` 全部 36 页 · `data.js` 合并数据 · `vendor/tex-svg.js` 自托管 MathJax ·
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
