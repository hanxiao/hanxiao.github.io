# 搜索是一种 test-time compute

腾讯云 × Elastic「AI 搜索技术大会」演讲 deck，**44 页 ≈ 35 分钟**（一页一分钟）。
讲者：肖涵（Han Xiao），Elastic AI 副总裁。自包含 HTML，离线可放。

## 结构
论点先行，四个项目当注脚，最后回来扣题：

```
开场   2026 年搜索还有什么可做的       (2)
论断   搜索本来就是一种 test-time compute (3)
概念   什么叫 TTC + Noam Brown        (4-5)
论证   为什么搜索算 TTC               (6-8)   multi-pass / deeper pass / compose
金句页 花推理时间，买相关性 + 买新能力   (9)     ← 全场记忆点
项目一 autoresearch    买相关性        (11-23)
项目二 image tagging   买新能力        (24-33)
项目三 dataroom        买召回          (34-36)
项目四 searchbox + KG  买精度          (37-39)
扣题   两个层次 / 三个判断问题 / 最后一句 (40-43)
```

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

## 文件
`index.html` 全部 44 页 · `data.js` 合并数据 · `vendor/tex-svg.js` 自托管 MathJax ·
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
