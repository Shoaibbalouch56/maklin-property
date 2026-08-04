# Super App Backend

NestJS REST API for the Super App (hotel booking, properties, payments, messaging, AR tours, and more).

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api`  
**WebSocket (Messaging):** `ws://localhost:3000/messages`  
**Auth:** `Authorization: Bearer <jwt_token>`

---

## Quick Start

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GCP_* etc.
npx prisma migrate deploy
npm run dev
```

---

## All API Endpoints

Legend: 🔓 = Public | 🔒 = JWT required

---

### App

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔓 | Health / hello |

---

### Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | 🔓 | Register user, send OTP (rate: 3/min) |
| POST | `/auth/verify-otp` | 🔓 | Verify OTP, create account, return JWT |
| POST | `/auth/forgot-password` | 🔓 | Send password-reset OTP |
| POST | `/auth/verify-reset-otp` | 🔓 | Verify reset OTP |
| POST | `/auth/reset-password` | 🔓 | Set new password |
| POST | `/auth/login` | 🔓 | Login, return JWT |
| POST | `/auth/social-login` | 🔓 | Firebase social login |
| GET | `/auth/me` | 🔒 | Get current user profile |

---

### Users (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users` | 🔓 | Create user |
| GET | `/users` | 🔓 | List users |
| GET | `/users/me` | 🔒 | Get own profile |
| GET | `/users/:id` | 🔓 | Get user by ID |
| GET | `/users/:id/avatar` | 🔓 | Get user avatar image |
| PATCH | `/users/:id` | 🔒 | Update user |
| PATCH | `/users/:id/avatar` | 🔒 | Update avatar |
| PATCH | `/users/me/fcm-token` | 🔒 | Save FCM push token |
| DELETE | `/users/:id` | 🔒 | Delete user |

---

### Listings (`/listing`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listing/owner-summary` | 🔒 | Owner dashboard summary |
| POST | `/listing/add-property` | 🔒 | Add property listing |
| GET | `/listing/get-all-properties` | 🔓 | All properties |
| GET | `/listing/get-my-properties` | 🔒 | My properties |
| GET | `/listing/property/:id` | 🔓 | Property details |
| PATCH | `/listing/update-property/:id` | 🔒 | Update property |
| DELETE | `/listing/delete-property/:id` | 🔒 | Delete property |
| PATCH | `/listing/toggle-property-status/:id` | 🔒 | Activate/deactivate property |
| GET | `/listing/property-analysis/:id` | 🔒 | AI property analysis |
| GET | `/listing/property-image/:propertyId/:imageIndex` | 🔓 | Property image proxy |
| POST | `/listing/add-hotel` | 🔒 | Add hotel |
| GET | `/listing/get-all-hotels` | 🔓 | All hotels |
| GET | `/listing/get-my-hotels` | 🔒 | My hotels |
| GET | `/listing/hotel/:id` | 🔓 | Hotel details |
| PATCH | `/listing/update-hotel/:id` | 🔒 | Update hotel |
| DELETE | `/listing/delete-hotel/:id` | 🔒 | Delete hotel |
| PATCH | `/listing/toggle-hotel-status/:id` | 🔒 | Activate/deactivate hotel |
| GET | `/listing/hotel-image/:hotelId/:imageIndex` | 🔓 | Hotel image proxy |
| GET | `/listing/room-image/:roomId` | 🔓 | Room image proxy |
| POST | `/listing/hotel-bookings` | 🔒 | Create hotel booking |
| GET | `/listing/bookings` | 🔒 | My bookings |
| POST | `/listing/bookings/:id/cancel` | 🔒 | Cancel booking |
| GET | `/listing/avatar-image/:filename` | 🔓 | Avatar image proxy |

---

### Payments (`/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-order` | 🔒 | Create order (2Checkout primary, PayPal fallback) |
| POST | `/payments/2checkout/confirm` | 🔒 | Confirm 2Checkout payment |
| GET | `/payments/2checkout/return` | 🔓 | 2Checkout success redirect |
| GET | `/payments/2checkout/cancel` | 🔓 | 2Checkout cancel redirect |
| POST | `/payments/paypal/create-order` | 🔒 | Create PayPal order (secondary) |
| POST | `/payments/paypal/capture-order` | 🔒 | Capture PayPal payment |
| GET | `/payments/paypal/return` | 🔓 | PayPal success redirect |
| GET | `/payments/paypal/cancel` | 🔓 | PayPal cancel redirect |
| POST | `/payments/cash/confirm` | 🔒 | Confirm cash payment |
| GET | `/payments/transactions` | 🔒 | My transaction history |

---

### Check-in / QR (`/check-in`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/check-in/bookings/:bookingId/qr` | 🔒 | Generate signed QR token for guest |
| POST | `/check-in/scan` | 🔒 | Staff scans QR → check-in guest |
| POST | `/check-in/bookings/:bookingId/checkout` | 🔒 | Staff checks out guest |

