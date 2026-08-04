# Nexsol Travel API — Launch Features Endpoints

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api`  
**Auth header (JWT):** `Authorization: Bearer <access_token>`

This document lists all API endpoints added for launch-critical and hotel-booking features.

---

## Feature 1: OTP Storage in PostgreSQL

OTP codes are no longer stored in server memory. They are persisted in PostgreSQL (`PendingUser` and `PasswordReset` tables). OTPs are hashed, expire after 10 minutes, and are invalidated after 5 failed verification attempts. This prevents OTP loss on Cloud Run restarts and works across multiple server instances.

### Endpoints

#### `POST /auth/register`
Register a new user and send a verification OTP to their email.

| | |
|---|---|
| **Auth** | Not required |
| **Rate limit** | 3 requests per minute |

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

---

#### `POST /auth/verify-otp`
Verify the registration OTP and create the user account. Returns a JWT access token.

| | |
|---|---|
| **Auth** | Not required |
| **Rate limit** | 5 requests per minute |

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "result": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
}
```

---

#### `POST /auth/forgot-password`
Send a password-reset OTP to a registered user's email.

| | |
|---|---|
| **Auth** | Not required |
| **Rate limit** | 3 requests per minute |

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

---

#### `POST /auth/verify-reset-otp`
Verify the password-reset OTP without changing the password yet.

| | |
|---|---|
| **Auth** | Not required |
| **Rate limit** | 5 requests per minute |

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "OTP verified"
}
```

---

#### `POST /auth/reset-password`
Verify the reset OTP and set a new password.

| | |
|---|---|
| **Auth** | Not required |
| **Rate limit** | 5 requests per minute |

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass456"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

## Feature 2: Secrets Moved to Environment Variables

Database credentials, GCP project IDs, bucket names, JWT secrets, and payment keys are no longer hardcoded. They must be set in the `.env` file (see `.env.example`).

### Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket name |
| `GCP_KEY_FILE` | Local service account JSON filename (optional on Cloud Run) |
| `TWOCHECKOUT_MERCHANT_CODE` | 2Checkout merchant code |
| `TWOCHECKOUT_SECRET_KEY` | 2Checkout API secret key |
| `TWOCHECKOUT_ENV` | `sandbox` or `live` |
| `TWOCHECKOUT_RETURN_URL` | Redirect URL after successful 2Checkout payment |
| `TWOCHECKOUT_CANCEL_URL` | Redirect URL after cancelled 2Checkout payment |
| `PAYPAL_CLIENT_ID` | PayPal client ID (fallback provider) |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `PAYPAL_RETURN_URL` | Redirect URL after successful PayPal payment |
| `PAYPAL_CANCEL_URL` | Redirect URL after cancelled PayPal payment |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin credentials (optional) |

> This feature is configuration-only. No API endpoints are associated with it.

---

## Feature 3: API Rate Limiting

Rate limiting is applied globally and on sensitive auth routes to prevent OTP abuse and API spam.

### Limits

| Scope | Limit |
|-------|-------|
| All API routes (global) | 100 requests per minute |
| `POST /auth/register` | 3 requests per minute |
| `POST /auth/forgot-password` | 3 requests per minute |
| `POST /auth/verify-otp` | 5 requests per minute |
| `POST /auth/verify-reset-otp` | 5 requests per minute |
| `POST /auth/reset-password` | 5 requests per minute |
| `POST /auth/login` | 10 requests per minute |

When the limit is exceeded, the API returns **HTTP 429 Too Many Requests**.

> Rate limiting is enforced automatically via middleware. No separate endpoint is needed.

---

## Feature 4: Payment Architecture — 2Checkout Primary, PayPal Secondary

Online payments default to **2Checkout**. If 2Checkout credentials are not configured, the system automatically falls back to **PayPal**. Cash payments remain available as an offline option.

### Endpoints

#### `POST /payments/create-order` *(Primary)*
Create a payment order. Defaults to 2Checkout; falls back to PayPal if 2Checkout is not configured.

| | |
|---|---|
| **Auth** | JWT required |

**Request body (hotel booking):**
```json
{
  "bookingType": "hotel",
  "amount": 250.00,
  "currency": "USD",
  "bookingIds": [1, 2],
  "adults": 2,
  "children": 0,
  "promoCode": "SAVE10",
  "provider": "2checkout"
}
```

**Request body (property booking):**
```json
{
  "bookingType": "property",
  "amount": 50000.00,
  "currency": "USD",
  "propertyId": 5,
  "promoCode": "SAVE10",
  "provider": "2checkout"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bookingType` | `"hotel"` \| `"property"` | Yes | Type of booking |
| `amount` | number | Yes | Payment amount |
| `provider` | `"2checkout"` \| `"paypal"` | No | Defaults to `2checkout` |
| `currency` | string | No | Defaults to `USD` (also supports `EUR`) |
| `bookingIds` | number[] | For hotel | Pending hotel booking IDs |
| `propertyId` | number | For property | Property ID to purchase |
| `adults` | number | No | Guest count (hotel) |
| `children` | number | No | Child count (hotel) |
| `promoCode` | string | No | Promo code to apply |

**Response:**
```json
{
  "success": true,
  "provider": "2checkout",
  "orderId": "12345678",
  "approvalUrl": "https://secure.2checkout.com/order/checkout.php?REFNO=12345678",
  "status": "CREATED",
  "currency": "USD",
  "amount": 250.00,
  "discountAmount": 25.00,
  "promoCode": "SAVE10",
  "returnUrl": "superapp://2checkout/success",
  "cancelUrl": "superapp://2checkout/cancel"
}
```

---

#### `POST /payments/2checkout/confirm`
Confirm a completed 2Checkout payment and activate the booking.

| | |
|---|---|
| **Auth** | JWT required |

**Request body:**
```json
{
  "refNo": "12345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "payment": {
    "provider": "2checkout",
    "orderId": "12345678",
    "status": "COMPLETED"
  },
  "booking": {
    "bookingType": "hotel",
    "hotelId": 3,
    "bookingIds": [1, 2]
  }
}
```

---

#### `GET /payments/2checkout/return`
Redirect endpoint called by 2Checkout after a successful payment. Redirects the user to the mobile app deep link.

| | |
|---|---|
| **Auth** | Not required |
| **Redirects to** | `superapp://2checkout/success` |

