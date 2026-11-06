# 发展力 · 能力发展交互手册

> 把一本 58 页的能力模型手册，做成一个能自评、能检索、能按角色取用的静态站点。

![零依赖](https://img.shields.io/badge/dependencies-0-2ea44f)
![零构建](https://img.shields.io/badge/build-none-blue)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ready-2ea44f)
![License](https://img.shields.io/badge/license-MIT-black)

![首页](docs/preview.png)

---

## 这是什么

一本讲「能力发展」的手册，通常的命运是被读一遍、划几行线、然后忘掉。这个项目把它重做成一个可以反复回来的工具，而不是一次性的电子书：

- **先量一下自己** —— 9 个能力维度打 0~5 分，雷达图实时变化，系统自己算出缺口最大的那一维，并指出从哪个模型开始补。
- **再查具体怎么办** —— 42 个模型，每个都有「是什么 / 核心要点 / 怎么用 / 何时用 / 一个例子 / 常见误区」，配 26 种可视化图示，而不是纯文字段落。
- **最后按角色取用** —— 程序员、项目经理、技术经理、技术总监、CTO 各有一个独立页面，回答「我现在这个位置，最该补哪三件事」。

纯 HTML + CSS + JavaScript，没有框架、没有构建步骤、没有后端、不发任何网络请求。克隆下来双击 `index.html` 就能用。

---

## 功能一览

### 主站

| 模块 | 说明 |
| --- | --- |
| 能力自评雷达 | 9 个维度 0~5 分，点顶点或分值即可打分；实时计算平均分与缺口最大维度，并推荐该维度的入门模型 |
| 模型库 | 42 张卡片，支持关键词搜索（按名称 / 场景 / 案例 / 误区加权排序）、按能力域筛选、只看收藏、只看已掌握 |
| 详情抽屉 | 出处、一句话、图示、要点、用法、场景、案例、误区；`←` `→` 切换上一个 / 下一个模型 |
| 全局搜索 | `Ctrl/Cmd + K` 或 `/` 唤起命令面板，键盘上下选择、回车打开 |
| 可视化图示 | 26 种渲染器：条形、帕累托、循环、步骤、同心圆、时间轴、六顶帽、漏斗、曲线、雷达、乔哈里、冰山、AARRR、情境领导力、POA、阶梯等 |
| 使用路径 | 新人 / 带团队 / 推一件事，三条各含三个动作的入门路径 |
| 本地存档 | 自评、收藏、已掌握存在浏览器 `localStorage`（键名 `fzl.v1`），刷新与重开浏览器都在 |

### 角色地图（`roles/`）

| 页面 | 内容 |
| --- | --- |
| `roles/index.html` | 五级阶梯、9×5 能力矩阵热力表、五组能力轴（团队管理 / 业务理解 / 商业思维 / 个人成长 / 技术前瞻） |
| 五个角色页 | 每个角色统一八段：被付费的交付物 → 九维能力配比 → 三次转变 → 必会模型 → 高频场景 → 失败模式 → 90 天动作 → 跃迁信号 |

角色页里点模型卡会跳回主站并自动打开对应的详情抽屉，靠的是 `../index.html#m=<id>` 深链接。

---

## 界面预览

| 模型库 | 能力矩阵 |
| --- | --- |
| ![模型库](docs/library.png) | ![能力矩阵](docs/roles.png) |

| 角色页 · 能力配比 |
| --- |
| ![角色页](docs/role-page.png) |

---

## 快速开始

不需要安装任何依赖。

```bash
# 任选一种本地服务器
python -m http.server 8080
# 或
npx serve .
```

打开 <http://localhost:8080> 即可。

直接双击 `index.html` 也能浏览，但建议用本地服务器：`file://` 协议下剪贴板 API 受限，「复制为 Markdown」会退化为 `execCommand` 方案。

### 部署

仓库已按 GitHub Pages 的子路径场景做好准备：所有资源引用都是相对路径，且带 `.nojekyll`。Fork 或克隆后进入 **Settings → Pages**，Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`，保存即可。

站点地址形如 `https://<用户名>.github.io/<仓库名>/`，大约 1 分钟生效。页脚的 GitHub 链接会自动指向当前仓库，无需手工改。

任何静态托管（Netlify、Vercel、Cloudflare Pages、对象存储）同样可以直接用，不需要构建命令，发布目录就是仓库根目录。

---

## 项目结构

```
.
├── index.html                 # 主站：雷达 / 模型库 / 路径 / 路线图
├── roles/
│   ├── index.html             # 角色地图总览：阶梯 + 能力矩阵 + 能力轴
│   ├── programmer.html        # 程序员
│   ├── project-manager.html   # 项目经理
│   ├── tech-manager.html      # 技术经理
│   ├── tech-director.html     # 技术总监
│   └── cto.html               # CTO
├── assets/
│   ├── css/
│   │   ├── style.css          # 设计令牌、布局、组件、明暗主题
│   │   └── roles.css          # 角色页样式（复用同一套令牌，独立加载）
│   └── js/
│       ├── data.js            # 主站内容：9 个能力域、42 个模型、路径、路线图
│       ├── app.js             # 主站交互：雷达、搜索、抽屉、26 种图示、路由
│       ├── roles-data.js      # 角色内容：5 个角色 + 5 组能力轴
│       └── roles.js           # 角色页渲染：雷达、矩阵、折叠项、主题
├── docs/                      # README 用截图
├── .nojekyll
└── README.md
```

全部代码与样式约 330 KB、5 000 行；`docs/` 里是 README 用的截图（约 780 KB，可安全删除，不影响站点运行）。没有 `node_modules`，也不需要打包产物。

---

## 怎么改内容

所有文案集中在两个数据文件里，改内容不需要碰渲染逻辑。

### 新增一个模型（`assets/js/data.js`）

```js
{
  id: 'my-model',            // 唯一 id，同时用于深链接 #m=my-model
  dim: 'learn',              // 能力域 id：learn / think / create / design /
                             // empathy / story / lead / integrate / struct
  name: '模型名称',
  en: 'Model Name',
  origin: '提出者，年份',
  tagline: '一句话说清它解决什么问题',
  def: '这个模型是什么，2~3 句。',
  points: [['要点标题', '要点解释']],
  steps: ['第一步', '第二步'],          // 可为空数组
  when: '什么场景下用。',
  example: ['案例标题', '案例正文'],
  pitfalls: ['常见误区一'],
  tags: ['标签'],
  viz: { type: 'steps', data: [{ t: '标题', d: '说明' }] }   // 可省略
}
```

### 可用的图示类型（`viz.type`）

`bars` · `pareto` · `cycle` · `steps` · `chips` · `concentric` · `timeline` ·
`hats` · `funnel` · `curve` · `radial` · `johari` · `iceberg` · `abc` ·
`story5` · `ladder` · `staircase` · `acts` · `situational` · `lever` ·
`poa` · `nodes` · `merge` · `pyramid3` · `mece` · `compare`

各类型的数据格式见 `assets/js/app.js` 中 `vizOf()` 的对应分支；新增一种渲染器只需在那里加一个 `case`。

### 改能力域

`data.js` 的 `DIMENSIONS`：`id`、`no`（一 / 二 / …）、`name`、`en`、`color`（同时决定主题强调色）、`claim`、`desc`、`question`。

> 增删能力域会同时影响雷达轴数、矩阵行数与角色页配比，三者都从 `DIMENSIONS` 派生，改一处即可。

### 改角色地图（`assets/js/roles-data.js`）

- `ROLES` —— 每个角色一个对象：`question`（核心问题）、`deliver`（被付费的三件事）、`dims`（九维 0~5 配比）、`shifts`（关键转变）、`models`（模型 id + 选择理由）、`scenes`（高频场景）、`fails`（卡点）、`plan`（90 天）、`signals`（跃迁信号）。
- `CAPS` —— 按能力轴组织的五组模型。
- `models[].id` 必须是 `data.js` 中 `MODELS` 里存在的 id，页面会自动取名称、所属能力域，并生成跳回主站的深链接。
- 新增一个角色：在 `ROLES` 里加一项，复制任意 `roles/*.html` 改掉 `data-role` 即可，页面结构自动生成。

---

## 键盘快捷键

| 键 | 作用 |
| --- | --- |
| `Ctrl/Cmd + K`、`/` | 打开全局搜索 |
| `↑` `↓` | 在搜索结果中移动 |
| `Enter` | 打开选中的模型 |
| `←` `→` | 在详情里切换上一个 / 下一个模型 |
| `Esc` | 关闭搜索或详情 |

---

## 技术说明

- **无依赖**：不用框架、不用打包器、不引 CDN，脚本以普通 `<script>` 顺序加载。
- **样式**：CSS 自定义属性做设计令牌，明暗主题共用一套变量；`prefers-color-scheme` 决定初始主题，手动切换后写入 `localStorage` 并在所有页面间共享。
- **图示**：全部为手写内联 SVG 或 CSS 布局，随容器宽度缩放，不依赖图表库。
- **无障碍**：对话框语义（`role="dialog"`、`aria-modal`、`aria-hidden`）、焦点在抽屉打开时移入、`aria-live` 播报搜索与复制结果、`prefers-reduced-motion` 下关闭进场动画、可键盘操作全部交互。
- **隐私**：无统计、无 Cookie、无第三方请求；所有个人数据（自评、收藏、进度）只留在本机 `localStorage`，清除浏览器数据即恢复初始状态。
- **兼容性**：使用了 `color-mix()`，需要 Chrome / Edge 111+、Safari 16.2+、Firefox 113+（即 2023 年以后的浏览器版本）。低版本下颜色混合会失效但不影响内容阅读。

---

## 内容说明

- 模型体系与九大能力域整理自《发展力》能力模型手册（58 页）。原稿的模型清单与顺序被保留，模型条目下的定义、要点、步骤、案例与误区为在原稿基础上的补充整理。
- 原稿第 35 页之后的角色章节只留下骨架（五个角色、每组五个模型位），且各模型位下的正文与其他章节重复。本项目保留骨架与结构，按「交付物 → 能力配比 → 转变 → 模型 → 场景 → 卡点 → 90 天 → 信号」重写正文并拆为独立页面；角色下挂的模型是从前 42 个模型中按相关性重选的，并非照搬原稿的模型位。
- 原稿标注「待补充」的结构化能力域，补齐了金字塔原理、MECE、演绎与归纳三个工具。
- 书中模型（如六顶思考帽、乔哈里视窗、AARRR、POA 等）的知识产权归各自提出者所有。

---

## 已知限制

- 没有后端，数据不跨设备同步；换浏览器或清除缓存即丢失。
- 不支持导出为 PDF 或整册离线文档，打印样式未专门优化。
- 角色页只覆盖五个技术管理岗位，其他职能尚未展开。

## 路线图

- [ ] 自评结果导出为图片 / JSON，便于团队汇总
- [ ] 团队视图：把多人自评叠加成一张对比雷达
- [ ] 模型间的「相关模型」跳转与学习路径串联
- [ ] 打印与 PDF 输出样式
- [ ] 英文界面

## 贡献

欢迎提 Issue 与 PR。几个约定：

- 内容改动只改 `assets/js/data.js` 与 `assets/js/roles-data.js`，不要动渲染层。
- 保持零依赖、零构建；不要引入 npm 包、CDN 或构建脚本。
- 新增页面沿用英文文件名，避免非 ASCII 路径在静态托管上出问题。
- 提交前在 360 px 与 1440 px 两个宽度下各看一遍，确认没有横向溢出。

## 许可

代码以 MIT 许可证发布，见 [LICENSE](LICENSE)。

`assets/js/data.js`、`assets/js/roles-data.js` 中的文字内容属内容整理范畴，不在 MIT 授权范围内，如需转载或商用请自行确认原稿权利人的许可。
