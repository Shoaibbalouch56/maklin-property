# Nexsol Travel API — Postman Testing Guide (22 Features)

**Base URL:** `http://localhost:3000`  
**Swagger:** `http://localhost:3000/api`  
**WebSocket:** `ws://localhost:3000/messages`

---

## Postman Setup

### 1. Environment variables

| Variable | Example value |
|----------|---------------|
| `baseUrl` | `http://localhost:3000` |
| `token` | *(paste JWT after login/verify-otp)* |
| `roomId` | `1` |
| `hotelId` | `1` |
| `propertyId` | `1` |
| `bookingId` | `1` |

### 2. Auth header (for 🔒 endpoints)

```
Authorization: Bearer {{token}}
```

### 3. Content-Type

- JSON body → `Content-Type: application/json`
- File upload → `multipart/form-data`

---

## Feature 1: OTP Storage in PostgreSQL

### 1.1 Register (send OTP)
- **POST** `{{baseUrl}}/auth/register`
- **Auth:** None

```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 1.2 Verify OTP (get JWT)
- **POST** `{{baseUrl}}/auth/verify-otp`
- **Auth:** None

```json
{
  "email": "testuser@example.com",
  "otp": "123456",
  "referralCode": "NX12AB3C"
}
```

### 1.3 Forgot password
- **POST** `{{baseUrl}}/auth/forgot-password`
- **Auth:** None

```json
{
  "email": "testuser@example.com"
}
```

### 1.4 Verify reset OTP
- **POST** `{{baseUrl}}/auth/verify-reset-otp`
- **Auth:** None

```json
{
  "email": "testuser@example.com",
  "otp": "123456"
}
```

### 1.5 Reset password
- **POST** `{{baseUrl}}/auth/reset-password`
- **Auth:** None

```json
{
  "email": "testuser@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass456"
}
```

### 1.6 Login
- **POST** `{{baseUrl}}/auth/login`
- **Auth:** None

```json
{
  "email": "testuser@example.com",
  "password": "SecurePass123"
}
```

### 1.7 Get current user
- **GET** `{{baseUrl}}/auth/me`
- **Auth:** 🔒 Bearer token

---

## Feature 2: Secrets in Environment Variables

**No API endpoint.** Verify `.env` file has `DATABASE_URL`, `JWT_SECRET`, `GCP_*`, `TWOCHECKOUT_*`, `PAYPAL_*`, etc.

---

## Feature 3: API Rate Limiting

**No separate endpoint.** Test by sending 4+ rapid `POST /auth/register` requests — expect `429 Too Many Requests`.

---

## Feature 4: Payments (2Checkout + PayPal + Cash)

### 4.1 Create payment order (hotel)
- **POST** `{{baseUrl}}/payments/create-order`
- **Auth:** 🔒

```json
{
  "bookingType": "hotel",
  "amount": 250.00,
  "currency": "USD",
  "bookingIds": [1, 2],
  "adults": 2,
  "children": 0,
  "promoCode": "SAVE10",
  "loyaltyRedemptionCode": "LOYALTY-1717929600000-12",
  "provider": "2checkout"
}
```

### 4.2 Create payment order (property)
- **POST** `{{baseUrl}}/payments/create-order`
- **Auth:** 🔒

```json
{
  "bookingType": "property",
  "amount": 50000.00,
  "currency": "USD",
  "propertyId": 1,
  "promoCode": "SAVE10",
  "provider": "paypal"
}
```

### 4.3 Confirm 2Checkout payment
- **POST** `{{baseUrl}}/payments/2checkout/confirm`
- **Auth:** 🔒

```json
{
  "refNo": "12345678"
}
```

### 4.4 Create PayPal order
- **POST** `{{baseUrl}}/payments/paypal/create-order`
- **Auth:** 🔒

```json
{
  "bookingType": "hotel",
  "amount": 250.00,
  "currency": "USD",
  "bookingIds": [1],
  "adults": 2,
  "children": 0
}
```

### 4.5 Capture PayPal order
- **POST** `{{baseUrl}}/payments/paypal/capture-order`
- **Auth:** 🔒

```json
{
  "orderId": "PAYPAL_ORDER_ID"
}
```

### 4.6 Confirm cash payment (hotel)
- **POST** `{{baseUrl}}/payments/cash/confirm`
- **Auth:** 🔒

```json
{
  "bookingType": "hotel",
  "bookingIds": [1, 2],
  "adults": 2,
  "children": 0,
  "promoCode": "SAVE10"
}
```

### 4.7 Confirm cash payment (property)
- **POST** `{{baseUrl}}/payments/cash/confirm`
- **Auth:** 🔒

```json
{
  "bookingType": "property",
  "propertyId": 1,
  "promoCode": "SAVE10"
}
```

### 4.8 Get my transactions
- **GET** `{{baseUrl}}/payments/transactions`
- **Auth:** 🔒

### 4.9 Payment redirects (browser only)
- **GET** `{{baseUrl}}/payments/2checkout/return`
- **GET** `{{baseUrl}}/payments/2checkout/cancel`
- **GET** `{{baseUrl}}/payments/paypal/return`
- **GET** `{{baseUrl}}/payments/paypal/cancel`

---

## Feature 5: AR Room Tour

### 5.1 Get room AR tour
- **GET** `{{baseUrl}}/ar/rooms/{{roomId}}/tour`
- **Auth:** None

### 5.2 Get hotel AR tours list
- **GET** `{{baseUrl}}/ar/hotels/{{hotelId}}/tours`
- **Auth:** None

### 5.3 Update room AR settings
- **PATCH** `{{baseUrl}}/ar/rooms/{{roomId}}`
- **Auth:** 🔒 (hotel owner)

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

### 5.4 Upload AR model (Android)
- **POST** `{{baseUrl}}/ar/rooms/{{roomId}}/upload-model/android`
- **Auth:** 🔒
- **Body:** `form-data` → key `model`, type File, value `.glb` file

### 5.5 Upload AR model (iOS)
- **POST** `{{baseUrl}}/ar/rooms/{{roomId}}/upload-model/ios`
- **Auth:** 🔒
- **Body:** `form-data` → key `model`, type File, value `.usdz` file

---

## Feature 6: QR Check-in

### 6.1 Create hotel booking (prerequisite)
- **POST** `{{baseUrl}}/listing/hotel-bookings`
- **Auth:** 🔒

```json
{
  "hotelId": 1,
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-05",
  "rooms": [
    { "roomId": 1, "quantity": 1 }
  ]
}
```

### 6.2 Generate QR code for booking
- **GET** `{{baseUrl}}/check-in/bookings/{{bookingId}}/qr`
- **Auth:** 🔒 (guest)

### 6.3 Scan QR and check-in
- **POST** `{{baseUrl}}/check-in/scan`
- **Auth:** 🔒 (staff)

```json
{
  "qrToken": "PASTE_QR_TOKEN_FROM_STEP_6.2"
}
```

### 6.4 Check-out guest
- **POST** `{{baseUrl}}/check-in/bookings/{{bookingId}}/checkout`
- **Auth:** 🔒 (staff)

---

## Feature 7: FCM Push Notifications

### 7.1 Save FCM device token
- **PATCH** `{{baseUrl}}/users/me/fcm-token`
- **Auth:** 🔒

```json
{
  "fcmToken": "your-firebase-device-token-here"
}
```

### 7.2 Get my notifications
- **GET** `{{baseUrl}}/notifications/my`
- **Auth:** 🔒

### 7.3 Mark notification as read
- **PATCH** `{{baseUrl}}/notifications/my/1/read`
- **Auth:** 🔒

### 7.4 Mark all notifications read
- **PATCH** `{{baseUrl}}/notifications/my/read-all`
- **Auth:** 🔒

---

## Feature 8: WebSocket Real-time Messaging

**Use Postman WebSocket tab or a WS client.**

- **URL:** `ws://localhost:3000/messages`
- **Auth:** Send JWT in connection handshake or first message (per client setup)

