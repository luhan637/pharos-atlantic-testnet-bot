const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams, getBalance } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');

const generateRandomAddress = () => {
    const randomBytes = ethers.randomBytes(20);
    return ethers.getAddress('0x' + Buffer.from(randomBytes).toString('hex'));
};

const transferETH = async (walletData, toAddress, amount) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, `Transferring ${amount} PHRS to ${toAddress.slice(0, 10)}...`);
        
        const balance = await getBalance(address);
        if (parseFloat(balance) < amount + 0.001) {
            logger.error(index, `Insufficient balance: ${balance} PHRS`);
            return false;
        }
        
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amount.toString()),
            ...getTxParams()
        });
        
        logger.info(index, `TX sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            logger.success(index, `Transferred ${amount} PHRS to ${toAddress.slice(0, 10)}...!`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Transfer failed: ${error.message}`);
    }
    return false;
};

const transferToRandom = async (walletData, amount) => {
    const randomAddress = generateRandomAddress();
    return await transferETH(walletData, randomAddress, amount);
};

const transferBetweenWallets = async (fromWallet, toWallet, amount) => {
    return await transferETH(fromWallet, toWallet.address, amount);
};

const runTransfer = async () => {
    logger.banner('PHAROS Transfer Module');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found.');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        
        // Random small transfer
        const randomAmount = (Math.random() * 0.0001 + 0.0001).toFixed(6);
        await transferToRandom(walletData, parseFloat(randomAmount));
        await randomDelay();
        
        console.log('');
    }
    
    logger.banner('Transfer Complete!');
};

module.exports = { transferETH, transferToRandom, transferBetweenWallets, runTransfer };

if (require.main === module) {
    runTransfer().catch(console.error);
}