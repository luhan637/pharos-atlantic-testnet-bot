const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const logger = require('./logger');

const provider = new ethers.JsonRpcProvider(config.rpc.url);

const loadWallets = () => {
    const pkPath = path.join(__dirname, '..', 'privateKeys.txt');
    if (!fs.existsSync(pkPath)) {
        console.log('Creating privateKeys.txt template...');
        fs.writeFileSync(pkPath, '# Add your private keys here, one per line\n# Example:\n# 0x1234567890abcdef...');
        return [];
    }
    
    const content = fs.readFileSync(pkPath, 'utf-8');
    const keys = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.length === 66);
    
    return keys.map((pk, index) => {
        const wallet = new ethers.Wallet(pk, provider);
        return {
            index: index + 1,
            wallet,
            address: wallet.address
        };
    });
};

const getBalance = async (address) => {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
};

const getTokenBalance = async (tokenAddress, walletAddress) => {
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    return balance;
};

const getTxParams = () => ({
    gasLimit: config.settings.gasLimit,
    maxFeePerGas: BigInt(config.settings.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(config.settings.maxPriorityFeePerGas)
});

module.exports = { provider, loadWallets, getBalance, getTokenBalance, getTxParams };