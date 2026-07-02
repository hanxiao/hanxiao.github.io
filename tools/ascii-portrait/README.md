Generates /js/ascii-portrait.js (hanzi mosaic of portrait.jpg).

Region geometry in segment.py is hand-placed for the current 450x600
Golden Gate photo; re-tune the boxes if portrait.jpg changes.

    uv run --with pillow --with numpy python segment.py   # -> grid.txt colors.txt preview.png
    uv run python make_js.py                              # -> ../../js/ascii-portrait.js
