# 发展力 · 九大能力域，42 个心智模型

把《发展力》手册（58 页）整理成一个可交互的静态站点：能力自评雷达、可检索的模型库、20 多种可视化图示、收藏与掌握进度。

> 纯静态、零依赖、零构建 —— 直接丢到 GitHub Pages 就能用。

---

## 功能

| 模块 | 说明 |
| --- | --- |
| 能力雷达 | 9 个维度 0~5 分自评，雷达实时变化，自动找出「缺口最大」的维度并推荐入门模型 |
| 模型库 | 42 个模型，支持关键词搜索、按能力域筛选、只看收藏 / 只看已掌握 |
| 详情抽屉 | 每个模型包含：出处、一句话、是什么、核心要点、怎么用、何时用、一个例子、常见误区、标签 |
| 可视化 | 学习金字塔、六顶思考帽、乔哈里视窗、冰山模型、AARRR 漏斗、峰终曲线、情境领导力矩阵、POA 公式、领导力阶梯等 20+ 种图示 |
| 全局搜索 | `⌘K` / `Ctrl+K` 打开，↑↓ 选择，↵ 打开 |
| 使用路径 | 新人 / 带团队 / 推一件事，三条各三个动作的入门路径 |
| 角色地图 | 五个角色（程序员 → 项目经理 → 技术经理 → 技术总监 → CTO）各一个子页面：能力配比、关键转变、必会模型、高频场景、失败模式、90 天动作、跃迁信号；另有能力矩阵与能力轴总览 |
| 本地数据 | 自评、收藏、已掌握全部存在浏览器 localStorage，不上传任何数据 |
| 主题 | 明 / 暗主题，跟随系统并可手动切换 |

---

## 本地预览

不需要任何依赖。任选一种：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node
npx serve .
```

然后打开 <http://localhost:8080>。

直接双击 `index.html` 也能看，但用本地服务器体验更完整（剪贴板等 API 在 `file://` 下受限）。

---

## 部署到 GitHub Pages

整个流程大约 10 分钟。下面按「推送前 → 推送 → 开启 Pages → 验证 → 后续更新」的顺序写。

### 0. 推送前先确认三件事

```bash
cd fazhanli
ls .nojekyll                 # 必须存在（空文件即可），否则 Jekyll 会吞掉下划线开头的路径
grep -rn 'href="/' --include=*.html .   # 不应该有输出：所有引用都是相对路径
du -sh . --exclude=.git      # 约 330 KB，远低于 Pages 的 1 GB 限制
```

另外注意 Pages 的两个硬限制：单个文件 ≤ 100 MB，仓库 ≤ 1 GB。

### 1. 在 GitHub 上建一个空仓库

浏览器打开 <https://github.com/new>：

- **Repository name**：`fazhanli`（这个名字会出现在网址里，之后改名会导致地址变化）
- **Visibility**：Public 或 Private 都行（Pages 都支持，但站点本身对公网可见）
- **不要**勾选 *Add a README file*、*Add .gitignore*、*Choose a license* —— 空仓库才不会和本地历史冲突
- 点 **Create repository**

建完后页面上会显示仓库地址，形如 `https://github.com/<用户名>/fazhanli.git`。

### 2. 配置认证（最容易卡住的一步）

GitHub 从 2021 年起**不再接受账号密码**做 Git 推送。任选一种方式：

**方式 A：个人访问令牌（PAT，最通用）**

1. 打开 <https://github.com/settings/tokens> → **Generate new token (classic)**
2. Note 随便填（例如 `fazhanli-push`），Expiration 选 90 天
3. 勾选 **`repo`** 这一个权限即可（私有仓库必需，公开仓库也需要）
4. 生成后**立刻复制**令牌（`ghp_...`，只显示一次）
5. 推送时，用户名填 GitHub 用户名，**密码处粘贴这个令牌**

建议顺手把令牌交给凭据管理器保存，避免每次输入：

```bash
git config --global credential.helper manager   # Windows
# macOS: git config --global credential.helper osxkeychain
```

**方式 B：用 GitHub Desktop / VS Code 登录**

