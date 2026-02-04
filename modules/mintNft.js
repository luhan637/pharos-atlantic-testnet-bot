const { ethers } = require('ethers');
const config = require('../config.json');
const { loadWallets, getTxParams, getBalance } = require('../utils/wallet');
const { randomDelay } = require('../utils/delay');
const logger = require('../utils/logger');
const { GRANDLINE_ABI } = require('../utils/abis');

const mintGrandlineNFT = async (walletData) => {
    const { index, wallet, address } = walletData;
    try {
        logger.info(index, 'Minting Grandline NFT...');
        const contract = new ethers.Contract(config.contracts.grandline, GRANDLINE_ABI, wallet);
        
        // Get mint price
        let mintPrice;
        try {
            mintPrice = await contract.mintPrice();
            logger.info(index, `Mint price: ${ethers.formatEther(mintPrice)} PHRS`);
        } catch {
            mintPrice = ethers.parseEther('0.001'); // Default price
        }
        
        // Check balance
        const balance = await getBalance(address);
        if (parseFloat(balance) < parseFloat(ethers.formatEther(mintPrice)) + 0.001) {
            logger.error(index, `Insufficient balance: ${balance} PHRS`);
            return false;
        }
        
        const txParams = {
            ...getTxParams(),
            value: mintPrice
        };
        
        const tx = await contract.mint(txParams);
        logger.info(index, `TX sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            const nftBalance = await contract.balanceOf(address);
            logger.success(index, `Grandline NFT minted! Total owned: ${nftBalance.toString()}`);
            logger.tx(index, tx.hash);
            return true;
        }
    } catch (error) {
        logger.error(index, `Mint failed: ${error.message}`);
    }
    return false;
};

const runMintNFT = async () => {
    logger.banner('PHAROS Mint NFT Module (Grandline)');
    const wallets = loadWallets();
    
    if (wallets.length === 0) {
        console.log('No wallets found. Please add private keys to privateKeys.txt');
        return;
    }
    
    console.log(`Loaded ${wallets.length} wallet(s)\n`);
    
    for (const walletData of wallets) {
        logger.info(walletData.index, `Address: ${walletData.address}`);
        await mintGrandlineNFT(walletData);
        await randomDelay();
        console.log('');
    }
    
    logger.banner('Mint NFT Complete!');
};

module.exports = { mintGrandlineNFT, runMintNFT };

if (require.main === module) {
    runMintNFT().catch(console.error);
}