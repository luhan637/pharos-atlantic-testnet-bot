const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { ZENITH_ABI, ERC20_ABI } = require('../utils/abis');

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

const supply = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Supplying to Zenith Lending...`);
        const contract = new ethers.Contract(config.contracts.zenithLending, ZENITH_ABI, wallet);
        
        const supplyAmount = ethers.parseUnits(amount.toString(), 18);
        await approveToken(wallet, tokenAddress, config.contracts.zenithLending, supplyAmount);
        
        const tx = await contract.supply(tokenAddress, supplyAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Supplied ${amount} tokens to Zenith!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Supply failed: ${error.message}`);
    }
    return false;
};

const borrow = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Borrowing from Zenith Lending...`);
        const contract = new ethers.Contract(config.contracts.zenithLending, ZENITH_ABI, wallet);
        
        // Check health factor first
        const healthFactor = await contract.getHealthFactor(address);
        if (healthFactor < ethers.parseEther('1.1')) {
            logger.warning(index, 'Health factor too low to borrow');
            return false;
        }
        
        const borrowAmount = ethers.parseUnits(amount.toString(), 18);
        
        const tx = await contract.borrow(tokenAddress, borrowAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Borrowed ${amount} tokens from Zenith!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Borrow failed: ${error.message}`);
    }
    return false;
};

const repay = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Repaying to Zenith Lending...`);
        const contract = new ethers.Contract(config.contracts.zenithLending, ZENITH_ABI, wallet);
        
        const repayAmount = ethers.parseUnits(amount.toString(), 18);
        await approveToken(wallet, tokenAddress, config.contracts.zenithLending, repayAmount);
        
        const tx = await contract.repay(tokenAddress, repayAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Repaid ${amount} tokens to Zenith!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Repay failed: ${error.message}`);
    }
    return false;
};

const withdraw = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Withdrawing from Zenith Lending...`);
        const contract = new ethers.Contract(config.contracts.zenithLending, ZENITH_ABI, wallet);
        
        const withdrawAmount = ethers.parseUnits(amount.toString(), 18);
        
        const tx = await contract.withdraw(tokenAddress, withdrawAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Withdrew ${amount} tokens from Zenith!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Withdraw failed: ${error.message}`);
    }
    return false;
};

const runZenithLending = async () => {
    logger.banner('PHAROS Zenith Lending Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Supply USDC
        await supply(walletData, config.contracts.usdc, 1);
        await randomDelay();
        
        // Borrow small amount
        await borrow(walletData, config.contracts.usdt, 0.5);
        await randomDelay();
        
        // Repay
        await repay(walletData, config.contracts.usdt, 0.5);
        await randomDelay();
        
        // Withdraw
        await withdraw(walletData, config.contracts.usdc, 0.5);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Zenith Lending Complete!');
};

module.exports = { supply, borrow, repay, withdraw, runZenithLending };

if (require.main === module) {
    runZenithLending().catch(console.error);
}