装上客户端并登录一次账号，命令行推送会复用它的凭据，不需要手动配置令牌。

**方式 C：SSH 密钥**

```bash
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub    # 复制输出，粘贴到 https://github.com/settings/keys
ssh -T git@github.com        # 出现 "Hi <用户名>!" 即成功
```

之后把下面的仓库地址换成 `git@github.com:<用户名>/fazhanli.git`。

### 3. 推送代码

```bash
cd fazhanli
git remote add origin https://github.com/<用户名>/fazhanli.git
git branch -M main          # 本地当前分支是 master，统一改名为 main
git push -u origin main
```

第一次推送会提示输入用户名和密码（密码处粘贴令牌）。成功的标志是输出里出现 `main -> main`，且 `git log --oneline` 的三个 commit 都在。

### 4. 开启 Pages

仓库页面 → **Settings** → 左侧 **Pages**：

- **Source**：`Deploy from a branch`
- **Branch**：`main`，目录选 `/ (root)`
- 点 **Save**

保存后页面顶部会出现一条提示，仓库的 **Actions** 标签里会出现一个叫 `pages build and deployment` 的工作流。等它变成绿色对勾（通常 30 秒到 2 分钟）。

### 5. 验证

访问：

```
https://<用户名>.github.io/fazhanli/
```

依次点开这几个地址，确认没有 404：

| 地址 | 应该看到 |
| --- | --- |
| `/fazhanli/` | 主页，首屏有九维轨道图 |
| `/fazhanli/roles/` | 角色地图总览，五级阶梯 |
| `/fazhanli/roles/cto.html` | CTO 页面 |
| `/fazhanli/index.html#m=systems-thinking` | 主页并自动打开「系统思维」详情 |

再确认三件交互：搜索框 `⌘K` 能弹出、雷达打分后刷新还在、右上角主题切换生效。

### 6. 后续更新

```bash
git add -A
git commit -m "更新内容"
git push
```

推送后 Pages 会自动重新构建，通常 1 分钟内生效。如果页面没变，先看 Actions 里最新一次运行是否成功，再强制刷新浏览器（`Ctrl/Cmd + Shift + R`）——Pages 的 CDN 有缓存。

### 7. 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 推送报 `Authentication failed` | 用了账号密码而非令牌。重新生成 PAT，或改用方式 B / C |
| 推送报 `remote origin already exists` | 已有 remote，先 `git remote set-url origin <新地址>` |
| 推送报 `failed to push some refs` | 远端非空（建仓库时勾了 README）。执行 `git pull --rebase origin main` 再推 |
| Pages 设置里选不到 main 分支 | 分支还没推上去，或仓库是空的。先完成第 3 步并刷新页面 |
| 打开是 404 | Settings → Pages 里确认分支和目录，并确认工作流已变绿；首次部署可能要等几分钟 |
| 页面能开但没样式 | 大概率是绝对路径或 `.nojekyll` 缺失。本站已全用相对路径并带 `.nojekyll`，若改过 HTML 请复查第 0 步 |
| 中文文件名 404 | Pages 对非 ASCII 路径处理不一致，本站文件名全为英文，新增页面请沿用 |
| 想换域名 | Settings → Pages → Custom domain 填域名，并在域名商处加 CNAME 解析；仓库里会自动生成 `CNAME` 文件 |

> 仓库里已包含 `.nojekyll`，避免 GitHub 的 Jekyll 处理影响静态资源。
> 所有资源都是相对路径，所以部署在 `用户名.github.io/仓库名/` 这种子路径下也能正常工作，已用本地 `/fazhanli/` 子路径验证过。

---

## 目录结构

```
.
├── index.html              # 主站：能力雷达 / 模型库 / 路径 / 路线图
├── roles/
│   ├── index.html          # 角色地图总览：五级阶梯 + 能力矩阵 + 能力轴
│   ├── programmer.html     # 程序员
│   ├── project-manager.html
│   ├── tech-manager.html
│   ├── tech-director.html
│   └── cto.html
├── assets/
│   ├── css/
│   │   ├── style.css       # 主站样式：设计令牌、布局、组件、明暗主题
│   │   └── roles.css       # 角色页样式（复用同一套令牌，独立加载）
│   └── js/
│       ├── data.js         # 全部内容：9 个能力域、42 个模型、路径、路线图
│       ├── app.js          # 主站交互：雷达、搜索、抽屉、图示、路由
│       ├── roles-data.js   # 角色地图内容：5 个角色 + 5 组能力轴
│       └── roles.js        # 角色页渲染：雷达、矩阵、展开项、主题
├── .nojekyll
└── README.md
```

