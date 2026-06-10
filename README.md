# AIXW 桌面实时看板

这是一个 Windows 桌面软件，用于登录 AIXW 后每 15 秒刷新当前账号指标。

## 开发运行

```powershell
npm install
npm run dev
```

## 使用方式

1. 启动软件。
2. 点击“登录 AIXW”。
3. 在弹出的 AIXW 登录窗口完成登录。
4. 返回看板后，软件会每 15 秒刷新一次数据。

## 显示指标

- 余额
- API 密钥数量和启用数量
- 今日请求
- 今日消费
- 今日 Token
- 累计 Token
- 缓存命中率
- 平均响应

## 打包

```powershell
npm run dist
```

打包产物会输出到 `release/` 目录。

## 说明

软件通过 Electron 的登录窗口保存 AIXW 登录态，不要求用户把密码、API Key 或 Cookie 写进代码里。

如果登录态过期，软件会提示重新登录。