---

#### `GET /payments/2checkout/cancel`
Redirect endpoint called by 2Checkout when the user cancels payment.

| | |
|---|---|
| **Auth** | Not required |
| **Redirects to** | `superapp://2checkout/cancel` |

---

#### `POST /payments/paypal/create-order` *(Secondary)*
Explicitly create a PayPal order (secondary payment provider).

| | |
|---|---|
| **Auth** | JWT required |

**Request body:** Same as `POST /payments/create-order` (provider is forced to PayPal).

**Response:** Same structure as create-order, with `"provider": "paypal"` and PayPal `approvalUrl`.

---

#### `POST /payments/paypal/capture-order`
Capture an approved PayPal payment and activate the booking.

| | |
|---|---|
| **Auth** | JWT required |

**Request body:**
```json
{
  "orderId": "PAYPAL_ORDER_ID"
}
```

---

#### `GET /payments/paypal/return`
Redirect after successful PayPal payment.

| | |
|---|---|
| **Auth** | Not required |
| **Redirects to** | `superapp://paypal/success` |

---

#### `GET /payments/paypal/cancel`
Redirect after cancelled PayPal payment.

| | |
|---|---|
| **Auth** | Not required |
| **Redirects to** | `superapp://paypal/cancel` |

---

#### `POST /payments/cash/confirm`
Confirm a cash payment without an online gateway.

| | |
|---|---|
| **Auth** | JWT required |

**Request body:**
```json
{
  "bookingType": "hotel",
  "bookingIds": [1, 2],
  "adults": 2,
  "children": 0,
  "promoCode": "SAVE10"
}
```

---

#### `GET /payments/transactions`
Get the authenticated user's payment transaction history.

| | |
|---|---|
| **Auth** | JWT required |

**Response:** Array of transaction records with linked booking, hotel, and property details.

---

## Feature 5: AR Room Tour (SceneView / ARCore)

Backend API for augmented reality room tours. The mobile app fetches 3D model URLs and placement config from these endpoints, then renders them using **ARCore** (Android, `.glb`) or **SceneView** (iOS, `.usdz`).

### Database fields added to `Room` model

| Field | Type | Description |
|-------|------|-------------|
| `arEnabled` | boolean | Whether AR tour is active for this room |
| `arModelUrlAndroid` | string | GLB model URL for Android ARCore |
| `arModelUrlIos` | string | USDZ model URL for iOS SceneView |
| `arThumbnailUrl` | string | Preview thumbnail for the AR tour |
| `arScale` | float | Model scale multiplier (default: 1.0) |
| `arPlacementHeight` | float | Vertical placement offset (default: 0.0) |

### Endpoints

#### `GET /ar/rooms/:roomId/tour`
Get the full AR tour configuration for a specific room. Used by the mobile app to launch SceneView/ARCore.

| | |
|---|---|
| **Auth** | Not required |

**Example:** `GET /ar/rooms/5/tour`

**Response:**
```json
{
  "roomId": 5,
  "roomTitle": "Deluxe Suite",
  "hotelId": 2,
  "hotelTitle": "Grand Hotel",
  "hotelAddress": "123 Main St",
  "arEnabled": true,
  "sceneView": {
    "ios": {
      "modelUrl": "https://storage.googleapis.com/bucket/ar-models/room-5/ios/model.usdz",
      "format": "usdz",
      "platform": "SceneView"
    },
    "android": {
      "modelUrl": "https://storage.googleapis.com/bucket/ar-models/room-5/android/model.glb",
      "format": "glb",
      "platform": "ARCore"
    }
  },
  "arScale": 1.0,
  "arPlacementHeight": 0.0,
  "thumbnailUrl": "https://storage.googleapis.com/bucket/room-image.jpg",
  "instructions": {
    "ios": "Open in SceneView / AR Quick Look. Place model on a flat surface.",
    "android": "Open in SceneView with ARCore. Scan floor and tap to place model."
  }
}
```

---

#### `GET /ar/hotels/:hotelId/tours`
List all AR-enabled rooms for a hotel.

| | |
|---|---|
| **Auth** | Not required |

**Example:** `GET /ar/hotels/2/tours`

**Response:**
```json
{
  "hotelId": 2,
  "hotelTitle": "Grand Hotel",
  "tours": [
    {
      "roomId": 5,
      "roomTitle": "Deluxe Suite",
      "thumbnailUrl": "https://...",
      "hasAndroidModel": true,
      "hasIosModel": true,
      "arScale": 1.0,
      "arPlacementHeight": 0.0
    }
  ]
}
```

---

#### `PATCH /ar/rooms/:roomId`
Update AR settings for a room. Only the hotel owner or an admin can call this.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |

**Request body (all fields optional):**
```json
{
  "arEnabled": true,
  "arModelUrlAndroid": "https://storage.googleapis.com/bucket/model.glb",
  "arModelUrlIos": "https://storage.googleapis.com/bucket/model.usdz",
  "arThumbnailUrl": "https://storage.googleapis.com/bucket/thumb.jpg",
  "arScale": 1.2,
  "arPlacementHeight": 0.5
}
```

---

