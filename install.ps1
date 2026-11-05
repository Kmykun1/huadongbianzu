param(
  [Parameter(Mandatory = $true)][string]$Tarball,
  [string]$ProfileDir = (Join-Path $env:USERPROFILE '.dsh\profiles\desktop')
)

$ErrorActionPreference = 'Stop'

$node = Get-ChildItem (Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\*\dependencies\node\bin\node.exe') -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $node) {
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($command) { $node = $command.Source }
}

if (-not $node) {
  throw 'Node.js not found. Start DSH Desktop once, or install files manually.'
}

& $node (Join-Path $PSScriptRoot 'install-offline.mjs') $Tarball $ProfileDir
exit $LASTEXITCODE
