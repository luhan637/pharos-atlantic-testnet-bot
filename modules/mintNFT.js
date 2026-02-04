const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { GRANDLINE_NFT_ABI } = require('../utils/abis');

async function run(wallet) {
  const contract = new ethers.Contract(config.contracts.grandline_nft, GRANDLINE_NFT_ABI, wallet);
  
  try {
    logger.info('[MintNFT] Checking mint price...');
    
    let mintPrice;
    try {
      mintPrice = await contract.mintPrice();
    } catch {
      mintPrice = ethers.parseEther('0.001'); // Default mint price
    }
    
    logger.info(`[MintNFT] Mint price: ${ethers.formatEther(mintPrice)} PHRS`);
    
    const gasPrice = await getGasPrice();
    const tx = await contract.mint({ 
      value: mintPrice,
      gasPrice 
    });
    
    logger.info('[MintNFT] Sending mint transaction...');
    const receipt = await tx.wait();
    
    logger.tx(receipt.hash);
    logger.success('[MintNFT] NFT minted successfully!');
    
    return receipt;
  } catch (error) {
    logger.error(`[MintNFT] Failed: ${error.message}`);
    throw error;
  }
}

module.exports = { run };
