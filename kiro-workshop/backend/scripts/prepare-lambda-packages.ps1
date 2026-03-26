# PowerShell script to prepare Lambda deployment packages with dependencies
# This script creates individual deployment packages for each Lambda function
# with the required dependencies included

$ErrorActionPreference = "Stop"

Write-Host "Preparing Lambda deployment packages..."

# Create a temporary directory for the packages
$TempDir = "./dist/lambda-packages"
if (-not (Test-Path $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
}

# Function to prepare a package for a specific Lambda function
function Prepare-Package {
    param (
        [string]$FunctionPath
    )
    
    $FunctionName = [System.IO.Path]::GetFileNameWithoutExtension($FunctionPath)
    $PackageDir = Join-Path $TempDir $FunctionName
    
    Write-Host "Preparing package for $FunctionName..."
    
    # Create package directory
    if (-not (Test-Path $PackageDir)) {
        New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null
    }
    
    # Copy the function file
    Copy-Item $FunctionPath -Destination $PackageDir -Force
    
    # Copy the middleware file if it's an authenticated function
    $FunctionContent = Get-Content $FunctionPath -Raw
    if ($FunctionContent -match "withAuth") {
        # Copy the middleware.js file directly to the package root
        Copy-Item "./src/common/middleware.js" -Destination $PackageDir -Force
        
        # Update the import path in the function file
        $TargetFile = Join-Path $PackageDir ([System.IO.Path]::GetFileName($FunctionPath))
        $Content = Get-Content $TargetFile -Raw
        $Content = $Content -replace "require\('../../common/middleware'\)", "require('./middleware')"
        Set-Content -Path $TargetFile -Value $Content -NoNewline
    }

    
    # Create a package.json file
    $PackageJson = @"
{
  "name": "$FunctionName",
  "version": "1.0.0",
  "description": "Lambda function for $FunctionName",
  "main": "$([System.IO.Path]::GetFileName($FunctionPath))",
  "dependencies": {
    "@aws-sdk/client-cognito-identity-provider": "^3.496.0",
    "@aws-sdk/client-dynamodb": "^3.496.0",
    "@aws-sdk/lib-dynamodb": "^3.496.0",
    "uuid": "^9.0.0"
  }
}
"@
    Set-Content -Path (Join-Path $PackageDir "package.json") -Value $PackageJson
    
    # Install dependencies
    Push-Location $PackageDir
    npm install --production
    Pop-Location
    
    # Create a zip file
    $ZipPath = Join-Path $TempDir "$FunctionName.zip"
    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }
    Compress-Archive -Path (Join-Path $PackageDir "*") -DestinationPath $ZipPath -Force
    
    Write-Host "Package for $FunctionName prepared successfully"
}

# Prepare packages for auth functions
Get-ChildItem -Path "./src/functions/auth/*.js" | ForEach-Object {
    Prepare-Package -FunctionPath $_.FullName
}

# Prepare packages for user functions
Get-ChildItem -Path "./src/functions/users/*.js" | ForEach-Object {
    Prepare-Package -FunctionPath $_.FullName
}

# Prepare packages for post functions
Get-ChildItem -Path "./src/functions/posts/*.js" | ForEach-Object {
    Prepare-Package -FunctionPath $_.FullName
}

Write-Host "All Lambda packages prepared successfully in $TempDir"
