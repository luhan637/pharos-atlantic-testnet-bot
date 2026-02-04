const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { randomFloat } = require('../utils/delay');

function generateRandomAddress() {
  const randomBytes = ethers.randomBytes(20);
  return ethers.getAddress('0x' + Buffer.from(randomBytes).toString('hex'));
}

async function run(wallet) {
  try {
    const amount = ethers.parseEther(randomFloat(0.0001, 0.001).toString());
    const toAddress = generateRandomAddress();
    
    logger.info(`[Transfer] Sending ${ethers.formatEther(amount)} PHRS to ${toAddress}...`);
    
    const gasPrice = await getGasPrice();
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
      gasPrice
    });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Transfer] Transfer completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Transfer] Failed: ${error.message}`);
    throw error;
  }
}

module.exports = { run, generateRandomAddress };
