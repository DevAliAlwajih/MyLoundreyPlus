$commit = '605197351a3c8bdd595af2d2a9bc3025bca48ea2'
$dir = 'd:\MyLoundreyPlus\backend\node_modules\@prisma\engines'
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

$files = @(
    @{ Url = "https://binaries.prisma.sh/all_commits/$commit/windows/schema-engine.exe.gz"; Out = "$dir\schema-engine-windows.exe" },
    @{ Url = "https://binaries.prisma.sh/all_commits/$commit/windows/query_engine.dll.node.gz"; Out = "$dir\query_engine-windows.dll.node" },
    @{ Url = "https://binaries.prisma.sh/all_commits/$commit/windows/query-engine.exe.gz"; Out = "$dir\query-engine-windows.exe" }
)

foreach ($item in $files) {
    $gzPath = "$($item.Out).gz"
    if (Test-Path $gzPath) { Remove-Item $gzPath -Force }
    Write-Host "Downloading $($item.Url)..."
    & curl.exe -L -s -o "$gzPath" "$($item.Url)"
    
    if (Test-Path $gzPath) {
        $size = (Get-Item $gzPath).Length
        Write-Host "Downloaded $size bytes. Decompressing to $($item.Out)..."
        $inFile = [System.IO.File]::OpenRead($gzPath)
        $outFile = [System.IO.File]::Create($item.Out)
        $gzStream = New-Object System.IO.Compression.GZipStream($inFile, [System.IO.Compression.CompressionMode]::Decompress)
        $gzStream.CopyTo($outFile)
        $gzStream.Close()
        $outFile.Close()
        $inFile.Close()
        Remove-Item $gzPath -Force
        Write-Host "Done: $($item.Out) ($((Get-Item $item.Out).Length) bytes)"
    } else {
        Write-Error "Failed to download $($item.Url)"
    }
}

Write-Host "ALL ENGINES DOWNLOADED SUCCESSFULLY"
