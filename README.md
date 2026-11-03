# agent-skills

SeanYeh 的 agent skills（SKILL.md 格式），同時整理成 Claude Code plugin marketplace（名稱 `seanyeh77-skills`）。每個 skill 是一個獨立 plugin，可以只裝需要的。

| Plugin | 用途 |
|---|---|
| `teaching-materials-style` | 教材風格：Notion 筆記、Slidev 投影片、各種工具畫的圖 |
| `google-calendar-schedule-entry` | 把課表、作業與考試截止日加到 Google Calendar |
| `bash-terminal-progress-ui` | bash 腳本與安裝程式的 spinner / 進度 UI |

## 安裝（Claude Code）

```bash
claude plugin marketplace add seanyeh77/agent-skills
claude plugin install teaching-materials-style@seanyeh77-skills
claude plugin install google-calendar-schedule-entry@seanyeh77-skills
claude plugin install bash-terminal-progress-ui@seanyeh77-skills
```

在 session 裡也可以用 `/plugin marketplace add` 和 `/plugin install`。

更新：

```bash
claude plugin marketplace update seanyeh77-skills
```

## 安裝（Claude Desktop / claude.ai）

- Desktop：在 plugin 設定加入 marketplace，指向 `seanyeh77/agent-skills`。
- 網頁版：把 `plugins/<name>/skills/<name>/` 這個資料夾壓成 zip 上傳。

## 其他 agent 工具

skill 本體是 `plugins/<name>/skills/<name>/` 這個資料夾，支援 SKILL.md 的工具都能直接用。clone 之後把資料夾 symlink 到該工具讀 skills 的目錄即可，例如：

```bash
git clone https://github.com/seanyeh77/agent-skills.git ~/agent-skills
ln -s ~/agent-skills/plugins/<name>/skills/<name> <工具的 skills 目錄>/<name>
```

## 結構

```
.claude-plugin/marketplace.json        marketplace 清單
plugins/<name>/.claude-plugin/plugin.json
plugins/<name>/skills/<name>/SKILL.md  skill 本體
```

新增 skill：照同樣結構新增 `plugins/<name>/`，在 `marketplace.json` 的 `plugins` 加一筆，然後跑：

```bash
claude plugin validate .
```

修改 skill 後把 `plugin.json` 的 `version` 往上加，已安裝的人執行 update 才會拿到新版。