---

### AR Room Tour (`/ar`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ar/rooms/:roomId/tour` | 🔓 | AR tour config (GLB + USDZ for SceneView/ARCore) |
| GET | `/ar/hotels/:hotelId/tours` | 🔓 | All AR-enabled rooms in hotel |
| PATCH | `/ar/rooms/:roomId` | 🔒 | Update AR settings (hotel owner) |
| POST | `/ar/rooms/:roomId/upload-model/android` | 🔒 | Upload `.glb` model (ARCore) |
| POST | `/ar/rooms/:roomId/upload-model/ios` | 🔒 | Upload `.usdz` model (SceneView) |

---

### 360° Panorama Viewer (`/panorama`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/panorama/rooms/:roomId` | 🔓 | 360° panorama viewer data (no AR) |
| GET | `/panorama/hotels/:hotelId/rooms` | 🔓 | All panorama-enabled rooms |
| PATCH | `/panorama/rooms/:roomId` | 🔒 | Update panorama settings |
| POST | `/panorama/rooms/:roomId/upload` | 🔒 | Upload panorama image |

---

### Messages — REST (`/messages`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/threads` | 🔒 | List message threads |
| GET | `/messages/with/:otherUserId` | 🔒 | Messages with a user |
| POST | `/messages/send` | 🔒 | Send direct message |
| POST | `/messages/mark-read/:senderId` | 🔒 | Mark messages as read |

### Messages — WebSocket (`ws://localhost:3000/messages`)

Connect with JWT: `auth: { token: '<jwt>' }`

| Event | Direction | Description |
|-------|-----------|-------------|
| `connected` | server → client | Connection confirmed |
| `send_message` | client → server | Send message `{ receiverId, content, propertyId? }` |
| `new_message` | server → client | New message received |
| `message_sent` | server → client | Send confirmation |
| `mark_read` | client → server | Mark read `{ senderId, propertyId? }` |
| `messages_read` | server → client | Read receipt |
| `typing` | both | Typing indicator `{ receiverId, isTyping }` |

---

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/my` | 🔒 | My notifications |
| PATCH | `/notifications/my/read-all` | 🔒 | Mark all as read |
| PATCH | `/notifications/my/:id/read` | 🔒 | Mark one as read |
| GET | `/admin/notifications` | 🔒 | Admin notifications |
| PATCH | `/admin/notifications/:id/read` | 🔒 | Admin mark read |
| PATCH | `/admin/notifications/read-all` | 🔒 | Admin mark all read |

---

### Wishlist (`/wishlist`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/wishlist/add-property/:propertyId` | 🔒 | Add property to wishlist |
| POST | `/wishlist/add-hotel/:hotelId` | 🔒 | Add hotel to wishlist |
| DELETE | `/wishlist/remove-property/:propertyId` | 🔒 | Remove property |
| DELETE | `/wishlist/remove-hotel/:hotelId` | 🔒 | Remove hotel |
| GET | `/wishlist/my-wishlist` | 🔒 | My wishlist |
| GET | `/wishlist/check-property/:propertyId` | 🔒 | Check if property in wishlist |
| GET | `/wishlist/check-hotel/:hotelId` | 🔒 | Check if hotel in wishlist |
| GET | `/wishlist/property-cost-breakdown/:propertyId` | 🔒 | Property cost breakdown |

---

### Reviews (`/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reviews/property/:propertyId` | 🔒 | Review a property |
| POST | `/reviews/hotel/:hotelId` | 🔒 | Review a hotel |
| GET | `/reviews/property/:propertyId` | 🔓 | Property reviews |
| GET | `/reviews/hotel/:hotelId` | 🔓 | Hotel reviews |

---

### Forum (`/forums`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/forums` | 🔒 | Create forum post |
| GET | `/forums` | 🔓 | List forums |
| GET | `/forums/my-forums/:userId` | 🔓 | User's forums |
| GET | `/forums/:id` | 🔓 | Forum by ID |
| PATCH | `/forums/:id` | 🔒 | Update forum |
| DELETE | `/forums/:id` | 🔒 | Delete forum |
| POST | `/forums/:id/like` | 🔒 | Like forum |
| POST | `/forums/:id/comments` | 🔒 | Add comment |
| DELETE | `/forums/comments/:commentId` | 🔒 | Delete comment |

---

### Promo Codes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/promo-codes/active` | 🔓 | Active promo codes |
| POST | `/promo-codes/apply` | 🔒 | Apply promo code |
| POST | `/admin/promo-codes` | 🔒 | Create promo (admin) |
| GET | `/admin/promo-codes` | 🔒 | List promos (admin) |
| PATCH | `/admin/promo-codes/:id` | 🔒 | Update promo (admin) |
| DELETE | `/admin/promo-codes/:id` | 🔒 | Delete promo (admin) |