---

## 怎么改内容

所有文案都在 `assets/js/data.js`，不需要动其他文件。

### 新增一个模型

```js
{
  id: 'my-model',            // 唯一 id，同时用于分享链接 #m=my-model
  dim: 'learn',              // 能力域 id：learn / think / create / design /
                             // empathy / story / lead / integrate / struct
  name: '模型名称',
  en: 'Model Name',
  origin: '提出者，年份',
  tagline: '一句话说清它解决什么问题',
  def: '这个模型是什么，2~3 句。',
  points: [
    ['要点标题', '要点解释']
  ],
  steps: ['第一步', '第二步'],   // 可留空数组
  when: '什么场景下用。',
  example: ['案例标题', '案例正文'],
  pitfalls: ['常见误区一'],
  tags: ['标签'],
  viz: { type: 'steps', data: [{ t: '标题', d: '说明' }] }  // 可省略
}
```

### 可用的图示类型（`viz.type`）

`bars` · `pareto` · `cycle` · `steps` · `chips` · `concentric` · `timeline` ·
`hats` · `funnel` · `curve` · `radial` · `johari` · `iceberg` · `abc` ·
`story5` · `ladder` · `staircase` · `acts` · `situational` · `lever` ·
`poa` · `nodes` · `merge` · `pyramid3` · `mece` · `compare`

各自的数据格式见 `app.js` 里 `vizOf()` 的对应分支。

### 改能力域

`DIMENSIONS` 数组：`id`、`no`（一/二/…）、`name`、`en`、`color`（同时决定主题色）、`claim`、`desc`、`question`。

### 改角色地图

内容在 `assets/js/roles-data.js`：

- `ROLES` —— 每个角色一个对象，字段为 `question`（核心问题）、`deliver`（被付费的三件事）、`dims`（九个维度 0~5 的配比）、`shifts`（关键转变）、`models`（模型 id + 为什么选它）、`scenes`（高频场景）、`fails`（卡点）、`plan`（90 天）、`signals`（跃迁信号）。
- `CAPS` —— 按能力轴组织的五组模型。
- `models[].id` 必须是 `data.js` 中 `MODELS` 里存在的 id，页面会自动取名称与所属能力域，并生成跳回主站的深链接。
- 新增一个角色：在 `ROLES` 里加一项，再复制任意 `roles/*.html` 改 `data-role` 即可，页面结构会自动生成。

---

## 键盘快捷键

| 键 | 作用 |
| --- | --- |
| `⌘K` / `Ctrl+K` / `/` | 打开全局搜索 |
| `↑` `↓` | 在搜索结果中移动 |
| `↵` | 打开选中的模型 |
| `←` `→` | 在详情里切换上一个 / 下一个模型 |
| `Esc` | 关闭搜索或详情 |

---

## 内容来源与说明

- 内容整理自内部《发展力》手册（58 页），保留原有九大能力域与模型清单。
- 每个模型的定义、要点、步骤、案例、误区为在原稿基础上的补充整理，用于内部学习。
- 原稿第 35 页之后的角色章节只留下骨架（五个角色、每组五个模型位），且每个模型位下的正文是其他章节的复制粘贴。本站保留骨架与顺序，按「交付物 → 能力配比 → 转变 → 模型 → 场景 → 卡点 → 90 天 → 信号」重写了正文，并拆成独立子页面；角色下挂的模型是从前 34 页的 42 个模型里按相关性重选的，不是照搬原稿的模型位。
- 原稿标注「待补充」的结构化能力域，本站补齐了金字塔原理、MECE、演绎与归纳三个工具。

如果这份内容要对外发布，请先确认原稿的授权范围。
