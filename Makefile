# ===========================================================================
# 小提琴 3D 互動教學手冊 — 開發、驗證與發佈
#
# 執行 `make` 或 `make help` 會列出所有可用的目標。
# ===========================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

PORT         ?= 5173
PREVIEW_PORT ?= 4173
STATIC_PORT  ?= 8080
DIST         ?= dist
SITE_URL     ?= https://violin.gh.miniasp.com

# static-tool-website-builder 內附的站點預檢腳本（可用 CHECKER=... 覆寫）
CHECKER ?= $(HOME)/.agents/skills/static-tool-website-builder/scripts/check-static-site.sh

# 目前儲存庫；以遞迴展開語法宣告，只有 release 目標會實際執行 gh。
REPO ?= $(shell gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)

.PHONY: help install dev build preview serve typecheck check audit outdated \
        verify clean cleanall release status

help: ## 顯示這份說明
	@printf '\n\033[1m小提琴 3D 互動教學手冊\033[0m — 可用指令：\n\n'
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@printf '\n  可用變數：PORT=%s PREVIEW_PORT=%s STATIC_PORT=%s DIST=%s\n' \
		'$(PORT)' '$(PREVIEW_PORT)' '$(STATIC_PORT)' '$(DIST)'
	@printf '  站點網址：%s\n\n' '$(SITE_URL)'

install: ## 依 package-lock.json 安裝相依套件
	npm ci

dev: ## 啟動開發伺服器
	npm run dev -- --host 127.0.0.1 --port $(PORT)

build: ## 型別檢查後產生單檔靜態網站到 dist/
	npm run typecheck
	npm run build

preview: ## 以 Vite 預覽已建置的 dist/
	npm run preview -- --host 127.0.0.1 --port $(PREVIEW_PORT) --strictPort

serve: ## 用純靜態 HTTP 伺服器提供 dist/
	@test -d $(DIST) || { echo "找不到 $(DIST)/，請先執行 make build"; exit 1; }
	python3 -m http.server $(STATIC_PORT) --directory $(DIST)

typecheck: ## 執行 TypeScript 型別檢查（tsc --noEmit）
	npm run typecheck

check: ## 對建置產物執行靜態站點預檢（HTML、資源、metadata、JSON-LD）
	@test -d $(DIST) || { echo "找不到 $(DIST)/，請先執行 make build"; exit 1; }
	@if [ -x "$(CHECKER)" ]; then \
		bash "$(CHECKER)" "$(DIST)" index.html; \
	else \
		echo "跳過：找不到預檢腳本 $(CHECKER)"; \
		echo "可改用 make check CHECKER=/path/to/check-static-site.sh"; \
	fi

audit: ## 檢查相依套件的已知安全問題
	npm audit

outdated: ## 列出可更新的相依套件
	npm outdated || true

verify: build check ## 建置並執行完整預檢（發佈前必經流程）

clean: ## 移除建置產物 dist/
	rm -rf $(DIST)

cleanall: clean ## 移除建置產物與 node_modules/
	rm -rf node_modules

release: verify ## 建置、預檢，並觸發 GitHub Pages 部署工作流程
	@test -n "$(REPO)" || { echo "找不到 GitHub 儲存庫，請確認已安裝 gh 並完成登入"; exit 1; }
	gh workflow run deploy.yml --repo "$(REPO)"
	@echo "已觸發部署，可用 make status 查看進度。"

status: ## 顯示 GitHub Pages 與最近一次部署狀態
	gh api "repos/{owner}/{repo}/pages" --jq '"Pages: \(.status // "idle") · cname=\(.cname) · https_enforced=\(.https_enforced)"' 2>/dev/null || echo "尚未啟用 GitHub Pages"
	@gh run list --workflow=deploy.yml --limit 3 2>/dev/null || true
