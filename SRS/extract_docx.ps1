Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "d:\MyLoundreyPlus\SRS\MyLoundreyPlus_SRS_v4.docx"
$outPath = "d:\MyLoundreyPlus\SRS\SRS_extracted.txt"

if (Test-Path $docxPath) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    $entry = $zip.GetEntry("word/document.xml")
    if ($entry) {
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $zip.Dispose()

        # Replace paragraph tags with newlines, and strip all other tags
        $text = $xml -replace '<w:p(?: [^>]+)?>', "`r`n"
        $text = $text -replace '<[^>]+>', ''
        
        Set-Content -Path $outPath -Value $text -Encoding UTF8
        Write-Host "Extraction complete. Saved to $outPath"
    } else {
        $zip.Dispose()
        Write-Host "word/document.xml not found in the docx file."
    }
} else {
    Write-Host "File not found: $docxPath"
}
