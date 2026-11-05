#!/usr/bin/env node
// Offline installer for a DSH skin bundle.
// Usage:
//   node install-offline.mjs <skin.tgz> [profileDir]
// Default profileDir: %USERPROFILE%\.dsh\profiles\desktop
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

const [tarballArg, profileArg] = process.argv.slice(2)
if (!tarballArg) {
  console.error('usage: node install-offline.mjs <skin.tgz> [profileDir]')
  process.exit(2)
}

const tarball = resolve(tarballArg)
const profileDir = resolve(profileArg ?? join(process.env.USERPROFILE ?? '', '.dsh', 'profiles', 'desktop'))
const profilePkg = join(profileDir, 'package.json')

if (!existsSync(tarball)) fail(`找不到安装包: ${tarball}`)
if (!existsSync(profilePkg)) fail(`找不到 profile: ${profilePkg}（请确认 DSH Desktop 已安装过，且 profile 名称正确）`)

// 解包到临时目录
const temp = mkdtempSync(join(tmpdir(), 'dsh-skin-'))
let version
let packageName
try {
  execFileSync('tar', ['-xzf', tarball, '-C', temp], { stdio: 'inherit' })
  const extracted = join(temp, 'package')
  if (!existsSync(join(extracted, 'package.json'))) fail('安装包结构异常：缺少 package/package.json')
  const skin = JSON.parse(readFileSync(join(extracted, 'package.json'), 'utf8'))
  version = skin.version
  packageName = skin.name
  if (typeof packageName !== 'string' || !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(packageName)) {
    fail(`安装包 package.json 的 name 不合法: ${packageName}`)
  }

  const manifest = JSON.parse(readFileSync(profilePkg, 'utf8').replace(/^\uFEFF/, ''))
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-')

  // 1. 备份 package.json
  const backup = `${profilePkg}.bak-${stamp}`
  cpSync(profilePkg, backup)
  console.log(`已备份 profile: ${backup}`)

  // 2. 把 tarball 放进 profile/vendor，让 file: 依赖在离线时可复现
  const vendorDir = join(profileDir, 'vendor')
  mkdirSync(vendorDir, { recursive: true })
  const vendorTarball = join(vendorDir, basename(tarball))
  cpSync(tarball, vendorTarball)
  console.log(`已复制安装包: ${vendorTarball}`)

  // 3. 安装到 node_modules/<packageName>
  const dest = join(profileDir, 'node_modules', ...packageName.split('/'))
  if (existsSync(dest)) {
    const old = `${dest}.bak-${stamp}`
    rmSync(old, { recursive: true, force: true })
    cpSync(dest, old, { recursive: true })
    rmSync(dest, { recursive: true, force: true })
    console.log(`已备份旧版本: ${old}`)
  }
  mkdirSync(join(profileDir, 'node_modules', ...packageName.split('/').slice(0, -1)), { recursive: true })
  cpSync(extracted, dest, { recursive: true })
  console.log(`已安装文件: ${dest}`)

  // 4. 写入 dependencies 与 dsh.profile.bundles
  manifest.dependencies ??= {}
  manifest.dependencies[packageName] = `file:vendor/${basename(tarball)}`
  manifest.dsh ??= {}
  manifest.dsh.profile ??= {}
  manifest.dsh.profile.bundles ??= []
  if (!manifest.dsh.profile.bundles.includes(packageName)) {
    manifest.dsh.profile.bundles.push(packageName)
  }
  writeFileSync(profilePkg, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log('已更新 profile package.json:')
  console.log(`  dependencies["${packageName}"] = "file:vendor/${basename(tarball)}"`)
  console.log(`  dsh.profile.bundles += "${packageName}"`)

  // 5. 自检
  const checks = [
    ['package 文件', existsSync(join(dest, 'package.json'))],
    ['客户端构建产物', existsSync(join(dest, 'lib', 'client.js'))],
    ['bundle patch', existsSync(join(dest, 'cordis.patch.yml'))],
    ['立绘资源', existsSync(join(dest, 'assets', 'portrait-source-v2', 'stage-00.webp'))],
  ]
  for (const [label, ok] of checks) console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`)
  if (checks.some(([, ok]) => !ok)) fail('安装自检未通过')
} finally {
  rmSync(temp, { recursive: true, force: true })
}

console.log(`\n完成（${packageName} ${version}）。请完全退出并重新启动 DSH Desktop。`)

function fail(message) {
  console.error(`错误: ${message}`)
  process.exit(1)
}
