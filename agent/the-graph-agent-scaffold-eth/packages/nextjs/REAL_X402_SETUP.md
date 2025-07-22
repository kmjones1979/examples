# 🚀 Real x402 Transaction Setup Guide

This guide will help you set up **real x402 transactions** on the blockchain instead of simulated payments.

## 📋 Prerequisites

1. **Base Network Wallet** with USDC balance
2. **Private Key** for the agent wallet
3. **The Graph API Key** for accessing paid endpoints
4. **x402 Facilitator** access (currently in development)

## 🔧 Environment Variables Setup

Create a `.env.local` file in the `packages/nextjs/` directory with the following variables:

```bash
# The Graph API Configuration
GRAPH_API_KEY=your_graph_api_key_here
NEXT_PUBLIC_GRAPH_TOKEN=your_jwt_token_here
NEXT_PUBLIC_GRAPH_API_KEY=your_graph_api_key_here

# x402 Payment Configuration (REAL TRANSACTIONS)
X402_ENABLED=true
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_WALLET_ADDRESS=0xYourWalletAddressHere
X402_NETWORK=baseSepolia
X402_USDC_CONTRACT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
X402_QUERY_PRICE=10000
X402_FORCE_PAYMENT=true

# Agent Wallet Configuration (REAL PRIVATE KEY)
AGENT_PRIVATE_KEY=0xYourPrivateKeyHere

# Validation Settings
X402_SKIP_VALIDATION=false
```

## 🎯 Key Configuration Details

### **X402_NETWORK**

- `base` - Base mainnet (recommended for testing)
- `baseSepolia` - Base testnet
- `ethereum` - Ethereum mainnet
- `polygon` - Polygon mainnet

### **X402_QUERY_PRICE**

- Amount in smallest unit (e.g., "10000" = 0.01 USDC with 6 decimals)
- Default: "10000" (0.01 USDC)
- Adjust based on your API pricing

### **X402_FORCE_PAYMENT**

- `true` - Force x402 payments to test real transactions (required for testing)
- `false` - Only pay when actually required by the API (when APIs implement 402)

### **X402_SKIP_VALIDATION**

- `false` - Real verification with facilitator (production)
- `true` - Skip verification (development only)

## 💰 USDC Contract Addresses

| Network      | USDC Contract Address                        |
| ------------ | -------------------------------------------- |
| Base         | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Ethereum     | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Polygon      | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |

## 🔐 Security Considerations

### **Private Key Security**

- Never commit your private key to version control
- Use environment variables for all sensitive data
- Consider using a dedicated wallet for the agent

### **Wallet Setup**

1. Create a new wallet specifically for the agent
2. Fund it with enough USDC for payments
3. Keep the private key secure

## 🧪 Testing Real Transactions

### **Step 1: Verify Configuration**

```bash
# Check if all environment variables are set
echo $X402_ENABLED
echo $X402_WALLET_ADDRESS
echo $AGENT_PRIVATE_KEY
```

### **Step 2: Test with Paid Endpoint**

Use an endpoint that actually requires payment:

```bash
# This should trigger a real x402 payment
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Get token balances for 0x123..."}]}'
```

### **Step 3: Monitor Transactions**

- Check your wallet for USDC transfers
- Monitor Base network transactions
- Verify payments in the facilitator

## 🚨 Troubleshooting

### **Common Issues**

1. **"Invalid primary type" Error**

   - ✅ Fixed in latest version
   - EIP-712 signature creation now works correctly

2. **"Facilitator not available"**

   - The x402 facilitator is still in development
   - Set `X402_SKIP_VALIDATION=true` for testing

3. **"Insufficient USDC balance"**

   - Fund your agent wallet with USDC
   - Check the correct network (Base mainnet)

4. **"Payment verification failed"**
   - Ensure facilitator URL is correct
   - Check network connectivity
   - Verify USDC contract address

### **Debug Mode**

Enable debug logging by setting:

```bash
NODE_ENV=development
```

## 📊 Expected Behavior

### **Real Transaction Flow**

1. **API Request** → Agent receives request
2. **402 Response** → API returns payment required
3. **Payment Processing** → Agent creates EIP-712 signature
4. **USDC Transfer** → Real transaction on Base network
5. **Verification** → Facilitator verifies payment
6. **API Response** → Original request succeeds

### **Logs to Expect**

```
💳 Processing x402 payment: {...}
📝 Creating transferWithAuthorization signature
✅ Successfully created transferWithAuthorization signature
🔍 Verifying payment with facilitator: https://x402.org/facilitator/verify
✅ Payment verified successfully
```

## 🔄 Migration from Simulation

To switch from simulation to real transactions:

1. **Enable Force Payment:**

   ```bash
   X402_FORCE_PAYMENT=true
   ```

2. **Enable Real Validation:**

   ```bash
   X402_SKIP_VALIDATION=false
   ```

3. **Set Real Wallet:**

   ```bash
   X402_WALLET_ADDRESS=0xYourRealWalletAddress
   AGENT_PRIVATE_KEY=0xYourRealPrivateKey
   ```

4. **Fund Wallet:**
   - Send USDC to your agent wallet
   - Ensure sufficient balance for payments

## 🎉 Success Indicators

You'll know real x402 is working when:

- ✅ USDC transfers appear in your wallet
- ✅ Base network transactions are created
- ✅ Payment verification succeeds
- ✅ API responses include real data
- ✅ No "mock" or "simulation" messages in logs

## 📞 Support

For issues with real x402 transactions:

1. Check the [x402 documentation](https://x402.gitbook.io/x402)
2. Verify your Base network configuration
3. Ensure sufficient USDC balance
4. Monitor transaction logs for errors
