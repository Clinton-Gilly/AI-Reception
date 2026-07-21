$envVars = @{
    "ELEVENLABS_API_KEY" = "sk_f720643d7d1f482f3404ce6b8e5031eee583a7dd6d1522ba"
    "ELEVENLABS_DEFAULT_AGENT_ID" = "zMZD1rcBDEPmW6LiA8mW"
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL" = "/sign-in"
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL" = "/sign-up"
    "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL" = "/"
    "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL" = "/"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_test_c2hpbmluZy1tYW5hdGVlLTQ0LmNsZXJrLmFjY291bnRzLmRldiQ"
    "CLERK_SECRET_KEY" = "sk_test_HqdTPYq3m5HzjToiDXxFxuB6OcABBK96B5VRBAlVuF"
    "MPESA_CONSUMER_KEY" = "IML05FHQZ3bjLeklm0YAPw0xid0v2fwjCuA888dik0GC6tIv"
    "MPESA_CONSUMER_SECRET" = "VmIlxOgxuF4EU8LTM1H09i22U4IaVAt0hbI72jjLNQX5S90MUjAezCRAwtbb0vvt"
    "MPESA_BUSINESS_SHORT_CODE" = "4186055"
    "MPESA_PASSKEY" = "d4c501e31b9493e5367605ab65221b8827d8232c191d4fbd282e67cf29240810"
    "MPESA_ENVIRONMENT" = "production"
    "NEXT_PUBLIC_CONVEX_URL" = "https://prestigious-starling-150.convex.cloud"
    "NEXT_PUBLIC_CONVEX_SITE_URL" = "https://prestigious-starling-150.convex.site"
    "MPESA_CALLBACK_URL" = "https://prestigious-starling-150.convex.site/mpesa-callback"
}

foreach ($key in $envVars.Keys) {
    $val = $envVars[$key]
    Write-Host "Adding $key to Vercel..."
    echo "$val" | npx vercel env add $key production
    Write-Host "Adding $key to Convex prod..."
    npx convex env set $key "$val" --prod
}
