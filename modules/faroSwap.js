const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams, getBalance, getTokenBalance } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { FARO_ROUTER_ABI, ERC20_ABI } = require('../utils/abis');

const approveToken = async (wallet, tokenAddress, spenderAddress, amount) => {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    const allowance = await token.allowance(wallet.address, spenderAddress);
    if (allowance < amount) {
        const tx = await token.approve(spenderAddress, ethers.MaxUint256, getTxParams());
        await tx.wait();
        return true;
    }
    return false;
};

const swapETHForTokens = async (walletData, tokenAddress, amountETH) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Swapping ${amountETH} PHRS for tokens...`);
        const router = new ethers.Contract(config.contracts.faroRouter, FARO_ROUTER_ABI, wallet);
        const weth = await router.WETH();
        
        const path = [weth, tokenAddress];
        const deadline = Math.floor(Date.now() / 1000) + 1200;
        const amountIn = ethers.parseEther(amountETH.toString());
        
        const amounts = await router.getAmountsOut(amountIn, path);
        const minAmountOut = (amounts[1] * 95n) / 100n; // 5% slippage
        
        const tx = await router.swapExactETHForTokens(
            minAmountOut,
            path,
            address,
            deadline,
            { ...getTxParams(), value: amountIn }
        );
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, `Swap completed! Received ${ethers.formatUnits(amounts[1], 18)} tokens`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Swap failed: ${error.message}`);
    }
    return false;
};

const swapTokensForETH = async (walletData, tokenAddress, amountToken) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Swapping tokens for PHRS...`);
        const router = new ethers.Contract(config.contracts.faroRouter, FARO_ROUTER_ABI, wallet);
        const weth = await router.WETH();
        
        const amountIn = ethers.parseUnits(amountToken.toString(), 18);
        await approveToken(wallet, tokenAddress, config.contracts.faroRouter, amountIn);
        
        const path = [tokenAddress, weth];
        const deadline = Math.floor(Date.now() / 1000) + 1200;
        
        const amounts = await router.getAmountsOut(amountIn, path);
        const minAmountOut = (amounts[1] * 95n) / 100n;
        
        const tx = await router.swapExactTokensForETH(
            amountIn,
            minAmountOut,
            path,
            address,
            deadline,
            getTxParams()
        );
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, `Swap completed! Received ${ethers.formatEther(amounts[1])} PHRS`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Swap failed: ${error.message}`);
    }
    return false;
};

const addLiquidityETH = async (walletData, tokenAddress, amountToken, amountETH) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Adding liquidity...`);
        const router = new ethers.Contract(config.contracts.faroRouter, FARO_ROUTER_ABI, wallet);
        
        const tokenAmount = ethers.parseUnits(amountToken.toString(), 18);
        const ethAmount = ethers.parseEther(amountETH.toString());
        
        await approveToken(wallet, tokenAddress, config.contracts.faroRouter, tokenAmount);
        
        const deadline = Math.floor(Date.now() / 1000) + 1200;
        const minTokenAmount = (tokenAmount * 95n) / 100n;
        const minEthAmount = (ethAmount * 95n) / 100n;
        
        const tx = await router.addLiquidityETH(
            tokenAddress,
            tokenAmount,
            minTokenAmount,
            minEthAmount,
            address,
            deadline,
            { ...getTxParams(), value: ethAmount }
        );
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, 'Liquidity added successfully!');
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Add liquidity failed: ${error.message}`);
    }
    return false;
};

const runFaroSwap = async () => {
    logger.banner('PHAROS FaroSwap Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Swap 0.001 PHRS for USDC
        await swapETHForTokens(walletData, config.contracts.usdc, 0.001);
        await randomDelay();
        
        // Add liquidity with small amounts
        await addLiquidityETH(walletData, config.contracts.usdc, 0.5, 0.0005);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('FaroSwap Complete!');
};

module.exports = { swapETHForTokens, swapTokensForETH, addLiquidityETH, runFaroSwap };

if (require.main === module) {
    runFaroSwap().catch(console.error);
}