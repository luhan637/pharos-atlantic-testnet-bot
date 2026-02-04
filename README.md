# PHAROS Atlantic Testnet Bot

A Node.js bot for automating tasks on PHAROS Atlantic Testnet.

## Features

- **Daily GM (OnchainGM + Surflayer)** - Daily check-in tasks
- **Mint NFT (Grandline)** - Mint NFT on Grandline
- **FaroSwap** - Swap tokens and add liquidity
- **Bitverse** - Swap, deposit, and open long/short positions
- **Aquaflux** - Create structures and earn
- **Asseto** - Deposit, subscribe, and redemption
- **Zenith Lending** - Supply, borrow, repay, and withdraw
- **Transfer** - Random transfer to generate activity

## Requirements

- Node.js >= 18.x
- npm or yarn

## Installation

```bash
# Clone repository
git clone https://github.com/luhan637/pharos-atlantic-testnet-bot.git
cd pharos-atlantic-testnet-bot

# Install dependencies
npm install
```

## Configuration

1. Add your private keys to `wallets.txt` (one per line):
```
0x1234567890abcdef...
0xabcdef1234567890...
```

2. Review and modify `config.json` if needed (RPC URL, contract addresses, etc.)

## Usage

```bash
npm start
```

Then select an option from the menu:
- 1: Daily GM (OnchainGM + Surflayer)
- 2: Mint NFT (Grandline)
- 3: FaroSwap (Swap + Add Liquidity)
- 4: Bitverse (Swap + Deposit + Long/Short)
- 5: Aquaflux (Structure + Earn)
- 6: Asseto (Deposit + Subscribe + Redemption)
- 7: Zenith Lending (Supply + Borrow + Repay + Withdraw)
- 8: Transfer Random
- 9: Run All Tasks
- 0: Exit

## Project Structure

```
pharos-atlantic-testnet-bot/
âââ index.js              # Main entry point
âââ config.json           # Configuration file
âââ package.json          # Dependencies
âââ wallets.txt           # Private keys (create this file)
âââ modules/
â   âââ dailyGM.js       # Daily GM module
â   âââ mintNFT.js       # Mint NFT module
â   âââ faroSwap.js      # FaroSwap module
â   âââ bitverse.js      # Bitverse module
â   âââ aquaflux.js      # Aquaflux module
â   âââ asseto.js        # Asseto module
â   âââ zenithLending.js # Zenith Lending module
â   âââ transfer.js      # Transfer module
âââ utils/
    âââ logger.js        # Logging utility
    âââ delay.js         # Delay utilities
    âââ wallet.js        # Wallet management
    âââ abis.js          # Contract ABIs
```

## Network Info

- **Network Name:** PHAROS Atlantic Testnet
- **RPC URL:** https://testnet.dplabs-internal.com
- **Chain ID:** 688688
- **Explorer:** https://testnet.pharosscan.xyz

## Disclaimer

This bot is for educational and testnet purposes only. Use at your own risk.

## License

MIT