#### `POST /ar/rooms/:roomId/upload-model/android`
Upload a `.glb` 3D model file for Android ARCore. Automatically enables AR for the room.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |
| **Content-Type** | `multipart/form-data` |
| **Form field** | `model` (file, must be `.glb`) |

**Example:** `POST /ar/rooms/5/upload-model/android`

---

#### `POST /ar/rooms/:roomId/upload-model/ios`
Upload a `.usdz` 3D model file for iOS SceneView. Automatically enables AR for the room.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |
| **Content-Type** | `multipart/form-data` |
| **Form field** | `model` (file, must be `.usdz`) |

**Example:** `POST /ar/rooms/5/upload-model/ios`

---

## Feature 6: Host Subscription Plans (Free / Standard / Premium)

Hosts can subscribe to tiered plans that control listing limits, platform commission, AR access, and payout scheduling.

### Plan tiers

| Plan | Price | Max listings | Commission | Payout schedule | AR tours |
|------|-------|--------------|------------|-----------------|----------|
| **Free** | €0/mo | 1 | 15% | Manual | No |
| **Standard** | €29/mo | 5 | 10% | Weekly SEPA | Yes |
| **Premium** | €79/mo | Unlimited | 5% | Daily SEPA | Yes |

### Endpoints

#### `GET /subscriptions/plans`
List all available host subscription plans with features and pricing.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
[
  {
    "tier": "FREE",
    "name": "Free",
    "priceMonthly": 0,
    "currency": "EUR",
    "maxListings": 1,
    "commissionPercent": 15,
    "features": [
      "1 hotel or property listing",
      "Basic booking management",
      "Manual payout requests",
      "15% platform commission"
    ],
    "payoutSchedule": "manual",
    "arToursEnabled": false,
    "panoramaEnabled": false,
    "prioritySupport": false
  },
  {
    "tier": "STANDARD",
    "name": "Standard",
    "priceMonthly": 29,
    "currency": "EUR",
    "maxListings": 5,
    "commissionPercent": 10,
    "payoutSchedule": "weekly",
    "arToursEnabled": true,
    "panoramaEnabled": true,
    "prioritySupport": false
  },
  {
    "tier": "PREMIUM",
    "name": "Premium",
    "priceMonthly": 79,
    "currency": "EUR",
    "maxListings": null,
    "commissionPercent": 5,
    "payoutSchedule": "daily",
    "arToursEnabled": true,
    "panoramaEnabled": true,
    "prioritySupport": true
  }
]
```

---

#### `GET /subscriptions/me`
Get the authenticated host's current subscription, plan details, and listing usage.

| | |
|---|---|
| **Auth** | JWT required |

**Response:**
```json
{
  "id": 1,
  "userId": 12,
  "plan": "STANDARD",
  "startedAt": "2026-06-09T10:00:00.000Z",
  "expiresAt": "2026-07-09T10:00:00.000Z",
  "isActive": true,
  "planDetails": {
    "tier": "STANDARD",
    "name": "Standard",
    "priceMonthly": 29,
    "maxListings": 5,
    "commissionPercent": 10,
    "payoutSchedule": "weekly",
    "arToursEnabled": true
  },
  "listingCount": 3,
  "listingsRemaining": 2
}
```

---

#### `POST /subscriptions/subscribe`
Subscribe or upgrade/downgrade to a host plan. Only `HOTEL_OWNER`, `LAND_OWNER`, or `ADMIN` roles.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Request body:**
```json
{
  "plan": "STANDARD"
}
```

| Field | Type | Values |
|-------|------|--------|
| `plan` | string | `FREE`, `STANDARD`, `PREMIUM` |

**Response:**
```json
{
  "id": 1,
  "userId": 12,
  "plan": "STANDARD",
  "startedAt": "2026-06-09T10:00:00.000Z",
  "expiresAt": "2026-07-09T10:00:00.000Z",
  "isActive": true
}
```

**Errors:**
- `403` — User is not a host
- `400` — Current listing count exceeds the target plan limit

---

## Feature 7: Host Payout Automation (SEPA Transfers)

Hosts earn net revenue (after plan commission) when bookings are paid. Payouts are sent via SEPA bank transfer on a schedule based on the host's subscription plan.

### How it works

1. Guest pays → host balance is credited (gross amount minus commission)
2. Host adds a SEPA bank account (IBAN)
3. Host requests payout manually (Free plan) or payouts are auto-scheduled (Standard: weekly, Premium: daily)
4. Cron jobs process due payouts daily at 2:00 AM and auto-schedule at 3:00 AM

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYOUT_MIN_AMOUNT` | `50` | Minimum payout amount in EUR |
| `SEPA_PAYOUT_ENABLED` | `true` | Enable automatic SEPA processing |

### Endpoints

#### `GET /payouts/summary`
Get the host's available balance, pending payout amount, and payout schedule.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Response:**
```json
{
  "availableBalance": 1250.50,
  "pendingPayoutAmount": 200.00,
  "payoutSchedule": "weekly",
  "currency": "EUR"
}
```

---

#### `POST /payouts/bank-accounts`
Add a SEPA bank account for receiving payouts.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Request body:**
```json
{
  "accountHolderName": "John Hotel Owner",
  "iban": "DE89370400440532013000",
  "bic": "COBADEFFXXX",
  "bankName": "Commerzbank",
  "countryCode": "DE",
  "isDefault": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountHolderName` | string | Yes | Account holder full name |
| `iban` | string | Yes | Valid IBAN (spaces allowed) |
| `bic` | string | No | Bank BIC/SWIFT code |
| `bankName` | string | No | Bank name |
| `countryCode` | string | No | ISO country code (default: `DE`) |
| `isDefault` | boolean | No | Set as default payout account |

