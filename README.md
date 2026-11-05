# gary：DSH 皮肤离线安装包

适用于 **DSH Desktop / Web 0.2.x**（本包在 DSH `0.2.1-rc.5` + Windows 上实测通过）。
用于完全没有外网、不能访问 GitHub / npm 的内网机器。

这是把上游皮肤「滑动变祖」（Liang Intensity）**改名牌**后的内网版：插件包名、显示名称都叫 `gary`，安装后在 DSH 里一眼就能认出来。

- 插件包名：`gary`
- 显示名称：`gary`
- 版本：`0.1.15-settings.4-gary.2`
- 底包：`@leon___/dsh-client-liang-intensity-skin@0.1.15-settings.4`
- 上游：`https://github.com/kingOfSoySauce/dsh-liang-skin`（commit `dcd348e`）

与原版的区别：

- `package.json` 的 `name` 改为 `gary`；
- 客户端模块 id、bundle patch 条目、静态资源前缀（`/plugins/gary/assets/`）同步改为 `gary`；
- 设置页标题从「滑动变祖」改为 `gary`；
- 皮肤市场目录和「检查更新」按包名 `gary` 查询，查不到属正常现象（离线环境用不到）。

为把离线包压到 10 MB 以内，**仙侠风立绘从 1536×1536 优化为 1024×1024（WebP 质量 80）**；默认黑金立绘未改动。默认档位外观与原版一致，仙侠档位只是分辨率略低。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `gary.tgz` | 皮肤离线包（约 4.0 MB），已含预构建的 `lib/client.js`、`cordis.patch.yml` 和两套立绘资源，安装时不需要联网、不需要编译 |
| `gary.zip` | 整个 `gary` 文件夹的压缩包（约 4.1 MB），用于传输/归档，解压后按本说明安装 |
| `install.ps1` | Windows 一键安装脚本 |
| `install-offline.mjs` | 安装脚本主体（由 `install.ps1` 调用，会自动读取包名） |

SHA256：

```text
54C3B7D98DADBAB82D95C65C0AAF5AF30E3A40E1BA72DB6BC6E07C83C3E9515C
```

## 安装前提

1. 目标机器已安装 DSH Desktop，并且**至少启动过一次**（这样才会生成
   `%USERPROFILE%\.dsh\profiles\desktop`）。
2. **完全退出 DSH Desktop**（托盘图标也要退出；任务管理器里确认没有
   `DeepSeek Harness.exe`）。
3. 同一个 profile 里只保留这一个皮肤。若 `dsh.profile.bundles` 里已有别的皮肤包
   （包括原来的 `@leon___/dsh-client-liang-intensity-skin`），先移除，避免两套皮肤抢同一个位置。
4. Windows 10 1803+ 自带 `tar.exe`（脚本用它解包）。没有 `tar` 的话按“手工安装”用 7-Zip 解压。

> 不需要安装 `dsh-skin-market` 皮肤市场。市场只是用来“发现和切换”皮肤，皮肤本身是独立的 DSH 插件。

## 一键安装（推荐）

把整个文件夹拷到内网机器，在文件夹里打开 PowerShell：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 `
  -Tarball .\gary.tgz
```

profile 不在默认位置时（DSH_HOME 自定义过）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 `
  -Tarball .\gary.tgz `
  -ProfileDir "D:\dsh-home\profiles\desktop"
```

脚本会做这些事（全部本地操作，不联网）：

1. 备份 `<profile>\package.json` 为 `package.json.bak-<时间戳>`；
2. 把 tgz 复制到 `<profile>\vendor\`；
3. 解包到 `<profile>\node_modules\gary`（旧版本会先备份）；
4. 在 `dependencies` 写入 `"gary": "file:vendor/gary.tgz"`；
5. 在 `dsh.profile.bundles` 追加 `gary`；
6. 自检 `package.json`、`lib/client.js`、`cordis.patch.yml`、立绘资源是否齐全。

最后重新启动 DSH Desktop。输入框上方应出现推理强度滑条，设置页里能看到 `gary`。

## 手工安装

如果不想运行脚本，等价操作如下：

```powershell
$profile = "$env:USERPROFILE\.dsh\profiles\desktop"
Copy-Item "$profile\package.json" "$profile\package.json.bak"

