const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('./logger');

const provider = new ethers.JsonRpcProvider(config.rpc.url);

const loadWallets = async () => {
  const walletsPath = path.join(__dirname, '..', 'wallets.txt');
  
  if (!fs.existsSync(walletsPath)) {
    fs.writeFileSync(walletsPath, '# Add private keys here, one per line\n');
    logger.warn('Created wallets.txt file. Please add your private keys.');
    return [];
  }
  
  const content = fs.readFileSync(walletsPath, 'utf8');
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  const wallets = [];
  for (const pk of lines) {
    try {
      const wallet = new ethers.Wallet(pk, provider);
      wallets.push(wallet);
    } catch (error) {
      logger.error(`Invalid private key: ${pk.substring(0, 10)}...`);
    }
  }
  
  return wallets;
};

const getWalletInfo = async (wallet) => {
  const balance = await provider.getBalance(wallet.address);
  return {
    address: wallet.address,
    balance: ethers.formatEther(balance),
    balanceWei: balance
  };
};

const getProvider = () => provider;

const getGasPrice = async () => {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
  return BigInt(Math.floor(Number(gasPrice) * config.settings.gasMultiplier));
};

module.exports = { loadWallets, getWalletInfo, getProvider, getGasPrice, provider };
