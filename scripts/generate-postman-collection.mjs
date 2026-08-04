import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'postman');
mkdirSync(outDir, { recursive: true });

const req = (name, method, path, body = null, auth = false) => ({
  name,
  request: {
    method,
    header: [
      { key: 'Content-Type', value: 'application/json' },
      ...(auth ? [] : []),
    ],
    ...(body
      ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2) } }
      : {}),
    url: `{{baseUrl}}${path}`,
    ...(auth
      ? {
          auth: {
            type: 'bearer',
            bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
          },
        }
      : {}),
  },
});

const folder = (name, items) => ({ name, item: items });

const collection = {
  info: {
    name: 'Nexsol Travel API — 22 Features',
    description:
      'Full API collection for all 22 launch features. Set `token` in environment after POST /auth/verify-otp or /auth/login.',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }],
  item: [
    folder('01 — OTP & Auth', [
      req('Register (send OTP)', 'POST', '/auth/register', {
        email: 'testuser@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
      }),
      req('Verify OTP (get JWT)', 'POST', '/auth/verify-otp', {
        email: 'testuser@example.com',
        otp: '123456',
        referralCode: 'NX12AB3C',
      }),
      req('Login', 'POST', '/auth/login', {
        email: 'testuser@example.com',
        password: 'SecurePass123',
      }),
      req('Forgot password', 'POST', '/auth/forgot-password', {
        email: 'testuser@example.com',
      }),
      req('Verify reset OTP', 'POST', '/auth/verify-reset-otp', {
        email: 'testuser@example.com',
        otp: '123456',
      }),
      req('Reset password', 'POST', '/auth/reset-password', {
        email: 'testuser@example.com',
        otp: '123456',
        newPassword: 'NewSecurePass456',
      }),
      req('Get me', 'GET', '/auth/me', null, true),
    ]),
    folder('02 — Env Secrets (no API)', [
      {
        name: 'README — configure .env file',
        request: {
          method: 'GET',
          header: [],
          url: '{{baseUrl}}/',
        },
      },
    ]),
    folder('03 — Rate Limiting (test manually)', [
      req('Register (repeat 4x for 429)', 'POST', '/auth/register', {
        email: 'ratelimit@test.com',
        password: 'SecurePass123',
        firstName: 'Rate',
        lastName: 'Test',
      }),
    ]),
    folder('04 — Payments', [
      req(
        'Create order (hotel)',
        'POST',
        '/payments/create-order',
        {
          bookingType: 'hotel',
          amount: 250.0,
          currency: 'USD',
          bookingIds: [1],
          adults: 2,
          children: 0,
          promoCode: 'SAVE10',
          loyaltyRedemptionCode: 'LOYALTY-CODE',
          provider: '2checkout',
        },
        true,
      ),
      req(
        'Create order (property)',
        'POST',
        '/payments/create-order',
        {
          bookingType: 'property',
          amount: 50000.0,
          currency: 'USD',
          propertyId: 1,
          provider: 'paypal',
        },
        true,
      ),
      req('Confirm 2Checkout', 'POST', '/payments/2checkout/confirm', {
        refNo: '12345678',
      }, true),
      req(
        'Create PayPal order',
        'POST',
        '/payments/paypal/create-order',
        {
          bookingType: 'hotel',
          amount: 250.0,
          currency: 'USD',
          bookingIds: [1],
          adults: 2,
        },
        true,
      ),
      req('Capture PayPal', 'POST', '/payments/paypal/capture-order', {
        orderId: 'PAYPAL_ORDER_ID',
      }, true),
      req(
        'Confirm cash (hotel)',
        'POST',
        '/payments/cash/confirm',
        {
          bookingType: 'hotel',
          bookingIds: [1],
          adults: 2,
          children: 0,
        },
        true,
      ),
      req('Get transactions', 'GET', '/payments/transactions', null, true),
    ]),
    folder('05 — AR Room Tour', [
      req('Get room tour', 'GET', '/ar/rooms/{{roomId}}/tour'),
      req('Get hotel tours', 'GET', '/ar/hotels/{{hotelId}}/tours'),
      req('Update room AR', 'PATCH', '/ar/rooms/{{roomId}}', {
        arEnabled: true,
        arScale: 1.2,
        arPlacementHeight: 0.5,
      }, true),
    ]),
    folder('06 — QR Check-in', [
      req('Create hotel booking', 'POST', '/listing/hotel-bookings', {
        hotelId: 1,
        checkIn: '2026-07-01',
        checkOut: '2026-07-05',
        rooms: [{ roomId: 1, quantity: 1 }],
      }, true),
      req('Generate QR', 'GET', '/check-in/bookings/{{bookingId}}/qr', null, true),
      req('Scan QR check-in', 'POST', '/check-in/scan', {
        qrToken: 'PASTE_QR_TOKEN',
      }, true),
      req('Check-out', 'POST', '/check-in/bookings/{{bookingId}}/checkout', null, true),
    ]),
    folder('07 — FCM Push', [
      req('Save FCM token', 'PATCH', '/users/me/fcm-token', {
        fcmToken: 'your-firebase-device-token',
      }, true),
      req('Get my notifications', 'GET', '/notifications/my', null, true),
      req('Mark notification read', 'PATCH', '/notifications/my/1/read', null, true),
    ]),
    folder('08 — Messaging', [
      req('Send message', 'POST', '/messages/send', {
        receiverId: 2,
        text: 'Hello, is the room available?',
      }, true),
      req('Get threads', 'GET', '/messages/threads', null, true),
      req('Get messages with user', 'GET', '/messages/with/2', null, true),
      req('Mark read', 'POST', '/messages/mark-read/2', null, true),
    ]),
    folder('09 — 360 Panorama', [
      req('Get room panorama', 'GET', '/panorama/rooms/{{roomId}}'),
      req('Get hotel panoramas', 'GET', '/panorama/hotels/{{hotelId}}/rooms'),
      req('Update panorama', 'PATCH', '/panorama/rooms/{{roomId}}', {
        panoramaEnabled: true,
        panoramaYaw: 0,
        panoramaPitch: 0,
      }, true),
    ]),
    folder('10 — Multi-Currency', [
      req('Supported currencies', 'GET', '/currency/supported'),
      req('Exchange rates', 'GET', '/currency/rates?base=USD'),
      req('Convert', 'GET', '/currency/convert?amount=100&from=USD&to=EUR'),
      req('Visitor locale', 'GET', '/localization/visitor-locale'),
      req('Translate', 'POST', '/localization/translate', {
        text: 'Welcome to our hotel',
        targetLanguage: 'ARABIC',
      }),
    ]),
    folder('11 — Subscription Plans', [
      req('List plans', 'GET', '/subscriptions/plans'),
      req('My subscription', 'GET', '/subscriptions/me', null, true),
      req('Subscribe', 'POST', '/subscriptions/subscribe', {
        plan: 'STANDARD',
      }, true),
    ]),
    folder('12 — Host Payouts (SEPA)', [
      req('Payout summary', 'GET', '/payouts/summary', null, true),
      req('Add bank account', 'POST', '/payouts/bank-accounts', {
        accountHolderName: 'John Hotel Owner',
        iban: 'DE89370400440532013000',
        bic: 'COBADEFFXXX',
        countryCode: 'DE',
        isDefault: true,
      }, true),
      req('List bank accounts', 'GET', '/payouts/bank-accounts', null, true),
      req('Request payout', 'POST', '/payouts/request', {
        amount: 500.0,
        bankAccountId: 1,
      }, true),
      req('Payout history', 'GET', '/payouts/history', null, true),
    ]),
    folder('13 — App Branding', [
      req('Get branding', 'GET', '/branding'),
      req('Update branding (admin)', 'PATCH', '/branding', {
        appName: 'Nexsol Travel',
        tagline: 'Book smarter with AR tours & AI',
        primaryColor: '#2FC1BE',
      }, true),
    ]),
    folder('14 — Landing Page', [
      req('Root welcome', 'GET', '/'),
      req('Landing content', 'GET', '/landing'),
    ]),
    folder('15 — Value Proposition', [
      req('Value proposition', 'GET', '/marketing/value-proposition'),
    ]),
    folder('16 — Property Analytics', [
      req('Owner dashboard', 'GET', '/real-estate/analytics/dashboard', null, true),
      req('Property analytics', 'GET', '/real-estate/analytics/property/{{propertyId}}', null, true),
      req('Hotel analytics', 'GET', '/real-estate/analytics/hotel/{{hotelId}}', null, true),
      req('Property analysis (legacy)', 'GET', '/listing/property-analysis/{{propertyId}}'),
      req('Owner summary', 'GET', '/listing/owner-summary', null, true),
    ]),
    folder('17 — AI Price Estimator', [
      req('Estimate by property ID', 'GET', '/real-estate/price-estimate/{{propertyId}}'),
      req('Estimate custom input', 'POST', '/real-estate/price-estimate', {
        title: 'Luxury Villa',
        address: 'Dubai Marina',
        price: 500000,
        area: 2500,
        rooms: 4,
        type: 'VILLA',
        listingType: 'FOR_SALE',
      }),
    ]),
    folder('18 — Maintenance Marketplace', [
      req('Create job', 'POST', '/real-estate/marketplace/jobs', {
        title: 'Deep cleaning — Suite 204',
        description: 'Post-checkout deep clean',
        urgency: 'URGENT',
        budget: 150,
        hotelId: 1,
      }, true),
      req('My jobs', 'GET', '/real-estate/marketplace/jobs', null, true),
      req('Open jobs (staff)', 'GET', '/real-estate/marketplace/jobs/open', null, true),
      req('Apply to job', 'POST', '/real-estate/marketplace/jobs/1/apply', null, true),
      req('Assign staff', 'POST', '/real-estate/marketplace/jobs/1/assign', {
        applierId: 5,
      }, true),
      req('Approve job', 'POST', '/real-estate/marketplace/jobs/1/approve', null, true),
    ]),
    folder('19 — Neighborhood Intelligence', [
      req('Get insights', 'GET', '/real-estate/neighborhood/{{propertyId}}'),
      req('Refresh insights', 'POST', '/real-estate/neighborhood/{{propertyId}}/refresh', null, true),
    ]),
    folder('20 — Loyalty Points', [
      req('Rewards catalog', 'GET', '/loyalty/rewards'),
      req('My loyalty', 'GET', '/loyalty/me', null, true),
      req('Transactions', 'GET', '/loyalty/transactions', null, true),
      req('Redeem reward', 'POST', '/loyalty/redeem', {
        rewardId: 'discount-10',
      }, true),
    ]),
    folder('21 — Advanced AR Visualization', [
      req('Get visualization', 'GET', '/ar/rooms/{{roomId}}/visualization'),
      req('Update layout', 'PATCH', '/ar/rooms/{{roomId}}/layout', {
        arRoomWidth: 5.5,
        arRoomDepth: 4.2,
        arRoomHeight: 2.8,
        arLayoutType: 'RECTANGULAR',
      }, true),
      req('List furniture', 'GET', '/ar/rooms/{{roomId}}/furniture'),
      req('Add furniture', 'POST', '/ar/rooms/{{roomId}}/furniture', {
        name: 'Accent Chair',
        category: 'CHAIR',
        positionX: 3.5,
        positionY: 0,
        positionZ: 1.0,
        isRemovable: true,
      }, true),
      req('Placement preview', 'POST', '/ar/rooms/{{roomId}}/placement-preview', {
        placements: [
          {
            furnitureId: 2,
            positionX: 3.0,
            positionY: 0,
            positionZ: 1.5,
            rotationY: 90,
          },
        ],
      }),
    ]),
    folder('22 — AI Assistant', [
      req('Recommendations', 'GET', '/ai-assistant/recommendations'),
      req('Investment announcement', 'GET', '/ai-assistant/investment-announcement'),
      req('Chat (auth)', 'POST', '/ai-assistant/chat', {
        message: 'Recommend hotels in Dubai under $200',
      }, true),
      req('Chat (guest)', 'POST', '/ai-assistant/chat-guest', {
        message: 'Best areas to stay in Belgrade?',
      }),
    ]),
  ],
};

const environment = {
  name: 'Nexsol Travel — Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
    { key: 'token', value: '', enabled: true },
    { key: 'roomId', value: '1', enabled: true },
    { key: 'hotelId', value: '1', enabled: true },
    { key: 'propertyId', value: '1', enabled: true },
    { key: 'bookingId', value: '1', enabled: true },
  ],
};

writeFileSync(
  join(outDir, 'Nexsol_Travel_API.postman_collection.json'),
  JSON.stringify(collection, null, 2),
);
writeFileSync(
  join(outDir, 'Nexsol_Travel_Local.postman_environment.json'),
  JSON.stringify(environment, null, 2),
);

console.log('Generated:');
console.log('  postman/Nexsol_Travel_API.postman_collection.json');
console.log('  postman/Nexsol_Travel_Local.postman_environment.json');
