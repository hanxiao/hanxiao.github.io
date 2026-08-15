# 冻结的向量模型如何靠 test-time compute 学会打标签

腾讯云 × Elastic「AI 搜索技术大会」演讲 deck，18 页，自包含 HTML。
讲者：肖涵（Han Xiao），Elastic AI 副总裁。

内容沿用 [`ttc-embedding-image-tagging-2026`](../ttc-embedding-image-tagging-2026/) 的技术架构与全部
实验数据（COCO-150，80 类闭集），改成中文叙事并压缩到 18 页。
视觉系统改用大会官方 PPT 模板（`【PPT模板】AI搜索技术大会-内含字体`）：

- 深色底 `#070810`，蓝/青径向光晕
- 主色：cyan `#26C6DA` / blue `#3B6FF0` / pink `#DC3CB4` / green `#27C08A` / amber `#F0A030`
- 分隔线 `#2A3040`，正文次级色 `#9AA3B5`（全部取自模板 theme XML 的高频色）
- 页眉：彩虹云点 + 标题 + 腾讯云/Elastic 联合 logo（模板原图 `image5.png`）
- 页脚：`Unlock the Power of Search AI`（cyan→magenta 渐变）+ `AI 搜索技术大会`
- 章节页：大号章节号 + 竖条 + 青色氛围光，左下角锚定

## 字体
模板要求的思源黑体 CN（Light/Regular/Medium/Bold）+ Inter，已按本 deck 实际用字做子集化，
自托管在 `fonts/`，全部 5 个 woff2 共约 300KB，离线可用。

重新生成子集（改过文案后需要重跑，否则新字会掉字形）：

```
source ~/.openclaw/workspace/.venv/bin/activate
python3 -c "html=open('index.html',encoding='utf-8').read();chars=set(html)|set('0123456789.·×→←—–%「」');open('/tmp/subset-chars.txt','w',encoding='utf-8').write(''.join(sorted(c for c in chars if ord(c)>31)))"
F='<模板解压路径>/字体'
for p in "SOURCEHANSANSCN-LIGHT_2.OTF:shs-light" "SOURCEHANSANSCN-REGULAR_4.OTF:shs-regular" \
         "SOURCEHANSANSCN-MEDIUM_2.OTF:shs-medium" "SOURCEHANSANSCN-BOLD_6.OTF:shs-bold" "Inter.ttf:inter"; do
  python -m fontTools.subset "$F/${p%%:*}" --text-file=/tmp/subset-chars.txt \
    --output-file="fonts/${p##*:}.woff2" --flavor=woff2 --layout-features='' --no-hinting
done
```

## 文件
- `index.html` — 全部 18 页，直接打开即可，无需服务器和网络
- `data.js` — 图表数据，逐字取自项目结果文件，无估算值
- `img/` — 演示图 `grid/g1-g9.jpg`、模板彩虹云 `cloud.png`、联合 logo `logos.png`、`qr-repo.png`
- `fonts/` — 子集化的思源黑体 CN + Inter
- `slides.pdf` — 18 页导出版

## 四张图（客户端从 data.js 画进 SVG）
- 第 8 页 `drawVocabHist` — 12.8 万 token 得分分布的动画：raw → 减先验 → 词首 gate → NMS/top-k，
  真实 pipeline 输出。打印/PDF 时退化为最后一帧（rAF 探测）
- 第 11 页 `drawLadder` — mAP 三级台阶 0.264 → 0.635 → 0.710
- 第 12 页 `drawLevers` — 11 个杠杆的 delta 图，空心圆是各自的基线，实心圆是结果
- 第 13 页 `drawPareto` — 实测延迟（对数轴）对 mAP，前沿线 vs 校准类方法的塌缩簇

## 放映
右/空格/点击 = 下一页，左 = 上一页，`f` = 全屏，`Home`/`End` = 首/末页，`#n` 深链到第 n 页。

## 重新导出 PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=9000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```
页眉/页脚是逐页 clone 进每一页的（fixed 定位在分页打印里只会出现在第一页），首页和末页故意不带。
