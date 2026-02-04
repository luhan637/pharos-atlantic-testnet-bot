const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams, getBalance } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { BITVERSE_ABI, ERC20_ABI } = require('../utils/abis');

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

const bitverseSwap = async (walletData, tokenIn, tokenOut, amountIn) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, 'Performing Bitverse swap...');
        const contract = new ethers.Contract(config.contracts.bitverse, BITVERSE_ABI, wallet);
        
        const amount = ethers.parseUnits(amountIn.toString(), 18);
        await approveToken(wallet, tokenIn, config.contracts.bitverse, amount);
        
        const minAmountOut = (amount * 95n) / 100n; // 5% slippage
        
        const tx = await contract.swap(tokenIn, tokenOut, amount, minAmountOut, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, 'Bitverse swap completed!');
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Bitverse swap failed: ${error.message}`);
    }
    return false;
};

const bitverseDeposit = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, 'Depositing to Bitverse...');
        const contract = new ethers.Contract(config.contracts.bitverse, BITVERSE_ABI, wallet);
        
        const depositAmount = ethers.parseUnits(amount.toString(), 18);
        await approveToken(wallet, tokenAddress, config.contracts.bitverse, depositAmount);
        
        const tx = await contract.deposit(tokenAddress, depositAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Deposited ${amount} tokens to Bitverse!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Bitverse deposit failed: ${error.message}`);
    }
    return false;
};

const openPosition = async (walletData, tokenAddress, amount, isLong, leverage) => {
    const { index, wallet, address } = walletData;
    try {
        const positionType = isLong ? 'LONG' : 'SHORT';
        logger.info(index, `Opening ${positionType} position with ${leverage}x leverage...`);
        const contract = new ethers.Contract(config.contracts.bitverse, BITVERSE_ABI, wallet);
        
        const positionAmount = ethers.parseUnits(amount.toString(), 18);
        
        const tx = await contract.openPosition(tokenAddress, positionAmount, isLong, leverage, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `${positionType} position opened!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Open position failed: ${error.message}`);
    }
    return false;
};

const closePosition = async (walletData, positionId) => {
    const { index, wallet } = walletData;
    try {
        logger.info(index, `Closing position #${positionId}...`);
        const contract = new ethers.Contract(config.contracts.bitverse, BITVERSE_ABI, wallet);
        
        const tx = await contract.closePosition(positionId, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Position #${positionId} closed!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Close position failed: ${error.message}`);
    }
    return false;
};

const runBitverse = async () => {
    logger.banner('PHAROS Bitverse Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Deposit USDC
        await bitverseDeposit(walletData, config.contracts.usdc, 1);
        await randomDelay();
        
        // Open long position
        await openPosition(walletData, config.contracts.wphrs, 0.5, true, 2);
        await randomDelay();
        
        // Open short position
        await openPosition(walletData, config.contracts.wphrs, 0.5, false, 2);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Bitverse Complete!');
};

module.exports = { bitverseSwap, bitverseDeposit, openPosition, closePosition, runBitverse };

if (require.main === module) {
    runBitverse().catch(console.error);
}