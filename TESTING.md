# Testing Guide - Auto-Funded Solana Wallets

## Quick Start Testing

### 1. Generate Master Wallet

**First, generate a master wallet to fund new users:**

```bash
cd backend
node scripts/generate-master-wallet.js
```

This will output:
- 📍 **Address**: Copy this to fund with SOL
- 🔑 **Private Key**: Add to your .env file
- 🗝️ **Mnemonic**: Keep safe as backup

### 2. Fund Master Wallet

Send **0.1-1 SOL** to the master wallet address from any Solana wallet or exchange.

### 3. Environment Setup

**Backend (`/backend/.env`):**
```env
# Database (required)
DATABASE_URL="postgresql://username:password@localhost:5432/vero"

# BetterAuth (required - minimum 32 characters)
BETTER_AUTH_SECRET="your-super-secret-key-here-minimum-32-chars"
BETTER_AUTH_URL="http://localhost:3001"

# Master Wallet (required for auto-funding)
MASTER_WALLET_PRIVATE_KEY="your-master-wallet-private-key-from-step-1"

# Google OAuth (optional for testing)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Solana (optional - defaults to mainnet)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

**Frontend (`/frontend/.env.local`):**
```env
# API Connection (required)
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Solana Explorer (optional)
NEXT_PUBLIC_SOLANA_EXPLORER="https://explorer.solana.com"
```

### 4. Database Setup

```bash
# Make sure PostgreSQL is running, then:
cd vero
bun run db:push
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
bun run start

# Terminal 2 - Frontend  
cd frontend
bun run dev
```

## Testing Flow (Simplified!)

### Step 1: Create Account & Auto-Funded Wallet
1. Go to `http://localhost:3000/login`
2. Sign up with email/password or Google
3. ✅ **Expected**: 
   - Wallet automatically created
   - **0.001 SOL automatically sent** from master wallet
   - Wallet immediately activated
   - Redirected directly to `/dashboard`

### Step 2: Dashboard Testing
1. Check wallet balance shows **~0.001 SOL**
2. Verify wallet info shows "Activated" status
3. View transaction history (should show the auto-funding transaction)
4. Test refresh button
5. Click transaction signatures to open in Solana Explorer

### Step 3: Multiple User Testing
1. Create multiple accounts to test auto-funding
2. Each new user should get 0.001 SOL automatically
3. Monitor master wallet balance decreasing

## No Onboarding Required! 🎉

With auto-funding, users skip the manual deposit step entirely:
- **Before**: Sign up → Onboarding → Manual deposit → Wait → Dashboard
- **Now**: Sign up → Dashboard (with funded wallet!)

## API Testing

### Test Endpoints Directly

```bash
# Get user's wallet info
curl -H "Cookie: better-auth.session_token=YOUR_SESSION" \
  http://localhost:3001/api/wallet/me

# Check wallet balance
curl -H "Cookie: better-auth.session_token=YOUR_SESSION" \
  http://localhost:3001/api/wallet/balance

# Check deposit status
curl -H "Cookie: better-auth.session_token=YOUR_SESSION" \
  http://localhost:3001/api/wallet/check-deposit

# Get user status
curl -H "Cookie: better-auth.session_token=YOUR_SESSION" \
  http://localhost:3001/api/status
```

## Troubleshooting

### Common Issues

**1. "Wallet not found" error**
- Check if wallet was created during signup
- Look in database: `SELECT * FROM wallet;`

**2. "Unauthorized" errors**
- Check if user is logged in
- Verify session cookies are being sent

**3. Balance not updating**
- Wait up to 30 seconds for blockchain confirmation
- Check transaction on Solana Explorer
- Try refreshing the page

**4. RPC errors**
- Mainnet RPC may have rate limits
- Try alternative RPC: `https://rpc.ankr.com/solana`

### Database Inspection

```sql
-- Check users and wallets
SELECT u.email, w.publicKey, w.isActivated, w.createdAt 
FROM "user" u 
LEFT JOIN wallet w ON u.id = w.userId;

-- Check specific wallet
SELECT * FROM wallet WHERE "publicKey" = 'YOUR_WALLET_ADDRESS';
```

### Reset Testing

```bash
# Clear database (start fresh)
cd vero
bun run db:reset  # If you have this script
# OR manually delete records:
# DELETE FROM wallet; DELETE FROM "user";
```

## Production Considerations

### Security Notes
- Private keys stored in database (consider encryption)
- Use HTTPS in production
- Implement rate limiting
- Use paid RPC endpoints for reliability

### Scaling Notes
- Consider wallet activation batching
- Cache balance checks
- Implement webhook for transaction notifications
- Use Redis for session storage

## Getting Real SOL for Testing

1. **Buy on Exchange**: Coinbase, Binance, Kraken
2. **Bridge from Other Chains**: Use Wormhole, Allbridge
3. **DeFi Onramps**: MoonPay, Ramp Network
4. **Minimum**: 0.002 SOL (0.001 for activation + fees)

## Success Criteria

✅ User signup creates Solana wallet  
✅ Onboarding flow works with real SOL  
✅ Balance checking works in real-time  
✅ Dashboard shows accurate data  
✅ Middleware blocks unactivated users  
✅ Transaction history displays correctly  
✅ Solana Explorer links work  

Happy testing! 🚀
