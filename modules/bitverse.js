const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { randomFloat } = require('../utils/delay');
const { BITVERSE_ROUTER_ABI, ERC20_ABI } = require('../utils/abis');

const router = config.contracts.bitverse_router;
const usdc = config.contracts.usdc;
const wphrs = config.contracts.wphrs;

async function swap(wallet) {
  const routerContract = new ethers.Contract(router, BITVERSE_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Bitverse] No USDC balance to swap');
      return null;
    }
    
    const amountIn = balance / 10n;
    
    logger.info('[Bitverse] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, amountIn, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Bitverse] Swapping USDC to WPHRS...`);
    const tx = await routerContract.swap(usdc, wphrs, amountIn, 0, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Bitverse] Swap completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Bitverse] Swap failed: ${error.message}`);
    throw error;
  }
}

async function deposit(wallet) {
  const routerContract = new ethers.Contract(router, BITVERSE_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Bitverse] No USDC balance to deposit');
      return null;
    }
    
    const amountIn = balance / 10n;
    
    logger.info('[Bitverse] Approving USDC for deposit...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, amountIn, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Bitverse] Depositing USDC...`);
    const tx = await routerContract.deposit(usdc, amountIn, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Bitverse] Deposit completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Bitverse] Deposit failed: ${error.message}`);
    throw error;
  }
}

async function openLong(wallet) {
  const routerContract = new ethers.Contract(router, BITVERSE_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Bitverse] No USDC balance for long position');
      return null;
    }
    
    const collateral = balance / 20n;
    const leverage = 2; // 2x leverage
    
    logger.info('[Bitverse] Approving USDC for long position...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, collateral, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Bitverse] Opening long position...`);
    const tx = await routerContract.openPosition(true, wphrs, collateral, leverage, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Bitverse] Long position opened!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Bitverse] Long position failed: ${error.message}`);
    throw error;
  }
}

async function openShort(wallet) {
  const routerContract = new ethers.Contract(router, BITVERSE_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Bitverse] No USDC balance for short position');
      return null;
    }
    
    const collateral = balance / 20n;
    const leverage = 2;
    
    logger.info('[Bitverse] Approving USDC for short position...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, collateral, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[Bitverse] Opening short position...`);
    const tx = await routerContract.openPosition(false, wphrs, collateral, leverage, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Bitverse] Short position opened!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Bitverse] Short position failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet, action) {
  switch (action) {
    case 'swap':
      return await swap(wallet);
    case 'deposit':
      return await deposit(wallet);
    case 'long':
      return await openLong(wallet);
    case 'short':
      return await openShort(wallet);
    default:
      return await swap(wallet);
  }
}

module.exports = { run, swap, deposit, openLong, openShort };
