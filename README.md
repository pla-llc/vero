To start:

```bash
git clone https://github.com/pla-llc/vero.git
cd vero
bun run install-deps
bun run db:push
bun run dev
```

## Solana Wallet Integration

This app automatically creates Solana wallets for users upon signup and requires wallet activation before accessing protected features.

### Configuration

- **Network**: Solana Mainnet (for all environments including testing)
- **RPC Endpoint**: `https://api.mainnet-beta.solana.com` (default)
- **Minimum Deposit**: 0.001 SOL to activate wallet
- **Explorer**: https://explorer.solana.com

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env):**
```env
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
DATABASE_URL="your-postgres-connection-string"
BETTER_AUTH_SECRET="your-secret-key"
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOLANA_EXPLORER="https://explorer.solana.com"
```

### User Flow

1. User signs up → Solana wallet automatically created
2. User redirected to onboarding → Must deposit ≥0.001 SOL
3. System detects deposit → Wallet activated automatically
4. User gains access to protected features and dashboard
