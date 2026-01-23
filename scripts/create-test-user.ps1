# Create test user via Clerk API
$clerkSecretKey = $env:CLERK_SECRET_KEY
if (-not $clerkSecretKey) {
    throw "Missing env var: CLERK_SECRET_KEY"
}

$headers = @{
    "Authorization" = "Bearer $clerkSecretKey"
    "Content-Type" = "application/json"
}

$body = @{
    email_address = @("jojimoh148@noihse.com")
    password = "TestPassword123!"
    first_name = "Test"
    last_name = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.clerk.com/v1/users" -Method POST -Headers $headers -Body $body
    Write-Host "User created successfully!"
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error creating user:"
    Write-Host $_.Exception.Message
    Write-Host ($_.ErrorDetails.Message)
}