### REST fallback (also test these)

### 8.1 Send message
- **POST** `{{baseUrl}}/messages/send`
- **Auth:** 🔒

```json
{
  "receiverId": 2,
  "text": "Hello, is the room available?"
}
```

### 8.2 Get conversation threads
- **GET** `{{baseUrl}}/messages/threads`
- **Auth:** 🔒

### 8.3 Get messages with user
- **GET** `{{baseUrl}}/messages/with/2`
- **Auth:** 🔒

### 8.4 Mark messages as read
- **POST** `{{baseUrl}}/messages/mark-read/2`
- **Auth:** 🔒

---

## Feature 9: 360° Panorama Viewer

### 9.1 Get room panorama
- **GET** `{{baseUrl}}/panorama/rooms/{{roomId}}`
- **Auth:** None

### 9.2 Get hotel panorama rooms
- **GET** `{{baseUrl}}/panorama/hotels/{{hotelId}}/rooms`
- **Auth:** None

### 9.3 Update room panorama settings
- **PATCH** `{{baseUrl}}/panorama/rooms/{{roomId}}`
- **Auth:** 🔒 (hotel owner)

```json
{
  "panoramaEnabled": true,
  "panoramaImageUrl": "https://storage.googleapis.com/bucket/panorama-main.jpg",
  "panoramaImages": [
    "https://storage.googleapis.com/bucket/panorama-1.jpg",
    "https://storage.googleapis.com/bucket/panorama-2.jpg"
  ],
  "panoramaYaw": 0,
  "panoramaPitch": 0
}
```

