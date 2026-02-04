const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams, getBalance } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { AQUAFLUX_ABI } = require('../utils/abis');

const createStructure = async (walletData, amount, durationDays) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Creating Aquaflux structure for ${durationDays} days...`);
        const contract = new ethers.Contract(config.contracts.aquaflux, AQUAFLUX_ABI, wallet);
        
        const structureAmount = ethers.parseEther(amount.toString());
        const duration = durationDays * 24 * 60 * 60; // Convert days to seconds
        
        const tx = await contract.createStructure(structureAmount, duration, {
            ...getTxParams(),
            value: structureAmount
        });
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, `Structure created! Amount: ${amount} PHRS, Duration: ${durationDays} days`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Create structure failed: ${error.message}`);
    }
    return false;
};

const dissolveStructure = async (walletData, structureId) => {
    const { index, wallet } = walletData;
    try {
        logger.info(index, `Dissolving structure #${structureId}...`);
        const contract = new ethers.Contract(config.contracts.aquaflux, AQUAFLUX_ABI, wallet);
        
        const tx = await contract.dissolveStructure(structureId, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Structure #${structureId} dissolved!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Dissolve structure failed: ${error.message}`);
    }
    return false;
};

const earn = async (walletData, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Starting Aquaflux earn with ${amount} PHRS...`);
        const contract = new ethers.Contract(config.contracts.aquaflux, AQUAFLUX_ABI, wallet);
        
        const earnAmount = ethers.parseEther(amount.toString());
        
        const tx = await contract.earn(earnAmount, {
            ...getTxParams(),
            value: earnAmount
        });
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, `Earn started with ${amount} PHRS!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Earn failed: ${error.message}`);
    }
    return false;
};

const claimRewards = async (walletData) => {
    const { index, wallet } = walletData;
    try {
        logger.info(index, 'Claiming Aquaflux rewards...');
        const contract = new ethers.Contract(config.contracts.aquaflux, AQUAFLUX_ABI, wallet);
        
        const pending = await contract.pendingRewards(wallet.address);
        if (pending === 0n) {
            logger.warning(index, 'No rewards to claim');
            return false;
        }
        
        const tx = await contract.claimRewards(getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Claimed ${ethers.formatEther(pending)} rewards!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Claim rewards failed: ${error.message}`);
    }
    return false;
};

const runAquaflux = async () => {
    logger.banner('PHAROS Aquaflux Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Create structure
        await createStructure(walletData, 0.001, 7);
        await randomDelay();
        
        // Start earning
        await earn(walletData, 0.001);
        await randomDelay();
        
        // Claim any available rewards
        await claimRewards(walletData);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Aquaflux Complete!');
};

module.exports = { createStructure, dissolveStructure, earn, claimRewards, runAquaflux };

if (require.main === module) {
    runAquaflux().catch(console.error);
}