**Response:**
```json
{
  "id": 1,
  "userId": 12,
  "accountHolderName": "John Hotel Owner",
  "iban": "DE89370400440532013000",
  "bic": "COBADEFFXXX",
  "bankName": "Commerzbank",
  "countryCode": "DE",
  "isDefault": true,
  "createdAt": "2026-06-09T10:00:00.000Z"
}
```

---

#### `GET /payouts/bank-accounts`
List all saved bank accounts for the authenticated host.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Response:** Array of bank account objects (same structure as create response).

---

#### `POST /payouts/request`
Request a SEPA payout to a saved bank account. Deducts from host balance immediately.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Request body:**
```json
{
  "amount": 500.00,
  "bankAccountId": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Payout amount in EUR (min: `PAYOUT_MIN_AMOUNT`) |
| `bankAccountId` | number | Yes | ID of a saved bank account |

**Response:**
```json
{
  "id": 5,
  "userId": 12,
  "bankAccountId": 1,
  "amount": 500.00,
  "currency": "EUR",
  "status": "SCHEDULED",
  "reference": "SEPA-1717929600000-12",
  "scheduledAt": "2026-06-16T02:00:00.000Z",
  "bankAccount": {
    "iban": "DE89370400440532013000",
    "accountHolderName": "John Hotel Owner"
  }
}
```

**Payout statuses:** `PENDING` → `SCHEDULED` → `PROCESSING` → `COMPLETED` (or `FAILED`)

---

#### `GET /payouts/history`
Get the host's payout history with linked bank account details.

| | |
|---|---|
| **Auth** | JWT required (host role) |

**Response:**
```json
[
  {
    "id": 5,
    "amount": 500.00,
    "currency": "EUR",
    "status": "COMPLETED",
    "reference": "SEPA-1717929600000-12",
    "scheduledAt": "2026-06-16T02:00:00.000Z",
    "processedAt": "2026-06-16T02:05:00.000Z",
    "bankAccount": {
      "iban": "DE89370400440532013000",
      "accountHolderName": "John Hotel Owner"
    }
  }
]
```

---

## Feature 8: App Branding

Replaces hardcoded "Super App" placeholders with configurable branding. Used by emails, PayPal checkout, Swagger, and the mobile app.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `Nexsol Travel` | Application display name |
| `APP_TAGLINE` | `Book smarter with AR tours & AI` | Short tagline |
| `APP_DESCRIPTION` | (see `.env.example`) | Full app description |
| `COMPANY_NAME` | `Nexsol` | Legal company name |
| `SUPPORT_EMAIL` | `support@nexsol.com` | Support contact email |
| `APP_LOGO_URL` | — | Logo image URL |
| `BRAND_PRIMARY_COLOR` | `#2FC1BE` | Primary brand color (hex) |
| `BRAND_SECONDARY_COLOR` | `#1A1A2E` | Secondary brand color (hex) |

### Endpoints

#### `GET /branding`
Get current app branding configuration. Public — no auth required.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "appName": "Nexsol Travel",
  "tagline": "Book smarter with AR tours & AI",
  "companyName": "Nexsol",
  "supportEmail": "support@nexsol.com",
  "logoUrl": "https://storage.googleapis.com/bucket/logo.png",
  "faviconUrl": null,
  "primaryColor": "#2FC1BE",
  "secondaryColor": "#1A1A2E",
  "websiteUrl": "https://nexsol.com",
  "privacyPolicyUrl": null,
  "termsUrl": null,
  "description": "Your all-in-one hotel booking platform with AR room tours, AI assistant, and seamless payments."
}
```

---

#### `PATCH /branding`
Update app branding. Admin only.

| | |
|---|---|
| **Auth** | JWT required (admin role) |

**Request body (all fields optional):**
```json
{
  "appName": "Nexsol Travel",
  "tagline": "Book smarter with AR tours & AI",
  "companyName": "Nexsol",
  "supportEmail": "support@nexsol.com",
  "logoUrl": "https://storage.googleapis.com/bucket/logo.png",
  "faviconUrl": "https://storage.googleapis.com/bucket/favicon.ico",
  "primaryColor": "#2FC1BE",
  "secondaryColor": "#1A1A2E",
  "websiteUrl": "https://nexsol.com",
  "privacyPolicyUrl": "https://nexsol.com/privacy",
  "termsUrl": "https://nexsol.com/terms",
  "description": "Your all-in-one hotel booking platform."
}
```

**Response:** Updated branding object (same structure as `GET /branding`).

---

## Feature 9: Landing Page API

Provides structured landing page content for the mobile app or web frontend — hero section, stats, onboarding steps, features, and testimonials.

### Endpoints

#### `GET /`
Root endpoint — welcome message with links to key content APIs.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "message": "Welcome to Nexsol Travel",
  "tagline": "Book smarter with AR tours & AI",
  "apiDocs": "/api",
  "landing": "/landing",
  "valueProposition": "/marketing/value-proposition",
  "branding": "/branding",
  "hero": {
    "title": "Nexsol Travel",
    "subtitle": "Book smarter with AR tours & AI",
    "description": "Your all-in-one hotel booking platform...",
    "logoUrl": null,
    "primaryColor": "#2FC1BE",
    "cta": {
      "guest": { "label": "Explore Hotels", "action": "/listing/get-all-hotels" },
      "host": { "label": "List Your Property", "action": "/subscriptions/plans" }
    }
  }
}
```

---