### 9.4 Upload panorama image
- **POST** `{{baseUrl}}/panorama/rooms/{{roomId}}/upload`
- **Auth:** 🔒
- **Body:** `form-data` → key `image`, type File (jpg/png)

---

## Feature 10: Multi-Currency

### 10.1 Get supported currencies
- **GET** `{{baseUrl}}/currency/supported`
- **Auth:** None

### 10.2 Get exchange rates
- **GET** `{{baseUrl}}/currency/rates?base=USD`
- **Auth:** None

### 10.3 Convert amount
- **GET** `{{baseUrl}}/currency/convert?amount=100&from=USD&to=EUR`
- **Auth:** None

### 10.4 Visitor locale detection
- **GET** `{{baseUrl}}/localization/visitor-locale`
- **Auth:** None

### 10.5 Translate text
- **POST** `{{baseUrl}}/localization/translate`
- **Auth:** None

```json
{
  "text": "Welcome to our hotel",
  "targetLanguage": "ARABIC"
}
```

---

## Feature 11: Subscription Plans

### 11.1 List all plans
- **GET** `{{baseUrl}}/subscriptions/plans`
- **Auth:** None

### 11.2 Get my subscription
- **GET** `{{baseUrl}}/subscriptions/me`
- **Auth:** 🔒 (host)

### 11.3 Subscribe to plan
- **POST** `{{baseUrl}}/subscriptions/subscribe`
- **Auth:** 🔒 (HOTEL_OWNER / LAND_OWNER)

```json
{
  "plan": "STANDARD"
}
```

*Valid values: `FREE`, `STANDARD`, `PREMIUM`*

---

## Feature 12: Host Payouts (SEPA)

### 12.1 Get payout summary
- **GET** `{{baseUrl}}/payouts/summary`
- **Auth:** 🔒 (host)

### 12.2 Add bank account
- **POST** `{{baseUrl}}/payouts/bank-accounts`
- **Auth:** 🔒 (host)

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

### 12.3 List bank accounts
- **GET** `{{baseUrl}}/payouts/bank-accounts`
- **Auth:** 🔒 (host)

### 12.4 Request payout
- **POST** `{{baseUrl}}/payouts/request`
- **Auth:** 🔒 (host)

```json
{
  "amount": 500.00,
  "bankAccountId": 1
}
```

### 12.5 Payout history
- **GET** `{{baseUrl}}/payouts/history`
- **Auth:** 🔒 (host)

---

## Feature 13: App Branding