---

### Currency (`/currency`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/currency/supported` | 🔓 | All supported currencies (USD, EUR, Balkan/EU) |
| GET | `/currency/rates?base=EUR` | 🔓 | Exchange rates |
| GET | `/currency/convert?amount=100&from=USD&to=EUR` | 🔓 | Convert amount |

**Supported currencies:** USD, EUR, GBP, CHF, PKR, RSD, BAM, MKD, ALL, BGN, RON, HRK, HUF, PLN, CZK

---

### AI Assistant (`/ai-assistant`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ai-assistant/recommendations` | 🔒 | AI recommendations |
| GET | `/ai-assistant/investment-announcement` | 🔒 | Investment insights |
| POST | `/ai-assistant/chat` | 🔒 | Chat with AI |
| POST | `/ai-assistant/chat-guest` | 🔓 | Guest AI chat |
| POST | `/ai-assistant/transcribe` | 🔒 | Voice transcription |
| POST | `/ai-assistant/transcribe-guest` | 🔓 | Guest voice transcription |

---

### Localization (`/localization`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/localization/translate` | 🔓 | Translate text |
| GET | `/localization/visitor-locale` | 🔓 | Detect visitor locale/currency |

---

### Expenses (`/expenses`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/expenses/upload-receipt` | 🔒 | Upload receipt image |
| POST | `/expenses` | 🔒 | Create expense |
| GET | `/expenses` | 🔒 | List expenses |
| GET | `/expenses/summary` | 🔒 | Expense summary |
| GET | `/expenses/by-category` | 🔒 | Expenses by category |
| GET | `/expenses/insight` | 🔒 | AI expense insight |
| GET | `/expenses/:id` | 🔒 | Get expense |
| PATCH | `/expenses/:id` | 🔒 | Update expense |
| DELETE | `/expenses/:id` | 🔒 | Delete expense |

---

### IoT (`/iot`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/iot` | 🔒 | List IoT devices |
| POST | `/iot` | 🔒 | Add IoT device |
| DELETE | `/iot/:id` | 🔒 | Remove IoT device |

---

### Admin (`/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | 🔒 | Platform stats |
| GET | `/admin/insights` | 🔒 | Admin insights |
| POST | `/admin/jobs` | 🔒 | Create job |
| POST | `/admin/jobs/:id/apply` | 🔒 | Apply for job |
| POST | `/admin/jobs/:id/auto-assign` | 🔒 | Auto-assign job |
| POST | `/admin/jobs/:id/assign` | 🔒 | Assign job to staff |
| GET | `/admin/jobs/all` | 🔒 | All jobs |
| GET | `/admin/jobs/:id/applications` | 🔒 | Job applications |
| POST | `/admin/jobs/:id/submit` | 🔒 | Submit job work |
| GET | `/admin/jobs/status/:status` | 🔒 | Jobs by status |
| POST | `/admin/jobs/:id/review` | 🔒 | Review job |
| POST | `/admin/jobs/:id/approve` | 🔒 | Approve job |
| DELETE | `/admin/jobs/:id` | 🔒 | Delete job |

---

### Admin Staff (`/admin/staff`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/staff` | 🔒 | List staff |
| GET | `/admin/staff/assign` | 🔒 | Staff assignment view |
| POST | `/admin/staff` | 🔒 | Add staff member |
| DELETE | `/admin/staff/:id` | 🔒 | Remove staff |

---

### Staff Jobs (`/staff`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/staff/jobs` | 🔒 | Available jobs for staff |
| POST | `/staff/jobs/:id/accept` | 🔒 | Accept job |
| POST | `/staff/jobs/:id/submit` | 🔒 | Submit completed job |
| POST | `/staff/jobs/:id/reject` | 🔒 | Reject job |
| GET | `/staff/earnings` | 🔒 | Staff earnings |

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables:

- `DATABASE_URL`, `JWT_SECRET`
- `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `GCP_KEY_FILE`
- `TWOCHECKOUT_*`, `PAYPAL_*`
- `SMTP_*`, `GEMINI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

---

## Database

```bash
npx prisma migrate deploy   # apply migrations (production)
npm run db:push             # sync schema (development)
npm run db:baseline         # baseline after db push
npm test                    # run automated tests
```

**25 migrations** | **22 tables**

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development with hot reload |
| `npm start` | Build + production start |
| `npm run build` | Compile TypeScript |
| `npm test` | Run unit tests |
| `npm run db:migrate` | Deploy migrations |

---

## Detailed API Docs

For request/response examples of launch features, see [`API_ENDPOINTS.md`](API_ENDPOINTS.md).

Interactive testing: **http://localhost:3000/api** (Swagger)
