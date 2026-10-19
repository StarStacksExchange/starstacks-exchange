# Starstacks Exchange — starter project

A responsive React/Vite interface with injected-wallet connection, account display, and wallet network switching for Ethereum, Base, Polygon, Arbitrum, and BNB Chain.

## Run locally

1. Install Node.js (LTS).
2. Unzip this folder and open a terminal in it.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL shown by Vite.

## Important current limitations

This is a **starter interface**, not a live exchange yet. Wallet connection and network switching are implemented. It does **not** currently fetch live swap quotes, read balances, or submit swap transactions. The “Get swap quote” action intentionally explains this rather than pretending to execute a trade.

Before enabling real swaps:
- Choose a reputable swap provider / aggregator and verify its current API and supported chains.
- Keep provider API secrets on a backend; do not embed private keys or secret API credentials in browser code.
- Implement quote validation, token/chain allowlists, slippage limits, transaction simulation, fee display, approvals, and clear failure handling.
- Test on testnets and have the integration independently security-reviewed before handling real funds.
- Confirm applicable licensing and virtual-asset rules in the countries where the service will operate.
- Do not collect users' seed phrases or private keys.

## Supported wallet networks

Ethereum Mainnet, Base, Polygon, Arbitrum One, and BNB Smart Chain. A network must already be available in the user's wallet; this starter does not silently add custom networks.

## Branding

The project name is Starstacks Exchange. The project is independent and is not affiliated with Uniswap.