#### `GET /landing`
Full landing page content for product presentation and onboarding.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "hero": {
    "title": "Nexsol Travel",
    "subtitle": "Book smarter with AR tours & AI",
    "description": "Your all-in-one hotel booking platform...",
    "logoUrl": null,
    "primaryColor": "#2FC1BE",
    "cta": {
      "guest": { "label": "Explore Hotels", "action": "/listing/get-all-hotels" },
      "host": { "label": "List Your Property", "action": "/subscriptions/plans" }
    }
  },
  "stats": [
    { "label": "Hotels & Properties", "value": "500+", "icon": "building" },
    { "label": "AR Room Tours", "value": "Live", "icon": "ar" },
    { "label": "Currencies Supported", "value": "17+", "icon": "currency" },
    { "label": "AI Assistant", "value": "24/7", "icon": "ai" }
  ],
  "onboarding": {
    "title": "Get started in 3 steps",
    "steps": [
      {
        "step": 1,
        "title": "Create your account",
        "description": "Sign up as a guest or host in under a minute.",
        "endpoint": "POST /auth/signup"
      },
      {
        "step": 2,
        "title": "Browse or list",
        "description": "Guests explore hotels with AR tours. Hosts pick a plan.",
        "endpoint": "GET /subscriptions/plans"
      },
      {
        "step": 3,
        "title": "Book & get paid",
        "description": "Secure payments. Hosts receive automated SEPA payouts.",
        "endpoint": "POST /payments/create-order"
      }
    ]
  },
  "features": [
    {
      "title": "AR Room Tours",
      "description": "Walk through hotel rooms in augmented reality before you book.",
      "icon": "ar",
      "endpoint": "GET /ar/rooms/:roomId/tour"
    },
    {
      "title": "360° Panorama",
      "description": "Explore rooms in full panoramic view on any device.",
      "icon": "panorama",
      "endpoint": "GET /panorama/rooms/:roomId"
    },
    {
      "title": "AI Travel Assistant",
      "description": "Personalized recommendations powered by Gemini.",
      "icon": "ai",
      "endpoint": "POST /ai-assistant/chat"
    },
    {
      "title": "QR Check-in",
      "description": "Contactless hotel check-in and check-out with QR codes.",
      "icon": "qr",
      "endpoint": "POST /check-in/scan"
    },
    {
      "title": "Multi-Currency",
      "description": "Book in EUR, USD, and 15+ Balkan/EU currencies.",
      "icon": "currency",
      "endpoint": "GET /currency/supported"
    },
    {
      "title": "Host Payouts",
      "description": "Automated SEPA transfers on weekly or daily schedules.",
      "icon": "payout",
      "endpoint": "GET /payouts/summary"
    }
  ],
  "testimonials": [
    {
      "quote": "The AR tour helped me choose the perfect room without visiting the hotel.",
      "author": "Guest User",
      "role": "Frequent Traveler"
    }
  ],
  "footer": {
    "companyName": "Nexsol",
    "supportEmail": "support@nexsol.com",
    "websiteUrl": null,
    "privacyPolicyUrl": null,
    "termsUrl": null
  }
}
```

---

## Feature 10: Value Proposition (Marketing)

Highlights the platform's key differentiators — AR tours, AI assistant, booking benefits, and host plan comparison. Used by marketing screens in the mobile app or website.

### Endpoints

#### `GET /marketing/value-proposition`
Get structured value proposition content with benefit cards and feature comparison.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "headline": "Why book with us?",
  "subheadline": "The only platform combining AR tours, AI assistance, and seamless Balkan/EU payments.",
  "benefits": [
    {
      "id": "ar-tours",
      "title": "See before you stay",
      "description": "AR room tours powered by SceneView/ARCore let guests preview exact room layouts...",
      "highlights": [
        "Android & iOS 3D models",
        "In-room scale preview",
        "Hotel-wide tour gallery"
      ],
      "api": "GET /ar/hotels/:hotelId/tours"
    },
    {
      "id": "ai-assistant",
      "title": "Your personal travel advisor",
      "description": "Gemini-powered AI recommends hotels, answers questions, scores investment properties...",
      "highlights": [
        "Smart hotel recommendations",
        "Investment property analysis",
        "Voice transcription support"
      ],
      "api": "POST /ai-assistant/chat-guest"
    },
    {
      "id": "booking",
      "title": "Book with confidence",
      "description": "Secure payments via 2Checkout and PayPal, promo codes, multi-currency pricing...",
      "highlights": [
        "2Checkout + PayPal payments",
        "17+ currencies",
        "PDF booking receipts",
        "Real-time host messaging"
      ],
      "api": "POST /payments/create-order"
    },
    {
      "id": "host-plans",
      "title": "Grow as a host",
      "description": "Choose Free, Standard, or Premium plans with flexible listing limits...",
      "highlights": [
        "Free: 1 listing, manual payouts",
        "Standard: 5 listings, weekly SEPA",
        "Premium: unlimited, daily SEPA"
      ],
      "api": "GET /subscriptions/plans"
    }
  ],
  "comparison": {
    "title": "How we compare",
    "rows": [
      { "feature": "AR Room Tours", "us": true, "traditional": false },
      { "feature": "AI Travel Assistant", "us": true, "traditional": false },
      { "feature": "360° Panorama", "us": true, "traditional": "Limited" },
      { "feature": "QR Check-in", "us": true, "traditional": false },
      { "feature": "Multi-Currency (Balkan/EU)", "us": true, "traditional": "Partial" },
      { "feature": "Automated Host Payouts", "us": true, "traditional": "Manual" }
    ]
  }
}
```

---

## Feature 11: Property Analytics Dashboard

Real occupancy, revenue, reviews, and insights from database — replaces mock `property-analysis` data.

### Endpoints

#### `GET /real-estate/analytics/dashboard`
Owner dashboard across all properties and hotels.

| | |
|---|---|
| **Auth** | JWT required |

**Response includes:** `summary` (totals), `properties[]`, `hotels[]`, `insights[]`

---

