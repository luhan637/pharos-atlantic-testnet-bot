const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { randomFloat, randomInt } = require('../utils/delay');
const { AQUAFLUX_ABI, ERC20_ABI } = require('../utils/abis');

const aquaflux = config.contracts.aquaflux;
const usdc = config.contracts.usdc;

async function createStructure(wallet) {
  const contract = new ethers.Contract(aquaflux, AQUAFLUX_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Aquaflux] No USDC balance for structure');
      return null;
    }
    
    const amount = balance / 10n;
    const duration = randomInt(7, 30) * 86400; // 7-30 days in seconds
    
    logger.info('[Aquaflux] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(aquaflux, amount, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Aquaflux] Creating structure for ${duration / 86400} days...`);
    const tx = await contract.createStructure(amount, duration, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Aquaflux] Structure created!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Aquaflux] Structure failed: ${error.message}`);
    throw error;
  }
}

async function earn(wallet) {
  const contract = new ethers.Contract(aquaflux, AQUAFLUX_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Aquaflux] No USDC balance for earning');
      return null;
    }
    
    const amount = balance / 10n;
    
    logger.info('[Aquaflux] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(aquaflux, amount, { gasPrice });
    await approveTx.wait();
    
    logger.info('[Aquaflux] Starting earn...');
    const tx = await contract.earn(amount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Aquaflux] Earn started!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Aquaflux] Earn failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet, action) {
  switch (action) {
    case 'structure':
      return await createStructure(wallet);
    case 'earn':
      return await earn(wallet);
    default:
      return await createStructure(wallet);
  }
}

module.exports = { run, createStructure, earn };