### 13.1 Get branding
- **GET** `{{baseUrl}}/branding`
- **Auth:** None

### 13.2 Update branding (admin)
- **PATCH** `{{baseUrl}}/branding`
- **Auth:** 🔒 (ADMIN)

```json
{
  "appName": "Nexsol Travel",
  "tagline": "Book smarter with AR tours & AI",
  "companyName": "Nexsol",
  "supportEmail": "support@nexsol.com",
  "logoUrl": "https://storage.googleapis.com/bucket/logo.png",
  "primaryColor": "#2FC1BE",
  "secondaryColor": "#1A1A2E",
  "websiteUrl": "https://nexsol.com",
  "description": "Your all-in-one hotel booking platform."
}
```

---

## Feature 14: Landing Page API

### 14.1 Root welcome
- **GET** `{{baseUrl}}/`
- **Auth:** None

### 14.2 Full landing page content
- **GET** `{{baseUrl}}/landing`
- **Auth:** None

---

## Feature 15: Value Proposition

### 15.1 Marketing value proposition
- **GET** `{{baseUrl}}/marketing/value-proposition`
- **Auth:** None

---

## Feature 16: Property Analytics Dashboard

### 16.1 Owner dashboard (all listings)
- **GET** `{{baseUrl}}/real-estate/analytics/dashboard`
- **Auth:** 🔒 (owner)

### 16.2 Property analytics
- **GET** `{{baseUrl}}/real-estate/analytics/property/{{propertyId}}`
- **Auth:** 🔒 (owner)

### 16.3 Hotel analytics
- **GET** `{{baseUrl}}/real-estate/analytics/hotel/{{hotelId}}`
- **Auth:** 🔒 (owner)

### 16.4 Legacy property analysis (combined)
- **GET** `{{baseUrl}}/listing/property-analysis/{{propertyId}}`
- **Auth:** None

### 16.5 Owner listing summary
- **GET** `{{baseUrl}}/listing/owner-summary`
- **Auth:** 🔒 (owner)

---

## Feature 17: AI Price Estimator

### 17.1 Estimate by property ID
- **GET** `{{baseUrl}}/real-estate/price-estimate/{{propertyId}}`
- **Auth:** None

### 17.2 Estimate from custom input
- **POST** `{{baseUrl}}/real-estate/price-estimate`
- **Auth:** None

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

*Type: `VILLA`, `BUNGALOW`, `PALACE` | ListingType: `FOR_SALE`, `FOR_RENT`*

---

## Feature 18: Cleaning & Maintenance Marketplace

### 18.1 Create job
- **POST** `{{baseUrl}}/real-estate/marketplace/jobs`
- **Auth:** 🔒 (host)

```json
{
  "title": "Deep cleaning — Suite 204",
  "description": "Post-checkout deep clean required",
  "urgency": "URGENT",
  "budget": 150,
  "hotelId": 1
}
```

### 18.2 My posted jobs
- **GET** `{{baseUrl}}/real-estate/marketplace/jobs`
- **Auth:** 🔒 (host)

### 18.3 Browse open jobs (staff)
- **GET** `{{baseUrl}}/real-estate/marketplace/jobs/open`
- **Auth:** 🔒 (STAFF)

### 18.4 Get job details
- **GET** `{{baseUrl}}/real-estate/marketplace/jobs/1`
- **Auth:** 🔒

### 18.5 Get job applications
- **GET** `{{baseUrl}}/real-estate/marketplace/jobs/1/applications`
- **Auth:** 🔒 (job owner)

### 18.6 Staff apply to job
- **POST** `{{baseUrl}}/real-estate/marketplace/jobs/1/apply`
- **Auth:** 🔒 (STAFF)

### 18.7 Assign staff to job
- **POST** `{{baseUrl}}/real-estate/marketplace/jobs/1/assign`
- **Auth:** 🔒 (owner)

```json
{
  "applierId": 5
}
```

### 18.8 Auto-assign staff
- **POST** `{{baseUrl}}/real-estate/marketplace/jobs/1/auto-assign`
- **Auth:** 🔒 (owner)

