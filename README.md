# 小提琴 3D 互動教學手冊

一本可以旋轉、拆解、點選與聆聽的小提琴入門手冊。以 Three.js 即時算圖的 3D 小提琴為核心，搭配十個章節的文字導讀、空弦試聽與小測驗，涵蓋從克雷莫納製琴史、琴身構造、四根弦的音域、持琴姿勢、運弓技法、左手把位到日常養護與經典曲目。

- **線上版本**：<https://violin.gh.miniasp.com>
- **原始碼**：<https://github.com/doggy8088/3d-violin-manual>

## 功能

- **3D 小提琴**：拖曳旋轉、滾輪或捏合縮放，相機會依章節自動構圖。
- **部位解剖**：點選琴身各部位查看說明，按 <kbd>E</kbd> 切換分解視圖（含音柱）。
- **空弦試聽**：以 Web Audio API 即時合成 G3 / D4 / A4 / E5，可單弦試聽或四弦齊鳴。
- **運弓示範**：切換分弓、連弓、斷奏等技法，3D 弓會示範動作路徑。
- **左手把位**：第一把位指法與音名對照，並標示換把、揉弦、雙音與泛音要點。
- **小測驗**：八題選擇題，作答後立即解說並計分。
- **鍵盤操作**：<kbd>←</kbd> <kbd>→</kbd> 翻頁、<kbd>E</kbd> 分解視圖、<kbd>?</kbd> 開關說明、<kbd>Esc</kbd> 取消選取。

## 技術組成

| 項目 | 版本 |
| --- | --- |
| React | 19.2 |
| TypeScript | 5.9（`strict`、`noUnusedLocals`、`noUnusedParameters`） |
| Vite | 7.3 |
| Three.js / React Three Fiber / drei | 0.186 / 9.7 / 10.7 |
| Tailwind CSS | 4.1（透過 `@tailwindcss/vite`） |

建置採用 [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)，把 JavaScript 與 CSS 全部內嵌進 `dist/index.html`，因此網站只需要一個 HTML 檔加上 `dist/images/` 的圖片就能運作。

## 本機執行

需要 Node.js 20 以上版本。本專案提供 `Makefile` 包裝所有常用指令，執行 `make` 即可看到完整清單。

```bash
make install   # 依 package-lock.json 安裝相依套件
make dev       # 啟動開發伺服器，預設 http://127.0.0.1:5173
```

不想用 `make` 時，等價的 npm 指令是 `npm ci` 與 `npm run dev`。

### 常用指令

```bash
make build        # 型別檢查後建置單檔靜態網站到 dist/
make preview      # 以 Vite 預覽建置產物，預設 http://127.0.0.1:4173
make serve        # 用純靜態 HTTP 伺服器提供 dist/，預設 http://127.0.0.1:8080
make typecheck    # tsc --noEmit
make check        # 對建置產物執行站點預檢（HTML、資源、metadata、JSON-LD）
make verify       # = build + check，發佈前必經流程
make audit        # npm audit
make clean        # 移除 dist/
make cleanall     # 移除 dist/ 與 node_modules/
make status       # 顯示 GitHub Pages 與最近一次部署狀態
make release      # verify 後觸發 GitHub Pages 部署工作流程
```

連接埠可用變數覆寫，例如 `make dev PORT=3000` 或 `make serve STATIC_PORT=9000`。

> **注意**：音訊與剪貼簿等瀏覽器 API 在 `file://` 下行為不同。請務必透過 `make dev`、`make preview` 或 `make serve` 以 HTTP 開啟頁面，不要直接點開 `dist/index.html`。

## 專案結構

```
.
├── index.html                     # Vite 進入點（head metadata、JSON-LD、favicon）
├── Makefile                       # 本機開發與發佈指令
├── public/
│   ├── CNAME                      # GitHub Pages 自訂網域
│   ├── robots.txt / sitemap.xml   # 檢索政策
│   ├── site.webmanifest           # PWA 安裝資訊
│   ├── favicon.svg / favicon.ico  # 瀏覽器圖示
│   ├── favicon-16x16.png ...      # PNG 尺寸備援
│   ├── apple-touch-icon.png       # iOS 主畫面圖示
│   └── images/                    # 站內照片與社群分享卡片
├── src/
│   ├── App.tsx                    # 章節狀態、鍵盤快捷鍵、音訊開關
│   ├── components/
│   │   ├── Scene.tsx              # 3D 場景、燈光、相機運鏡
│   │   ├── ViolinModel.tsx        # 小提琴與弓的程序化模型
│   │   ├── Overlay.tsx            # 各章節面板、導覽列、頁尾、說明
│   │   ├── Photo.tsx              # 照片載入失敗時顯示替代方塊
│   │   └── Quiz.tsx               # 小測驗
│   ├── data/handbook.ts           # 章節、部位、弦、姿勢、曲目等內容
│   ├── lib/audio.ts               # Web Audio 弦音合成
│   ├── lib/woodTexture.ts         # 程序化木紋貼圖
│   └── index.css                  # Tailwind 主題、動畫與版面
└── .github/workflows/deploy.yml   # GitHub Actions 建置與 Pages 部署
```

## 部署

推送到 `main` 分支後，`.github/workflows/deploy.yml` 會自動執行型別檢查、建置與站點預檢，再透過 GitHub Pages 發佈到 <https://violin.gh.miniasp.com>。

自訂網域設定：

1. `public/CNAME` 內容為 `violin.gh.miniasp.com`，建置時會複製到 `dist/`。
2. DNS 將 `*.gh.miniasp.com` 以 CNAME 指向 `doggy8088.github.io`。
3. 儲存庫的 Pages 設定來源為 **GitHub Actions**，自訂網域為 `violin.gh.miniasp.com`。

在本機先驗證再發佈：

```bash
make verify    # 型別檢查 + 建置 + 站點預檢
git push       # 觸發 GitHub Actions 部署
make status    # 查看 Pages 與最近部署狀態
```

## 已知限制

- 3D 場景需要 WebGL；不支援 WebGL 的瀏覽器只會看到文字面板。
- 弦音是以振盪器即時合成的近似音色，並非真實錄音取樣。
- 行動裝置為效能考量會降低裝置像素比（`dpr` 上限 1.6），細節略少於桌機。
- 3D 模型為程序化產生，用於教學辨識，並非特定名琴的精確複製。
- 站內部分照片來自 Pexels 圖庫，需在部署環境能連線外部網路才能載入。

## 授權與聲明

- 程式碼以 [MIT License](LICENSE) 釋出，© 2026 Will 保哥。
- 「Pexels」為 Pexels GmbH 的商標，本站僅使用其免費圖庫素材，與 Pexels 無任何隸屬或背書關係。
- 本站為個人教學專案，非任何製琴工坊、樂團或音樂院校的官方教材。

維護者：[Will 保哥](https://github.com/doggy8088) · <https://github.com/doggy8088>
