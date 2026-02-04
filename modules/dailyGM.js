const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { delay } = require('../utils/delay');
const { getGasPrice } = require('../utils/wallet');
const { ONCHAINGM_ABI, SURFLAYER_ABI } = require('../utils/abis');

async function performGM(wallet) {
  const contract = new ethers.Contract(config.contracts.onchaingm, ONCHAINGM_ABI, wallet);
  
  try {
    // Check last GM time
    const lastGM = await contract.lastGM(wallet.address);
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    
    if (now - Number(lastGM) < dayInSeconds) {
      logger.warn('[OnchainGM] Already checked in today');
      return null;
    }
    
    const gasPrice = await getGasPrice();
    const tx = await contract.gm({ gasPrice });
    logger.info(`[OnchainGM] Sending GM transaction...`);
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[OnchainGM] GM completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[OnchainGM] Failed: ${error.message}`);
    throw error;
  }
}

async function performSurflayer(wallet) {
  const contract = new ethers.Contract(config.contracts.surflayer, SURFLAYER_ABI, wallet);
  
  try {
    // Check last check-in time
    const lastCheckIn = await contract.lastCheckIn(wallet.address);
    const now = Math.floor(Date.now() / 1000);
    const dayInSeconds = 86400;
    
    if (now - Number(lastCheckIn) < dayInSeconds) {
      logger.warn('[Surflayer] Already checked in today');
      return null;
    }
    
    const gasPrice = await getGasPrice();
    const tx = await contract.checkIn({ gasPrice });
    logger.info(`[Surflayer] Sending check-in transaction...`);
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Surflayer] Check-in completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Surflayer] Failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet) {
  logger.info('[DailyGM] Starting daily GM tasks...');
  
  try {
    await performGM(wallet);
    await delay(3000);
    await performSurflayer(wallet);
    
    logger.success('[DailyGM] All daily tasks completed!');
  } catch (error) {
    logger.error(`[DailyGM] Error: ${error.message}`);
    throw error;
  }
}

module.exports = { run, performGM, performSurflayer };