#### `GET /real-estate/analytics/property/:id`
Per-property analytics: revenue, occupancy (30d), reviews, expenses, net income.

| | |
|---|---|
| **Auth** | JWT required (owner only) |

---

#### `GET /real-estate/analytics/hotel/:id`
Per-hotel analytics with room-based occupancy.

| | |
|---|---|
| **Auth** | JWT required (owner only) |

---

#### `GET /listing/property-analysis/:id` *(legacy — fixed)*
Now returns real analytics + AI price estimate combined (backward compatible).

| | |
|---|---|
| **Auth** | Not required |

---

## Feature 12: AI Price Estimator

Property valuation using Gemini AI with comparable listings fallback.

### Endpoints

#### `GET /real-estate/price-estimate/:propertyId`
Estimate price for an existing property.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "source": "gemini-ai",
  "estimatedPrice": 285000,
  "priceRangeMin": 260000,
  "priceRangeMax": 310000,
  "pricePerSqFt": 142.5,
  "confidencePercent": 78,
  "suggestions": ["Consider seasonal pricing adjustments"],
  "marketTrend": "stable",
  "comparablesUsed": 6
}
```

---

#### `POST /real-estate/price-estimate`
Estimate price from custom property input (no saved listing required).

| | |
|---|---|
| **Auth** | Not required |

**Request body:**
```json
{
  "title": "Luxury Villa",
  "address": "Dubai Marina",
  "price": 500000,
  "area": 2500,
  "rooms": 4,
  "bathrooms": 3,
  "type": "VILLA",
  "listingType": "FOR_SALE"
}
```

---

## Feature 13: Cleaning & Maintenance Marketplace

Job posting and assignment workflow for property/hotel owners and staff. Reuses existing `Job` model with dedicated owner-friendly routes.

### Endpoints

#### `POST /real-estate/marketplace/jobs`
Post a cleaning or maintenance job.

| | |
|---|---|
| **Auth** | JWT required (hotel/property owner) |

**Request body:**
```json
{
  "title": "Deep cleaning — Suite 204",
  "description": "Post-checkout deep clean required",
  "urgency": "URGENT",
  "budget": 150,
  "hotelId": 2
}
```

---

#### `GET /real-estate/marketplace/jobs`
List jobs created by the authenticated owner.

| | |
|---|---|
| **Auth** | JWT required (owner) |

---

#### `GET /real-estate/marketplace/jobs/open`
Browse open jobs available for staff to apply.

| | |
|---|---|
| **Auth** | JWT required (staff) |

---

#### `POST /real-estate/marketplace/jobs/:id/apply`
Staff applies to a job.

| | |
|---|---|
| **Auth** | JWT required (staff) |

---

#### `POST /real-estate/marketplace/jobs/:id/assign`
Owner manually assigns staff (`applierId` in body).

| | |
|---|---|
| **Auth** | JWT required (owner) |

---

#### `POST /real-estate/marketplace/jobs/:id/auto-assign`
Owner auto-assigns best available staff.

| | |
|---|---|
| **Auth** | JWT required (owner) |

---

#### `POST /real-estate/marketplace/jobs/:id/approve`
Owner approves completed job work.

| | |
|---|---|
| **Auth** | JWT required (owner) |

---

## Feature 14: Neighborhood Intelligence

AI-generated local insights for properties. Results can be saved to `Property.neighborhoodInsights`.

### Endpoints

#### `GET /real-estate/neighborhood/:propertyId`
Get neighborhood insights (stored or AI-generated).

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "propertyId": 5,
  "propertyTitle": "Marina Villa",
  "address": "Dubai Marina",
  "insights": ["Steady rental demand in this area"],
  "categories": [
    {
      "name": "Transport",
      "score": 8,
      "highlights": ["Metro access within 10 minutes"]
    }
  ],
  "source": "gemini-ai",
  "lastUpdated": "2026-06-09T10:00:00.000Z"
}
```

---

#### `POST /real-estate/neighborhood/:propertyId/refresh`
Regenerate and persist AI neighborhood insights.

| | |
|---|---|
| **Auth** | JWT required (property owner) |

---

## Feature 15: Loyalty Points System (Rewards, Referrals & Discounts)

Guests earn points on bookings, share referral codes, and redeem points for booking discounts.

### Database tables

| Table | Description |
|-------|-------------|
| `User.loyaltyPoints` | Current points balance |
| `User.referralCode` | Unique referral code per user |
| `User.referredById` | Who referred this user |
| `LoyaltyTransaction` | Earn/redeem history |
| `LoyaltyRedemption` | One-time discount codes from redeemed points |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOYALTY_POINTS_PER_DOLLAR` | `10` | Points earned per $1 spent |
| `LOYALTY_REFERRAL_BONUS_REFERRED` | `200` | Points for new user who signs up with a referral code |
| `LOYALTY_REFERRAL_BONUS_REFERRER` | `500` | Points for referrer when referred user completes first booking |

### How points work

| Action | Points |
|--------|--------|
| Pay for a booking | 10 points per $1 (configurable) |
| Sign up with referral code | 200 bonus (new user) |
| Referred user's first booking | 500 bonus (referrer) |
| Redeem rewards | 500–5000 points → $5–$50 discount codes |

**Tiers:** Bronze (0+) → Silver (1000+) → Gold (5000+) → Platinum (10000+)

### Endpoints

#### `GET /loyalty/rewards`
List available rewards catalog (public).

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
[
  {
    "id": "discount-5",
    "name": "$5 Booking Discount",
    "description": "Redeem for $5 off your next booking",
    "pointsCost": 500,
    "discountAmount": 5
  },
  {
    "id": "discount-10",
    "name": "$10 Booking Discount",
    "pointsCost": 1000,
    "discountAmount": 10
  }
]
```

