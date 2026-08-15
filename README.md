# api-balance

实时显示 DeepSeek API 账户余额的 DeepSeek Harness（dsh web）插件。
Real-time DeepSeek API account balance readout for the DeepSeek Harness web GUI.

在会话输入框下方的读数带（`conversation.composer.dock`）显示：

```
API 余额 CNY 18.22 · 可用 · 14:32:05 更新
```

![效果示意图](docs/screenshot.svg)

- 每 30 秒自动刷新（挂载时立即查询一次）
- **刷新模式可选**：手动刷新 / 每 10 秒 / 每 30 秒 / 每 1 分钟 / 每 5 分钟 / 自定义间隔；选择「自定义…」会弹出输入窗口（范围 **5–3600 秒**，含校验与错误提示），偏好保存在浏览器 localStorage，刷新页面后仍保留
- 手动模式下点击「刷新」按钮即时刷新；自定义间隔确认后即时生效
- 刷新失败时保留上次数据并显示黄色「刷新失败」，悬停可见具体原因，下一次自动轮询自动恢复
- 余额不可用时显示红色「不可用」
- API 密钥通过 dsh 的 credentials 服务按需解析（`DEEPSEEK_API_KEY`），**不出宿主进程**

## 架构

| 文件 | 平台 | 作用 |
| --- | --- | --- |
| `lib/index.js` | Host | 注册精确路由 `GET /api/abal-balance`；每次请求实时解析凭证并 curl `https://api.deepseek.com/user/balance` |
| `lib/client.js` | Client (web) | 手工编写的 `window.__ModuleLoader__.load` 格式 bundle（dsh web 的标准客户端包格式，无需构建管线）；在输入框读数带渲染余额，每 30s `fetch` 刷新 |
| `lib/client.d.ts` | — | 客户端类型占位 |

依赖的宿主服务：`webServer`、`credentials`、`shell`、`sandboxPolicy`（均为 dsh 标准服务）。
客户端侧仅依赖 `react`（种子模块）与 `slots` 服务。

> 说明：curl 调用以 `danger-full-access` 策略运行 —— 它是只读网络请求、无文件副作用，绕过平台沙箱 runner 是刻意的（在 Windows ACL 受限令牌下该请求已验证会失败）。

## 安装（在目标 dsh web 部署上）

1. 将本包放入 profile 的 node_modules：`$DSH_HOME/profiles/node_modules/api-balance/`（完整目录，含 `package.json` 与 `lib/`）。
   若已发布到 npm 或用 GitHub 依赖，也可在 profile 里执行 `dsh plugin --profile web add <specifier>` 安装。
2. 在 profile 的 `cordis.patch.yml` 追加（**必须是 `insert` 块** —— 补丁语义只允许新增行，普通条目只能覆盖已有行）：

```yaml
- insert:
    - id: api-balance
      name: 'api-balance'
```

3. 重启 dsh web 服务（组合只在启动时读取）。

## 启用 / 禁用 / 卸载

- 禁用：补丁条目加 `disabled: true`，重启
- 卸载：删除补丁条目 + 删除 `profiles/node_modules/api-balance/`，重启
- 设置 → 插件市场中的列表是只读的（对官方插件同样如此），启停均通过补丁 + 重启完成

## 自定义

- 刷新模式与间隔：读数带右侧的下拉框（手动 / 10s / 30s / 1min / 5min / 自定义…），「自定义…」弹出输入窗口，范围 5–3600 秒；偏好持久化在 `localStorage`（键 `dsh.api-balance.refresh`）
- 读取的凭证：`lib/index.js` 中 `credentials.resolve('DEEPSEEK_API_KEY')`
- 余额接口：`lib/index.js` 中 `BALANCE_URL`

## 已知限制

- 若对 profile 执行 `pnpm install`，手动放入 `node_modules` 的包可能被清理，需重新放置或改为正式依赖安装。

## 更新日志

### v0.2.1 — API 余额实时显示（手动 / 自定义刷新）

- 刷新模式可选：手动 / 每 10 秒 / 每 30 秒 / 每 1 分钟 / 每 5 分钟 / 自定义间隔（5–3600 秒）
- 「自定义…」弹出输入窗口，显示范围并校验（越界/非数字禁用确定，回车确认，Esc/遮罩取消）
- 偏好持久化在 `localStorage`；手动模式点击「刷新」即时刷新

### v0.2.0

- 首次引入刷新模式控制与 MIT 许可证、效果示意图

### v0.1.0

- 首个版本：实时显示 DeepSeek API 余额（每 30 秒固定刷新）

## 许可证

[MIT](LICENSE) © 2026 02Muller25
