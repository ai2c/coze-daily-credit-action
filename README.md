# Coze 每日积分自动领取

这是一个完全跑在 GitHub Actions（GitHub 自动化）里的 Coze 每日积分脚本。Fork（复刻）仓库后，只需要在 GitHub 网页里填好登录 Cookie，就可以每天自动运行；不需要把项目下载到自己的电脑。

脚本会每天打开 `https://www.coze.cn/home`，使用 Cookie 保持登录，并尝试点击页面上可能出现的“领取 / 签到 / 免费积分”等按钮。运行成功只写日志；运行失败时会保存截图，并可通过 pushplus（推送加）或 Bark（iOS 推送工具）通知你。

## 快速上手

### 第 1 步：Fork（复刻）仓库

点击右上角 `Fork`（复刻），把这个仓库复制到自己的 GitHub（代码托管平台）账号下。

### 第 2 步：添加必填 Secret（加密变量）

在自己的仓库页面，进入 `Settings`（设置）-> `Secrets and variables`（密钥和变量）-> `Actions`（自动化）-> `Repository secrets`（仓库加密密钥），添加下面这个值。GitHub 官方教程见 [Using secrets in GitHub Actions](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)（在 GitHub Actions 中使用加密变量）。

| 名称 | 必填 | 填什么 | 怎么获取 |
| --- | --- | --- | --- |
| `COZE_COOKIES_JSON` | 是 | Coze 登录 Cookie 的 JSON 数组 | 用浏览器登录 `https://www.coze.cn`，再用 Cookie 导出插件导出 `coze.cn` 相关 Cookie。把导出的 JSON 数组完整粘贴进去。 |

常用 Cookie 导出插件：

