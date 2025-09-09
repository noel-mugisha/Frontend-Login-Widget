# --- CONFIGURATION ---
# Replace these with your actual production URLs
$IdpUrl = "https://standalone-auth-system-production.up.railway.app"
$AppCallbackUrl = "https://main-app-frontend.vercel.app/auth/callback"

# --- SCRIPT LOGIC ---
Write-Host "Preparing widget files for deployment..."

# Create a clean distribution directory
if (Test-Path -Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
New-Item -ItemType Directory -Path "dist" | Out-Null

# Copy non-JS files
Copy-Item -Path "*.html" -Destination "dist"
Copy-Item -Path "*.css" -Destination "dist"

# Process JS and callback files
Write-Host "Processing JavaScript and Callback files..."
(Get-Content "auth.js") | ForEach-Object { $_ -replace "%%IDP_BASE_URL%%", $IdpUrl } | Set-Content "dist/auth.js"
(Get-Content "script.js") | ForEach-Object { $_ -replace "%%IDP_BASE_URL%%", $IdpUrl -replace "%%MAIN_APP_CALLBACK_URL%%", $AppCallbackUrl } | Set-Content "dist/script.js"
(Get-Content "callback.html") | ForEach-Object { $_ -replace "%%MAIN_APP_CALLBACK_URL%%", $AppCallbackUrl } | Set-Content "dist/callback.html"

Write-Host "Build complete! Files are ready in the 'dist' directory."