# 搜索就是 test-time compute

腾讯云 × Elastic「AI 搜索技术大会」演讲 deck，**37 页 ≈ 35 分钟**（一页一分钟）。
讲者：肖涵（Han Xiao），Elastic AI 副总裁。自包含 HTML，离线可放。

## 叙事主线
主题是 **test-time compute**，不是某一个实验。顺序刻意排成先立论、再验证：

```
00 什么是 test-time compute      (3-4)   ← 取自 aie-sf-2026
01 搜索本来就是 test-time compute (5-8)   ← 本场论点，含 cosine → MaxSim → ColBERT 那条谱系
   ↓ 那么这笔算力到底能换到什么？
02 换精度   autoresearch 实验     (9-24)  ← aie-sf-2026 的内容
03 换新功能 image tagging 实验    (25-34) ← ttc-embedding-image-tagging-2026 的内容
   ↓
   合流：有效的算力 = 带来新信息的算力    (35-37)
```

两个实验不是并列展示，是**同一个问题的两面**：算力买到的是「更好的旧任务」还是「一个新任务」。
两边独立得出同一条结论（A/B 类有效、C 类是幻觉），第 35 页把它们接起来。

## 数据
`data.js` 由两份源文件合并，**变量名之外一个字节都没改**：
- `window.A` ← `aie-sf-2026/data.js`（144 程序 Pareto、money chart、per-model、learned head、transfer table、912 格 heatmap）
- `window.B` ← `ttc-embedding-image-tagging-2026/data.js`（COCO-150 四种方法、ladder、11 个杠杆、延迟-精度、词表直方图、Omni 落地）

改数字请回源文件改，然后重新合并，不要直接编辑本目录的 `data.js`。

## 十张图（全部客户端画进 SVG）
实验一：`drawPareto` 域内 Pareto · `drawMoney` 留出集中位数 vs 成本 · `drawPermodel` 分模型迁移 ·
`drawHead` 训练 head 对照 · `drawHeatmap` 912 格热力图 · `fillTransfer` 迁移表
实验二：`fillResults` 结果表 · `drawLadder` 三级台阶 · `drawLevers` 11 个杠杆 delta · `drawTagPareto` 延迟-精度 ·
`drawVocabHist` 词表分布四阶段动画（打印时定格到第 4 阶段）

## 视觉
大会官方 PPT 模板（`【PPT模板】AI搜索技术大会-内含字体`）的设计系统，色值取自模板 theme/slide XML 的高频色：
底 `#070810`，cyan `#26C6DA` / blue `#3B6FF0` / pink `#DC3CB4` / green `#27C08A` / amber `#F0A030`，
线 `#2A3040`，次级文字 `#9AA3B5`。页眉用模板原图的腾讯云 × Elastic 联合 logo；页脚
`Unlock the Power of Search AI`（青→品红渐变）+ `AI 搜索技术大会`。

从 aie-sf-2026 借来的向量示意图 SVG 已整体改色适配深色底（`#0B64DD`→`#26C6DA`，`#F04E98`→`#DC3CB4`，`#1C1E23`→`#8FA0BC`）。

## 字体
模板要求的思源黑体 CN（Light/Regular/Medium/Bold）+ Inter，按本 deck 实际用字子集化，自托管 `fonts/`，共约 450KB。

**改过文案后必须重跑子集化，否则新字会掉字形：**
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

## 文件
- `index.html` — 全部 37 页
- `data.js` — 合并后的两份实验数据
- `vendor/tex-svg.js` — 自托管 MathJax（公式离线渲染）
- `img/` — `grid/g1-g9.jpg` 标注示例、模板彩虹云 `cloud.png`、联合 logo `logos.png`、`qr-repo.png`
- `fonts/` — 子集化字体
- `slides.pdf` — 37 页导出版

## 放映
右/空格/点击 = 下一页，左 = 上一页，`f` = 全屏，`Home`/`End` = 首/末页，`#n` 深链到第 n 页。

## 重新导出 PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=12000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```
页眉/页脚是 JS 逐页 clone 进每个 `.slide` 的（`position:fixed` 在分页打印里只会出现在第 1 页），首页和末页故意不带。

## 两个坑
1. `.row` 必须显式写 `flex-direction:row`：`.body` 是 column，`.body.row` 会继承成竖排，图表和文字会上下堆叠。
2. 从别的 deck 搬 HTML 片段时，**对应的 CSS 类也要一起搬**（`.rgrid/.rcell/.rsvg` 漏了一次，整页炸开）。