- 推荐用 [Cookie-Editor 官网](https://cookie-editor.com/) 安装 Cookie-Editor（Cookie 编辑器），也可以直接打开 [Cookie-Editor 的 Chrome Web Store 页面](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)。
- 不想装插件时，可以参考 [Chrome DevTools 官方文档](https://developer.chrome.com/docs/devtools/application/cookies) 用 Chrome DevTools（Chrome 开发者工具）查看 Cookie，但手动复制会更麻烦。
- 导出时优先只导出 `coze.cn` 相关 Cookie。`volcengine.com`、`volccloudidentity.com` 通常不需要；如果后续登录失败，再考虑一起导出。

`COZE_STORAGE_STATE_JSON`（Playwright 登录状态）也兼容，但不推荐新手使用。它通常更大，容易超过 GitHub Secret（GitHub 加密变量）的长度限制；新手直接用 `COZE_COOKIES_JSON` 更稳。

### 第 3 步：按需添加失败通知 Secret（加密变量）

这一步可选。不需要失败通知的话可以跳过；想推送到微信，推荐只填 `PUSHPLUS_TOKEN`。

| 名称 | 用途 | 填什么 | 获取方式 |
| --- | --- | --- | --- |
| `PUSHPLUS_TOKEN` | 失败时推送到微信 | pushplus（推送加）的用户 token 或消息 token | 登录 [pushplus 官网](https://www.pushplus.plus/push1.html)，在“一对一消息”页面查看 token；也可以在“pushplus 推送加”公众号回复 `token`。官方接口说明见 [pushplus 消息接口文档](https://www.pushplus.plus/doc/guide/api.html)。 |
| `PUSHPLUS_TOPIC` | pushplus 群组推送 | pushplus 群组编码 | 只给自己推送时不用填。需要一对多推送时，在 [pushplus 一对多消息](https://www.pushplus.plus/push2.html) 创建群组后复制群组编码。 |
| `BARK_PUSH_URL` | 失败时推送到 iPhone | Bark 推送地址，例如 `https://api.day.app/你的BarkKey` | iPhone 安装 Bark（Bark 推送应用）后，打开 App（应用）复制服务器地址。Bark 项目说明见 [Finb/Bark](https://github.com/Finb/Bark)。只用 pushplus 时不用填。 |

### 第 4 步：按需开启 Cookie 自动刷新

这一步可选。不填 `GH_PAT` 时，脚本仍然可以正常运行；只是 Cookie 过期后需要你手动更新 `COZE_COOKIES_JSON`。

| 名称 | 用途 | 填什么 | 获取方式 |
| --- | --- | --- | --- |
| `GH_PAT` | 自动更新 `COZE_COOKIES_JSON` | GitHub fine-grained personal access token（细粒度个人访问令牌） | 在 GitHub 个人设置里创建 fine-grained token（细粒度令牌），只授权当前仓库，并给 `Actions secrets`（Actions 密钥）读写权限。GitHub 官方说明见 [Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。 |

### 第 5 步：手动运行一次

进入自己的仓库：

1. 打开 `Actions`（自动化）。
2. 选择 `Coze daily credit`。
3. 点击 `Run workflow`（手动运行）。
4. 等待运行结束，绿色对勾表示成功。

如果失败，打开本次运行记录，查看日志和 `coze-failure` artifact（失败产物）。里面通常会有失败截图和页面 HTML，方便判断是不是 Cookie 过期或页面变化。

失败通知有两层：签到脚本能运行起来时，会发送带具体失败原因的通知；如果失败发生在依赖安装、浏览器安装、脚本启动之前，workflow（工作流）会发送一条兜底通知。脚本已经成功发过通知时，兜底通知会自动跳过，避免重复推送。

### 第 6 步：等待每天自动运行

测试成功后不用再操作。默认会在北京时间每天 05:30 左右自动运行。

## 可选高级配置

这些配置不是开箱即用必需项，不确定就不要填。

| 名称 | 用途 | 默认值 | 建议 |
| --- | --- | --- | --- |
| `UPLOAD_UPDATED_STORAGE_STATE` | 成功运行后，把更新后的 Playwright storage state（登录状态文件）上传到本次 Actions（自动化）运行的 artifact（构建产物）里 | 不上传 | 默认不填。只有你想下载完整登录状态用于排查问题时，才临时设为 `true`。这个文件包含 Cookie，用完后建议马上改回空值或删除这个变量。 |

`UPLOAD_UPDATED_STORAGE_STATE` 的作用：脚本每次成功运行后，浏览器里的 Cookie 可能会被 Coze 刷新。开启这个变量后，GitHub 会把刷新后的完整登录状态文件上传到运行记录里，方便你手动下载查看或迁移。但它包含登录 Cookie，别人拿到后可能直接登录你的 Coze，所以不适合作为默认开启配置。

添加 GitHub Variables（GitHub 普通变量）的位置同样在 `Settings`（设置）-> `Secrets and variables`（密钥和变量）-> `Actions`（自动化），切换到 `Variables`（普通变量）标签页。GitHub 官方说明见 [Store information in variables](https://docs.github.com/actions/learn-github-actions/variables)（在变量中保存信息）。

## 定时运行

默认配置在 `.github/workflows/coze-daily.yml`：

```yaml
schedule:
  - cron: "30 21 * * *"
```

GitHub Actions（GitHub 自动化）的 cron（定时表达式）使用 UTC（协调世界时）。`30 21 * * *` 对应北京时间每天 05:30 左右。GitHub 可能会有几分钟延迟，这是正常现象。

如果要改时间，直接改这行 cron（定时表达式）即可：

| 北京时间 | cron（定时表达式） |
| --- | --- |
| 每天 05:30 | `30 21 * * *` |
| 每天 08:00 | `0 0 * * *` |
| 每天 12:00 | `0 4 * * *` |
| 每天 23:00 | `0 15 * * *` |

## 本地调试

这个项目不要求本地运行。只有开发或排查问题时才需要：

```powershell
npm install
npx playwright install chromium
$env:COZE_COOKIES_JSON = Get-Content .\cookies.json -Raw
$env:PUSHPLUS_TOKEN = "你的pushplus token"
npm start
```

本地失败时会在 `artifacts/` 里留下截图和 HTML。`artifacts/` 可能包含登录页面信息，排查后请自行清理。

## 安全提醒

- 不要把 Cookie、token（令牌）、Bark 地址写进代码或提交到仓库。
- `COZE_COOKIES_JSON`、`PUSHPLUS_TOKEN`、`BARK_PUSH_URL`、`GH_PAT` 都应该放在 GitHub Secrets（GitHub 加密变量）里。
- 如果怀疑 Cookie 泄露，退出 Coze 登录并重新登录，再更新 `COZE_COOKIES_JSON`。

---

## 免责声明

本项目仅供个人学习交流，请勿将本项目用于违反平台规定或触犯法律的用途，使用本项目产生的一切后果由使用者自行承担

## 🔗 LinuxDo 社区1

<div align="center">
  <a href="https://linux.do" target="_blank">
    <img src="https://cdn3.ldstatic.com/original/4X/c/c/d/ccd8c210609d498cbeb3d5201d4c259348447562.png" alt="LinuxDo" height="60">
  </a>
  <p>
    <a href="https://linux.do" target="_blank"><strong>LinuxDo 社区</strong></a><br>
  </p>
    <p>@蕉灼の仓鼠</p>
    <p>本人长期活跃于L站;</p>
    <p>这里的人很好说话又好听;</p>
    <p>欢迎都来加入L站大家庭。 </p>

</div>
