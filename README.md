# PHAROS Atlantic Testnet Bot

Node.js bot for automated interactions with PHAROS Atlantic Testnet DeFi protocols.

## Features

- **Daily GM**: OnchainGM and Surflayer check-in
- **Mint NFT**: Grandline NFT minting
- **FaroSwap**: Token swaps and liquidity provision
- **Bitverse**: Swap, deposit, and perpetual trading (long/short)
- **Aquaflux**: Structure creation and yield farming
- **Asseto**: Deposit, subscribe to plans, and redemption
- **Zenith Lending**: Supply, borrow, repay, and withdraw
- **Transfer**: Random token transfers

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pharos-atlantic-testnet-bot.git
cd pharos-atlantic-testnet-bot

# Install dependencies
npm install
\`\`\`

## Configuration

1. Add your private keys to \`privateKeys.txt\` (one per line):
\`\`\`
0x1234567890abcdef...
0xabcdef1234567890...
\`\`\`

2. Adjust settings in \`config.json\` if needed.

## Usage

### Interactive Menu
\`\`\`bash
npm start
\`\`\`

### Run Individual Modules
\`\`\`bash
npm run gm          # Daily GM
npm run mint        # Mint NFT
npm run swap        # FaroSwap
npm run bitverse    # Bitverse
npm run aquaflux    # Aquaflux
npm run asseto      # Asseto
npm run zenith      # Zenith Lending
npm run transfer    # Random transfers
\`\`\`

## Project Structure

\`\`\`
pharos-atlantic-testnet-bot/
âââ index.js              # Main entry point with menu
âââ config.json           # Configuration file
âââ package.json          # Dependencies
âââ privateKeys.txt       # Your wallet private keys
âââ modules/
â   âââ dailyGm.js        # Daily GM module
â   âââ mintNft.js        # Mint NFT module
â   âââ faroSwap.js       # FaroSwap module
â   âââ bitverse.js       # Bitverse module
â   âââ aquaflux.js       # Aquaflux module
â   âââ asseto.js         # Asseto module
â   âââ zenithLending.js  # Zenith Lending module
â   âââ transfer.js       # Transfer module
âââ utils/
    âââ logger.js         # Console logging utility
    âââ delay.js          # Delay utilities
    âââ wallet.js         # Wallet management
    âââ abis.js           # Contract ABIs
\`\`\`

## Network Info

- **Network**: PHAROS Atlantic Testnet
- **Chain ID**: 688688
- **RPC**: https://testnet.dplabs-internal.com
- **Explorer**: https://testnet.pharosscan.xyz

## Security

â ï¸ **IMPORTANT**: Never commit your \`privateKeys.txt\` file to version control!

## License

MIT