---

#### `GET /loyalty/me`
Get authenticated user's loyalty profile, tier, and referral code.

| | |
|---|---|
| **Auth** | JWT required |

**Response:**
```json
{
  "points": 1250,
  "tier": { "name": "Silver", "minPoints": 1000, "multiplier": 1.1 },
  "referralCode": "NX12AB3C",
  "referralLink": "https://nexsol.travel/signup?ref=NX12AB3C",
  "referrals": {
    "total": 3,
    "bonusPerFirstBooking": 500
  },
  "earnRules": {
    "pointsPerDollar": 10,
    "referralSignupBonus": 200,
    "referralFirstBookingBonus": 500
  },
  "redeemRate": "100 points = $1 discount"
}
```

---

#### `GET /loyalty/transactions`
Get points transaction history (last 50).

| | |
|---|---|
| **Auth** | JWT required |

**Response:**
```json
[
  {
    "id": 1,
    "type": "EARNED_BOOKING",
    "points": 250,
    "description": "Earned from booking payment ($25.00)",
    "bookingId": 12,
    "createdAt": "2026-06-09T10:00:00.000Z"
  },
  {
    "id": 2,
    "type": "REFERRAL_BONUS",
    "points": 200,
    "description": "Welcome bonus via referral from NX99ZZ1A",
    "createdAt": "2026-06-08T09:00:00.000Z"
  }
]
```

**Transaction types:** `EARNED_BOOKING`, `EARNED_REFERRAL`, `REFERRAL_BONUS`, `REDEEMED`, `BONUS`

---

#### `POST /loyalty/redeem`
Redeem points for a one-time booking discount code.

| | |
|---|---|
| **Auth** | JWT required |

**Request body:**
```json
{
  "rewardId": "discount-10"
}
```

| Field | Type | Values |
|-------|------|--------|
| `rewardId` | string | `discount-5`, `discount-10`, `discount-25`, `discount-50` |

**Response:**
```json
{
  "success": true,
  "redemptionCode": "LOYALTY-1717929600000-12",
  "discountAmount": 10,
  "pointsSpent": 1000,
  "expiresAt": "2026-07-09T10:00:00.000Z",
  "message": "Apply code LOYALTY-1717929600000-12 at checkout"
}
```

---

#### `POST /auth/verify-otp` *(updated — referral support)*
When verifying OTP at signup, pass an optional referral code to earn bonus points.