$tmp = Join-Path $env:TEMP "gary-skin"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $tmp | Out-Null
tar -xzf .\gary.tgz -C $tmp

New-Item -ItemType Directory -Force "$profile\node_modules" | Out-Null
Move-Item "$tmp\package" "$profile\node_modules\gary"

New-Item -ItemType Directory -Force "$profile\vendor" | Out-Null
Copy-Item .\gary.tgz "$profile\vendor\" -Force
```

然后编辑 `<profile>\package.json`，加上这两处（保留原有内容）：

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "gary"
      ]
    }
  },
  "dependencies": {
    "gary": "file:vendor/gary.tgz"
  }
}
```

保存为 **UTF-8 无 BOM**（记事本“另存为”选 UTF-8 即可；DSH 不接受带 BOM 的 JSON，会启动失败）。

## 验证

```powershell
$profile = "$env:USERPROFILE\.dsh\profiles\desktop"
Get-Content "$profile\package.json" -Raw
Test-Path "$profile\node_modules\gary\lib\client.js"
```

两项都应正常。随后启动 DSH Desktop：

- 输入框上方出现推理强度滑条；
- 拖动档位时人物立绘切换；
- 设置/插件页里显示的名称是 `gary`。

## 卸载 / 回滚

1. 完全退出 DSH Desktop；
2. 用安装时生成的 `package.json.bak-<时间戳>` 覆盖回 `package.json`；
3. 删除 `<profile>\node_modules\gary` 和 `<profile>\vendor\gary.tgz`；
4. 重启。

## 常见问题

**启动后没变化**

- 确认改的是 `profiles\desktop`，不是 `profiles\web`（Desktop 和 Web 的 profile 是独立的）；
- 确认 DSH 是“完全退出”后重启，而不是只关窗口；
- 确认 `dsh.profile.bundles` 里有 `gary`；
- 确认没有第二个皮肤同时启用（不要同时装原版「滑动变祖」）。

**启动报 JSON 解析错误**

`package.json` 被写坏了，直接用备份恢复。注意必须 UTF-8 无 BOM。

**能不能和原版「滑动变祖」共存**

文件层面两个包名不同，可以并存；但运行时是两套皮肤抢同一个界面，会冲突。
同一 profile 只保留一个，装 gary 前先把原版从 `dependencies` / `dsh.profile.bundles` 里移除。

**皮肤市场 / 检查更新**

改名牌后，市场目录和更新检查按 `gary` 去查 npm，查不到是正常的；离线环境不需要这两个功能。
如果以后要跟随上游更新，请改装原版 `@leon___/dsh-client-liang-intensity-skin`。

**能不能用 pnpm 安装**

可以，但仍建议先退出 DSH。有 `pnpm` 和 `dsh` 命令时：

```powershell
dsh plugin --profile desktop add .\gary.tgz
```

该命令会自己写 `dependencies` 和 `dsh.profile.bundles`，并且不需要联网（本地 tarball）。
如果机器上没有 `dsh`/`pnpm`，用前面的手工方式即可。

**安装后不要执行 `pnpm install --frozen-lockfile`**

手工安装没有更新 `pnpm-lock.yaml`，冻结安装会把刚放进去的包剪掉。保持现状即可；
确实要交给 pnpm 管理时，用 `pnpm add` 这个 tgz 重新装一次。

**版本兼容**

底包声明支持 DSH `^0.1.0-rc.6 || 0.2.0-rc.2`。低于这个范围的老版本可能缺少它注入的客户端服务。
