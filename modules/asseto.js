const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { ASSETO_ABI, ERC20_ABI } = require('../utils/abis');

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

const assetoDeposit = async (walletData, tokenAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Depositing to Asseto...`);
        const contract = new ethers.Contract(config.contracts.asseto, ASSETO_ABI, wallet);
        
        const depositAmount = ethers.parseUnits(amount.toString(), 18);
        await approveToken(wallet, tokenAddress, config.contracts.asseto, depositAmount);
        
        const tx = await contract.deposit(tokenAddress, depositAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Deposited ${amount} tokens to Asseto!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Asseto deposit failed: ${error.message}`);
    }
    return false;
};

const subscribe = async (walletData, planId, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Subscribing to plan #${planId}...`);
        const contract = new ethers.Contract(config.contracts.asseto, ASSETO_ABI, wallet);
        
        const subscribeAmount = ethers.parseUnits(amount.toString(), 18);
        
        const tx = await contract.subscribe(planId, subscribeAmount, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Subscribed to plan #${planId} with ${amount} tokens!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Subscribe failed: ${error.message}`);
    }
    return false;
};

const redeem = async (walletData, subscriptionId) => {
    const { index, wallet } = walletData;
    try {
        logger.info(index, `Redeeming subscription #${subscriptionId}...`);
        const contract = new ethers.Contract(config.contracts.asseto, ASSETO_ABI, wallet);
        
        const tx = await contract.redeem(subscriptionId, getTxParams());
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            logger.success(index, `Subscription #${subscriptionId} redeemed!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Redeem failed: ${error.message}`);
    }
    return false;
};

const runAsseto = async () => {
    logger.banner('PHAROS Asseto Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Deposit USDC
        await assetoDeposit(walletData, config.contracts.usdc, 1);
        await randomDelay();
        
        // Subscribe to plan 1
        await subscribe(walletData, 1, 0.5);
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Asseto Complete!');
};

module.exports = { assetoDeposit, subscribe, redeem, runAsseto };

if (require.main === module) {
    runAsseto().catch(console.error);
}