**Request body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "referralCode": "NX12AB3C"
}
```

---

#### `POST /payments/create-order` *(updated — loyalty discount)*
Apply a loyalty redemption code at checkout alongside promo codes.

**Request body (additional field):**
```json
{
  "bookingType": "hotel",
  "amount": 250.00,
  "bookingIds": [1],
  "promoCode": "SAVE10",
  "loyaltyRedemptionCode": "LOYALTY-1717929600000-12"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `loyaltyRedemptionCode` | string | Optional code from `POST /loyalty/redeem` |

**Response includes:** `loyaltyDiscount` field with amount deducted.

---

## Feature 16: Advanced AR Property Visualization (Furniture & Room Layouts)

Extends basic AR room tours with room dimensions, furniture placement, collision detection, and per-item 3D models.

### Database

| Model / Field | Description |
|---------------|-------------|
| `Room.arRoomWidth` | Room width in meters |
| `Room.arRoomDepth` | Room depth in meters |
| `Room.arRoomHeight` | Room height in meters (default 2.8) |
| `Room.arLayoutType` | `RECTANGULAR`, `L_SHAPE`, `STUDIO`, `SUITE` |
| `ArFurniture` | Per-room furniture items with 3D position, rotation, scale |

### Furniture categories

`SOFA`, `BED`, `TABLE`, `CHAIR`, `DESK`, `WARDROBE`, `LAMP`, `OTHER`

### Requirements

- Standard or Premium host plan required for furniture management
- Android furniture models: `.glb`
- iOS furniture models: `.usdz`

### Endpoints

#### `GET /ar/rooms/:roomId/visualization`
Get full advanced AR scene — room layout, floor plan, furniture transforms, and capabilities.

| | |
|---|---|
| **Auth** | Not required |

**Example:** `GET /ar/rooms/5/visualization`

**Response:**
```json
{
  "roomId": 5,
  "roomTitle": "Deluxe Suite",
  "hotelId": 2,
  "layout": {
    "type": "RECTANGULAR",
    "width": 5.5,
    "depth": 4.2,
    "height": 2.8,
    "floorPlan": {
      "layoutType": "RECTANGULAR",
      "corners": [
        { "x": 0, "z": 0 },
        { "x": 5.5, "z": 0 },
        { "x": 5.5, "z": 4.2 },
        { "x": 0, "z": 4.2 }
      ],
      "center": { "x": 2.75, "z": 2.1 }
    }
  },
  "roomModel": {
    "android": "https://storage.googleapis.com/.../model.glb",
    "ios": "https://storage.googleapis.com/.../model.usdz",
    "scale": 1.0,
    "placementHeight": 0.0
  },
  "furniture": [
    {
      "id": 1,
      "name": "King Bed",
      "category": "BED",
      "models": {
        "android": "https://storage.googleapis.com/.../bed.glb",
        "ios": "https://storage.googleapis.com/.../bed.usdz"
      },
      "transform": {
        "position": { "x": 1.0, "y": 0, "z": 2.0 },
        "rotation": { "x": 0, "y": 90, "z": 0 },
        "scale": 1.0
      },
      "dimensions": { "width": 2.0, "depth": 1.8, "height": 0.6 },
      "isRemovable": false,
      "sortOrder": 0
    },
    {
      "id": 2,
      "name": "Accent Chair",
      "category": "CHAIR",
      "models": { "android": "...", "ios": "..." },
      "transform": {
        "position": { "x": 3.5, "y": 0, "z": 1.0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": 1.0
      },
      "dimensions": { "width": 0.8, "depth": 0.8, "height": 1.0 },
      "isRemovable": true,
      "sortOrder": 1
    }
  ],
  "capabilities": {
    "furniturePlacement": true,
    "roomLayoutPreview": true,
    "removableFurniture": true
  }
}
```

---

#### `PATCH /ar/rooms/:roomId/layout`
Set room dimensions and layout type.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |

**Request body (all optional):**
```json
{
  "arRoomWidth": 5.5,
  "arRoomDepth": 4.2,
  "arRoomHeight": 2.8,
  "arLayoutType": "RECTANGULAR"
}
```

| Field | Type | Values |
|-------|------|--------|
| `arLayoutType` | string | `RECTANGULAR`, `L_SHAPE`, `STUDIO`, `SUITE` |

---

#### `GET /ar/rooms/:roomId/furniture`
List all furniture items for a room.

| | |
|---|---|
| **Auth** | Not required |

---

#### `POST /ar/rooms/:roomId/furniture`
Add a furniture item to the room.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |

**Request body:**
```json
{
  "name": "Accent Chair",
  "category": "CHAIR",
  "positionX": 3.5,
  "positionY": 0,
  "positionZ": 1.0,
  "rotationY": 45,
  "scale": 1.0,
  "width": 0.8,
  "depth": 0.8,
  "height": 1.0,
  "isRemovable": true,
  "sortOrder": 1
}
```

---

#### `PATCH /ar/rooms/:roomId/furniture/:furnitureId`
Update furniture placement or properties.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |

**Request body:** Same fields as create (all optional).

---

#### `DELETE /ar/rooms/:roomId/furniture/:furnitureId`
Remove a furniture item from the room.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |

**Response:**
```json
{ "success": true }
```

---

#### `POST /ar/rooms/:roomId/furniture/:furnitureId/upload-model/:platform`
Upload a 3D model for a specific furniture item.

| | |
|---|---|
| **Auth** | JWT required (hotel owner or admin) |
| **Content-Type** | `multipart/form-data` |
| **Form field** | `model` (`.glb` for android, `.usdz` for ios) |

**Example:** `POST /ar/rooms/5/furniture/2/upload-model/android`

---

#### `POST /ar/rooms/:roomId/placement-preview`
Preview guest furniture placement — validates bounds and detects collisions.

| | |
|---|---|
| **Auth** | Not required |

**Request body:**
```json
{
  "placements": [
    {
      "furnitureId": 2,
      "positionX": 3.0,
      "positionY": 0,
      "positionZ": 1.5,
      "rotationY": 90,
      "scale": 1.0
    }
  ]
}
```

**Response:**
```json
{
  "roomId": 5,
  "layout": { "width": 5.5, "depth": 4.2, "height": 2.8 },
  "placements": [
    {
      "furnitureId": 2,
      "name": "Accent Chair",
      "position": { "x": 3.0, "y": 0, "z": 1.5 },
      "rotationY": 90,
      "scale": 1.0,
      "valid": true
    }
  ],
  "collisions": [],
  "warnings": [],
  "allValid": true
}
```

---

### Migration

Applied migration: `20260609200000_loyalty_and_advanced_ar`

Creates: `LoyaltyTransaction`, `LoyaltyRedemption`, `ArFurniture` tables; adds `loyaltyPoints`, `referralCode`, `referredById` to `User`; adds room layout fields to `Room`.

---

## Quick Reference

| # | Feature | Key Endpoints |
|---|---------|---------------|
| 1 | OTP → PostgreSQL | `POST /auth/register`, `POST /auth/verify-otp`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| 2 | Env secrets | `.env` configuration (no API) |
| 3 | Rate limiting | Applied on all routes automatically |
| 4 | 2Checkout + PayPal | `POST /payments/create-order`, `POST /payments/2checkout/confirm`, `POST /payments/paypal/create-order` |
| 5 | AR Room Tour | `GET /ar/rooms/:id/tour`, `GET /ar/hotels/:id/tours`, `POST /ar/rooms/:id/upload-model/:platform` |
| 6 | Subscription Plans | `GET /subscriptions/plans`, `GET /subscriptions/me`, `POST /subscriptions/subscribe` |
| 7 | Host Payouts (SEPA) | `GET /payouts/summary`, `POST /payouts/bank-accounts`, `POST /payouts/request`, `GET /payouts/history` |
| 8 | App Branding | `GET /branding`, `PATCH /branding` |
| 9 | Landing Page | `GET /`, `GET /landing` |
| 10 | Value Proposition | `GET /marketing/value-proposition` |
| 11 | Property Analytics | `GET /real-estate/analytics/dashboard`, `GET /real-estate/analytics/property/:id` |
| 12 | AI Price Estimator | `GET /real-estate/price-estimate/:propertyId`, `POST /real-estate/price-estimate` |
| 13 | Maintenance Marketplace | `POST /real-estate/marketplace/jobs`, `GET /real-estate/marketplace/jobs/open` |
| 14 | Neighborhood Intelligence | `GET /real-estate/neighborhood/:propertyId`, `POST /real-estate/neighborhood/:propertyId/refresh` |
| 15 | Loyalty Points | `GET /loyalty/me`, `GET /loyalty/rewards`, `POST /loyalty/redeem`, `GET /loyalty/transactions` |
| 16 | Advanced AR Visualization | `GET /ar/rooms/:id/visualization`, `PATCH /ar/rooms/:id/layout`, `POST /ar/rooms/:id/furniture`, `POST /ar/rooms/:id/placement-preview` |