### 18.9 Approve completed job
- **POST** `{{baseUrl}}/real-estate/marketplace/jobs/1/approve`
- **Auth:** 🔒 (owner)

---

## Feature 19: Neighborhood Intelligence

### 19.1 Get neighborhood insights
- **GET** `{{baseUrl}}/real-estate/neighborhood/{{propertyId}}`
- **Auth:** None

### 19.2 Refresh AI insights (owner)
- **POST** `{{baseUrl}}/real-estate/neighborhood/{{propertyId}}/refresh`
- **Auth:** 🔒 (property owner)

---

## Feature 20: Loyalty Points System

### 20.1 Rewards catalog
- **GET** `{{baseUrl}}/loyalty/rewards`
- **Auth:** None

### 20.2 My loyalty profile
- **GET** `{{baseUrl}}/loyalty/me`
- **Auth:** 🔒

### 20.3 Points transaction history
- **GET** `{{baseUrl}}/loyalty/transactions`
- **Auth:** 🔒

### 20.4 Redeem points for discount
- **POST** `{{baseUrl}}/loyalty/redeem`
- **Auth:** 🔒

```json
{
  "rewardId": "discount-10"
}
```

*Valid rewardId: `discount-5`, `discount-10`, `discount-25`, `discount-50`*

---

## Feature 21: Advanced AR Visualization

### 21.1 Full AR visualization scene
- **GET** `{{baseUrl}}/ar/rooms/{{roomId}}/visualization`
- **Auth:** None

### 21.2 Update room layout dimensions
- **PATCH** `{{baseUrl}}/ar/rooms/{{roomId}}/layout`
- **Auth:** 🔒 (hotel owner)

```json
{
  "arRoomWidth": 5.5,
  "arRoomDepth": 4.2,
  "arRoomHeight": 2.8,
  "arLayoutType": "RECTANGULAR"
}
```

*Layout types: `RECTANGULAR`, `L_SHAPE`, `STUDIO`, `SUITE`*

### 21.3 List furniture
- **GET** `{{baseUrl}}/ar/rooms/{{roomId}}/furniture`
- **Auth:** None

### 21.4 Add furniture item
- **POST** `{{baseUrl}}/ar/rooms/{{roomId}}/furniture`
- **Auth:** 🔒 (hotel owner)

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

*Categories: `SOFA`, `BED`, `TABLE`, `CHAIR`, `DESK`, `WARDROBE`, `LAMP`, `OTHER`*

### 21.5 Update furniture
- **PATCH** `{{baseUrl}}/ar/rooms/{{roomId}}/furniture/1`
- **Auth:** 🔒 (hotel owner)

```json
{
  "positionX": 3.0,
  "positionZ": 1.5,
  "rotationY": 90
}
```

### 21.6 Delete furniture
- **DELETE** `{{baseUrl}}/ar/rooms/{{roomId}}/furniture/1`
- **Auth:** 🔒 (hotel owner)

### 21.7 Upload furniture 3D model
- **POST** `{{baseUrl}}/ar/rooms/{{roomId}}/furniture/1/upload-model/android`
- **Auth:** 🔒
- **Body:** `form-data` → key `model`, File `.glb`

### 21.8 Preview furniture placement
- **POST** `{{baseUrl}}/ar/rooms/{{roomId}}/placement-preview`
- **Auth:** None

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

---

## Feature 22: AI Assistant

### 22.1 Get recommendations
- **GET** `{{baseUrl}}/ai-assistant/recommendations`
- **Auth:** None

### 22.2 Investment announcement
- **GET** `{{baseUrl}}/ai-assistant/investment-announcement`
- **Auth:** None

### 22.3 Chat (authenticated)
- **POST** `{{baseUrl}}/ai-assistant/chat`
- **Auth:** 🔒

```json
{
  "message": "Recommend hotels in Dubai under $200 per night"
}
```

### 22.4 Chat (guest — no login)
- **POST** `{{baseUrl}}/ai-assistant/chat-guest`
- **Auth:** None

