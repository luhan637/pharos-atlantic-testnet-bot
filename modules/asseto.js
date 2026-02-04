const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { randomInt } = require('../utils/delay');
const { ASSETO_ABI, ERC20_ABI } = require('../utils/abis');

const asseto = config.contracts.asseto;
const usdc = config.contracts.usdc;

async function deposit(wallet) {
  const contract = new ethers.Contract(asseto, ASSETO_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Asseto] No USDC balance to deposit');
      return null;
    }
    
    const amount = balance / 10n;
    
    logger.info('[Asseto] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(asseto, amount, { gasPrice });
    await approveTx.wait();
    
    logger.info('[Asseto] Depositing USDC...');
    const tx = await contract.deposit(usdc, amount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Asseto] Deposit completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Asseto] Deposit failed: ${error.message}`);
    throw error;
  }
}

async function subscribe(wallet) {
  const contract = new ethers.Contract(asseto, ASSETO_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Asseto] No USDC balance to subscribe');
      return null;
    }
    
    const amount = balance / 10n;
    const planId = randomInt(1, 3); // Random plan 1-3
    
    logger.info('[Asseto] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(asseto, amount, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Asseto] Subscribing to plan ${planId}...`);
    const tx = await contract.subscribe(planId, amount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Asseto] Subscription completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Asseto] Subscribe failed: ${error.message}`);
    throw error;
  }
}

async function requestRedemption(wallet) {
  const contract = new ethers.Contract(asseto, ASSETO_ABI, wallet);
  
  try {
    const subscriptionId = 1; // Default subscription ID
    
    logger.info('[Asseto] Requesting redemption...');
    const gasPrice = await getGasPrice();
    const tx = await contract.requestRedemption(subscriptionId, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Asseto] Redemption requested!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Asseto] Redemption failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet, action) {
  switch (action) {
    case 'deposit':
      return await deposit(wallet);
    case 'subscribe':
      return await subscribe(wallet);
    case 'redemption':
      return await requestRedemption(wallet);
    default:
      return await deposit(wallet);
  }
}

module.exports = { run, deposit, subscribe, requestRedemption };
