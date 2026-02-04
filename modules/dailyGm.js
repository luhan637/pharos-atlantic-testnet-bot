const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { ONCHAINGM_ABI, SURFLAYER_ABI } = require('../utils/abis');

const performOnchaingm = async (walletData) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, 'Performing OnchainGM...');
        const contract = new ethers.Contract(config.contracts.onchaingm, ONCHAINGM_ABI, wallet);
        
        const tx = await contract.gm(getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, 'OnchainGM completed!');
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `OnchainGM failed: ${error.message}`);
    }
    return false;
};

const performSurflayer = async (walletData) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, 'Performing Surflayer check-in...');
        const contract = new ethers.Contract(config.contracts.surflayer, SURFLAYER_ABI, wallet);
        
        const tx = await contract.checkIn(getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, 'Surflayer check-in completed!');
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Surflayer failed: ${error.message}`);
    }
    return false;
};

const runDailyGm = async () => {
    logger.banner('PHAROS Daily GM Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found. Please add private keys to privateKeys.txt');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        await performOnchaingm(walletData);
        await randomDelay();
        
        await performSurflayer(walletData);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Daily GM Complete!');
};

module.exports = { performOnchaingm, performSurflayer, runDailyGm };

if (require.main === module) {
    runDailyGm().catch(console.error);
}