```json
{
  "message": "What are the best areas to stay in Belgrade?"
}
```

### 22.5 Voice transcribe (authenticated)
- **POST** `{{baseUrl}}/ai-assistant/transcribe`
- **Auth:** 🔒
- **Body:** `form-data` → key `audio`, type File (audio file)

### 22.6 Voice transcribe (guest)
- **POST** `{{baseUrl}}/ai-assistant/transcribe-guest`
- **Auth:** None
- **Body:** `form-data` → key `audio`, type File

---

## Recommended Test Order

1. `POST /auth/register` → `POST /auth/verify-otp` → save `token`
2. `GET /branding`, `GET /landing`, `GET /marketing/value-proposition`
3. `GET /listing/get-all-hotels`, `GET /listing/get-all-properties`
4. `GET /ar/rooms/1/tour`, `GET /panorama/rooms/1`, `GET /ar/rooms/1/visualization`
5. `POST /listing/hotel-bookings` → `POST /payments/create-order`
6. `GET /check-in/bookings/1/qr` → `POST /check-in/scan`
7. `GET /loyalty/me`, `GET /subscriptions/plans`
8. `GET /real-estate/analytics/dashboard`, `GET /real-estate/price-estimate/1`
9. `POST /ai-assistant/chat-guest`
10. `POST /messages/send` + WebSocket `ws://localhost:3000/messages`

---

## Quick Reference — All 22 Features

| # | Feature | Main endpoints |
|---|---------|----------------|
| 1 | OTP PostgreSQL | `POST /auth/register`, `POST /auth/verify-otp` |
| 2 | Env secrets | No API (check `.env`) |
| 3 | Rate limiting | Auto (test with rapid requests) |
| 4 | Payments | `POST /payments/create-order` |
| 5 | AR Room Tour | `GET /ar/rooms/:id/tour` |
| 6 | QR Check-in | `GET /check-in/bookings/:id/qr`, `POST /check-in/scan` |
| 7 | FCM Push | `PATCH /users/me/fcm-token` |
| 8 | WebSocket Messaging | `ws://localhost:3000/messages`, `POST /messages/send` |
| 9 | 360° Panorama | `GET /panorama/rooms/:id` |
| 10 | Multi-Currency | `GET /currency/supported`, `GET /currency/convert` |
| 11 | Subscription Plans | `GET /subscriptions/plans`, `POST /subscriptions/subscribe` |
| 12 | Host Payouts | `POST /payouts/bank-accounts`, `POST /payouts/request` |
| 13 | App Branding | `GET /branding`, `PATCH /branding` |
| 14 | Landing Page | `GET /`, `GET /landing` |
| 15 | Value Proposition | `GET /marketing/value-proposition` |
| 16 | Property Analytics | `GET /real-estate/analytics/dashboard` |
| 17 | AI Price Estimator | `GET /real-estate/price-estimate/:id` |
| 18 | Maintenance Marketplace | `POST /real-estate/marketplace/jobs` |
| 19 | Neighborhood Intelligence | `GET /real-estate/neighborhood/:id` |
| 20 | Loyalty Points | `GET /loyalty/me`, `POST /loyalty/redeem` |
| 21 | Advanced AR | `GET /ar/rooms/:id/visualization` |
| 22 | AI Assistant | `POST /ai-assistant/chat-guest` |

---

## Postman Import (recommended)

**The `.md` file cannot be imported into Postman directly.** Use these JSON files instead:

| File | Import as |
|------|-----------|
| `postman/Nexsol_Travel_API.postman_collection.json` | **Import → File → Collection** |
| `postman/Nexsol_Travel_Local.postman_environment.json` | **Import → File → Environment** |

### Steps
1. Open Postman → **Import** → select both JSON files from the `postman/` folder
2. Select environment **Nexsol Travel — Local** (top-right dropdown)
3. Run **Verify OTP** or **Login** → copy `access_token` into environment variable `token`
4. Run other requests — auth endpoints use `Bearer {{token}}` automatically

*This markdown file is a readable reference. For one-click import, use the JSON files above.*
