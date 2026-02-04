const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { randomFloat } = require('../utils/delay');
const { FAROSWAP_ROUTER_ABI, ERC20_ABI } = require('../utils/abis');

const router = config.contracts.faroswap_router;
const wphrs = config.contracts.wphrs;
const usdc = config.contracts.usdc;

async function swapToUsdc(wallet) {
  const routerContract = new ethers.Contract(router, FAROSWAP_ROUTER_ABI, wallet);
  
  try {
    const amountIn = ethers.parseEther(randomFloat(0.001, 0.005).toString());
    const path = [wphrs, usdc];
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    
    logger.info(`[FaroSwap] Swapping ${ethers.formatEther(amountIn)} PHRS to USDC...`);
    
    const gasPrice = await getGasPrice();
    const tx = await routerContract.swapExactETHForTokens(
      0, // Accept any amount of USDC (slippage = 100%)
      path,
      wallet.address,
      deadline,
      { value: amountIn, gasPrice }
    );
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[FaroSwap] Swap to USDC completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[FaroSwap] Swap failed: ${error.message}`);
    throw error;
  }
}

async function swapToPhrs(wallet) {
  const routerContract = new ethers.Contract(router, FAROSWAP_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[FaroSwap] No USDC balance to swap');
      return null;
    }
    
    const amountIn = balance / 2n; // Swap half
    const path = [usdc, wphrs];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    logger.info(`[FaroSwap] Approving USDC...`);
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, amountIn, { gasPrice });
    await approveTx.wait();
    
    logger.info(`[FaroSwap] Swapping USDC to PHRS...`);
    const tx = await routerContract.swapExactTokensForETH(
      amountIn,
      0,
      path,
      wallet.address,
      deadline,
      { gasPrice }
    );
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[FaroSwap] Swap to PHRS completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[FaroSwap] Swap failed: ${error.message}`);
    throw error;
  }
}

async function addLiquidity(wallet) {
  const routerContract = new ethers.Contract(router, FAROSWAP_ROUTER_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    if (usdcBalance === 0n) {
      logger.warn('[FaroSwap] No USDC balance for liquidity');
      return null;
    }
    
    const amountToken = usdcBalance / 4n;
    const amountETH = ethers.parseEther(randomFloat(0.001, 0.003).toString());
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    logger.info('[FaroSwap] Approving USDC for liquidity...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(router, amountToken, { gasPrice });
    await approveTx.wait();
    
    logger.info('[FaroSwap] Adding liquidity...');
    const tx = await routerContract.addLiquidityETH(
      usdc,
      amountToken,
      0,
      0,
      wallet.address,
      deadline,
      { value: amountETH, gasPrice }
    );
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[FaroSwap] Liquidity added!');
    
    return receipt;
  } catch (error) {
    logger.error(`[FaroSwap] Add liquidity failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet, action) {
  switch (action) {
    case 'swapToUsdc':
      return await swapToUsdc(wallet);
    case 'swapToPhrs':
      return await swapToPhrs(wallet);
    case 'addLiquidity':
      return await addLiquidity(wallet);
    default:
      return await swapToUsdc(wallet);
  }
}

module.exports = { run, swapToUsdc, swapToPhrs, addLiquidity };
