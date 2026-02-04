const readlineSync = require('readline-sync');
const figlet = require('figlet');
const chalk = require('chalk');

const { runDailyGm } = require('./modules/dailyGm');
const { runMintNFT } = require('./modules/mintNft');
const { runFaroSwap } = require('./modules/faroSwap');
const { runBitverse } = require('./modules/bitverse');
const { runAquaflux } = require('./modules/aquaflux');
const { runAsseto } = require('./modules/asseto');
const { runZenithLending } = require('./modules/zenithLending');
const { runTransfer } = require('./modules/transfer');

const showBanner = () => {
    console.clear();
    console.log(chalk.cyan(figlet.textSync('PHAROS BOT', { font: 'Standard' })));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.white.bold('  PHAROS Atlantic Testnet Bot'));
    console.log(chalk.gray('  Automated DeFi interactions for testnet'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();
};

const showMenu = () => {
    console.log(chalk.yellow('Select module to run:\n'));
    console.log('  1. Daily GM (OnchainGM + Surflayer)');
    console.log('  2. Mint NFT (Grandline)');
    console.log('  3. FaroSwap (Swap + Liquidity)');
    console.log('  4. Bitverse (Swap + Deposit + Long/Short)');
    console.log('  5. Aquaflux (Structure + Earn)');
    console.log('  6. Asseto (Deposit + Subscribe + Redemption)');
    console.log('  7. Zenith Lending (Supply + Borrow + Repay + Withdraw)');
    console.log('  8. Transfer (Random transfers)');
    console.log('  9. Run ALL modules');
    console.log('  0. Exit');
    console.log();
};

const runAllModules = async () => {
    console.log(chalk.cyan('\nRunning all modules...\n'));
    
    await runDailyGm();
    await runMintNFT();
    await runFaroSwap();
    await runBitverse();
    await runAquaflux();
    await runAsseto();
    await runZenithLending();
    await runTransfer();
    
    console.log(chalk.green.bold('\n✓ All modules completed!\n'));
};

const main = async () => {
    showBanner();
    
    while (true) {
        showMenu();
        const choice = readlineSync.question(chalk.cyan('Enter choice (0-9): '));
        console.log();
        
        switch (choice) {
            case '1':
                await runDailyGm();
                break;
            case '2':
                await runMintNFT();
                break;
            case '3':
                await runFaroSwap();
                break;
            case '4':
                await runBitverse();
                break;
            case '5':
                await runAquaflux();
                break;
            case '6':
                await runAsseto();
                break;
            case '7':
                await runZenithLending();
                break;
            case '8':
                await runTransfer();
                break;
            case '9':
                await runAllModules();
                break;
            case '0':
                console.log(chalk.yellow('Goodbye!'));
                process.exit(0);
            default:
                console.log(chalk.red('Invalid choice. Please try again.'));
        }
        
        console.log();
        readlineSync.question(chalk.gray('Press Enter to continue...'));
        showBanner();
    }
};

main().catch(console.error);