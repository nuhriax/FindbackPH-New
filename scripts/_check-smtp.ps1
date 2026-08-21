#!/usr/bin/env pwsh
# _check-smtp.ps1
# Small helper that inspects the SMTP_PASSWORD line in .env.local and reports
# whether it is a real pasted Gmail app password (16 chars, no spaces) or still
# a placeholder with spaces (which breaks Supabase transactional email).
#
# Usage:   pwsh scripts/_check-smtp.ps1
#          powershell scripts/_check-smtp.ps1

$envLocal = Join-Path $PSScriptRoot '..\.env.local'

if (!(Test-Path -Path $envLocal -PathType Leaf)) {
    Write-Output ("No .env.local found at: " + $envLocal)
    exit 1
}

$found = $false
foreach ($line in Get-Content -Path $envLocal -Encoding UTF8) {
    if ($line.StartsWith('SMTP_PASSWORD=')) {
        $raw = $line.Substring(14)
        $t = $raw.Trim()
        Write-Output (
            "SMTP_PASSWORD present, rawLen=" + $raw.Length +
            " trimmedLen=" + $t.Length +
            " hasSpace=" + $t.Contains(' ')
        )
        $found = $true
    }
}

if (!$found) {
    Write-Output "SMTP_PASSWORD not found in .env.local"
    exit 1
}