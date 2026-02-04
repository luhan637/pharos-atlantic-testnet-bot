const readline = require('readline-sync');
const chalk = require('chalk');
const { ethers } = require('ethers');
const config = require('./config.json');
const logger = require('./utils/logger');
const { delay, randomDelay } = require('./utils/delay');
const { loadWallets, getWalletInfo } = require('./utils/wallet');

// Import all modules
const dailyGM = require('./modules/dailyGM');
const mintNFT = require('./modules/mintNFT');
const faroSwap = require('./modules/faroSwap');
const bitverse = require('./modules/bitverse');
const aquaflux = require('./modules/aquaflux');
const asseto = require('./modules/asseto');
const zenithLending = require('./modules/zenithLending');
const transfer = require('./modules/transfer');

const MENU = `
ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â           PHAROS ATLANTIC TESTNET BOT                        â
â âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ£
â  1. Daily GM (OnchainGM + Surflayer)                        â
â  2. Mint NFT (Grandline)                                     â
â  3. FaroSwap (Swap + Add Liquidity)                         â
â  4. Bitverse (Swap + Deposit + Long/Short)                  â
â  5. Aquaflux (Structure + Earn)                             â
â  6. Asseto (Deposit + Subscribe + Redemption)               â
â  7. Zenith Lending (Supply + Borrow + Repay + Withdraw)     â
â  8. Transfer Random                                          â
â  9. Run All Tasks                                            â
â  0. Exit                                                     â
ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
`;

async function main() {
  console.clear();
  logger.info('Starting PHAROS Atlantic Testnet Bot...');
  
  const wallets = await loadWallets();
  if (wallets.length === 0) {
    logger.error('No wallets found. Please add private keys to wallets.txt');
    process.exit(1);
  }
  
  logger.success(`Loaded ${wallets.length} wallet(s)`);
  
  while (true) {
    console.log(chalk.cyan(MENU));
    const choice = readline.question(chalk.yellow('Select option: '));
    
    try {
      switch (choice) {
        case '1':
          await runForAllWallets(wallets, dailyGM.run, 'Daily GM');
          break;
        case '2':
          await runForAllWallets(wallets, mintNFT.run, 'Mint NFT');
          break;
        case '3':
          await runFaroSwapMenu(wallets);
          break;
        case '4':
          await runBitverseMenu(wallets);
          break;
        case '5':
          await runAquafluxMenu(wallets);
          break;
        case '6':
          await runAssetoMenu(wallets);
          break;
        case '7':
          await runZenithMenu(wallets);
          break;
        case '8':
          await runForAllWallets(wallets, transfer.run, 'Transfer');
          break;
        case '9':
          await runAllTasks(wallets);
          break;
        case '0':
          logger.info('Goodbye!');
          process.exit(0);
        default:
          logger.warn('Invalid option');
      }
    } catch (error) {
      logger.error(`Error: ${error.message}`);
    }
    
    await delay(1000);
  }
}

async function runForAllWallets(wallets, taskFn, taskName) {
  logger.info(`Running ${taskName} for ${wallets.length} wallet(s)...`);
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    logger.info(`[Wallet ${i + 1}/${wallets.length}] ${wallet.address}`);
    
    try {
      await taskFn(wallet);
      logger.success(`[${taskName}] Completed for wallet ${i + 1}`);
    } catch (error) {
      logger.error(`[${taskName}] Failed for wallet ${i + 1}: ${error.message}`);
    }
    
    if (i < wallets.length - 1) {
      await randomDelay(config.settings.minDelay, config.settings.maxDelay);
    }
  }
}

async function runFaroSwapMenu(wallets) {
  console.log(`
  FaroSwap Options:
  1. Swap PHRS -> USDC
  2. Swap USDC -> PHRS
  3. Add Liquidity
  `);
  const opt = readline.question('Select: ');
  const actions = { '1': 'swapToUsdc', '2': 'swapToPhrs', '3': 'addLiquidity' };
  if (actions[opt]) {
    await runForAllWallets(wallets, (w) => faroSwap.run(w, actions[opt]), 'FaroSwap');
  }
}

async function runBitverseMenu(wallets) {
  console.log(`
  Bitverse Options:
  1. Swap
  2. Deposit
  3. Long Position
  4. Short Position
  `);
  const opt = readline.question('Select: ');
  const actions = { '1': 'swap', '2': 'deposit', '3': 'long', '4': 'short' };
  if (actions[opt]) {
    await runForAllWallets(wallets, (w) => bitverse.run(w, actions[opt]), 'Bitverse');
  }
}

async function runAquafluxMenu(wallets) {
  console.log(`
  Aquaflux Options:
  1. Structure
  2. Earn
  `);
  const opt = readline.question('Select: ');
  const actions = { '1': 'structure', '2': 'earn' };
  if (actions[opt]) {
    await runForAllWallets(wallets, (w) => aquaflux.run(w, actions[opt]), 'Aquaflux');
  }
}

async function runAssetoMenu(wallets) {
  console.log(`
  Asseto Options:
  1. Deposit
  2. Subscribe
  3. Redemption
  `);
  const opt = readline.question('Select: ');
  const actions = { '1': 'deposit', '2': 'subscribe', '3': 'redemption' };
  if (actions[opt]) {
    await runForAllWallets(wallets, (w) => asseto.run(w, actions[opt]), 'Asseto');
  }
}

async function runZenithMenu(wallets) {
  console.log(`
  Zenith Lending Options:
  1. Supply
  2. Borrow
  3. Repay
  4. Withdraw
  `);
  const opt = readline.question('Select: ');
  const actions = { '1': 'supply', '2': 'borrow', '3': 'repay', '4': 'withdraw' };
  if (actions[opt]) {
    await runForAllWallets(wallets, (w) => zenithLending.run(w, actions[opt]), 'Zenith Lending');
  }
}

async function runAllTasks(wallets) {
  logger.info('Running all tasks...');
  
  await runForAllWallets(wallets, dailyGM.run, 'Daily GM');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, mintNFT.run, 'Mint NFT');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, (w) => faroSwap.run(w, 'swapToUsdc'), 'FaroSwap');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, (w) => bitverse.run(w, 'swap'), 'Bitverse');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, (w) => aquaflux.run(w, 'structure'), 'Aquaflux');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, (w) => asseto.run(w, 'deposit'), 'Asseto');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, (w) => zenithLending.run(w, 'supply'), 'Zenith Lending');
  await randomDelay(2000, 5000);
  
  await runForAllWallets(wallets, transfer.run, 'Transfer');
  
  logger.success('All tasks completed!');
}

main().catch(console.error);
