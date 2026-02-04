const { ethers } = require('ethers');
const config = require('../config.json');
const logger = require('../utils/logger');
const { getGasPrice } = require('../utils/wallet');
const { ZENITH_LENDING_ABI, ERC20_ABI } = require('../utils/abis');

const zenith = config.contracts.zenith_lending;
const usdc = config.contracts.usdc;

async function supply(wallet) {
  const contract = new ethers.Contract(zenith, ZENITH_LENDING_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Zenith] No USDC balance to supply');
      return null;
    }
    
    const amount = balance / 10n;
    
    logger.info('[Zenith] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(zenith, amount, { gasPrice });
    await approveTx.wait();
    
    logger.info('[Zenith] Supplying USDC...');
    const tx = await contract.supply(usdc, amount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Zenith] Supply completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Zenith] Supply failed: ${error.message}`);
    throw error;
  }
}

async function borrow(wallet) {
  const contract = new ethers.Contract(zenith, ZENITH_LENDING_ABI, wallet);
  
  try {
    // Get user account data to check available borrow
    const accountData = await contract.getUserAccountData(wallet.address);
    const availableBorrow = accountData.availableBorrow || accountData[2];
    
    if (availableBorrow === 0n) {
      logger.warn('[Zenith] No available borrow amount');
      return null;
    }
    
    const borrowAmount = availableBorrow / 2n; // Borrow half of available
    
    logger.info(`[Zenith] Borrowing USDC...`);
    const gasPrice = await getGasPrice();
    const tx = await contract.borrow(usdc, borrowAmount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Zenith] Borrow completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Zenith] Borrow failed: ${error.message}`);
    throw error;
  }
}

async function repay(wallet) {
  const contract = new ethers.Contract(zenith, ZENITH_LENDING_ABI, wallet);
  const usdcContract = new ethers.Contract(usdc, ERC20_ABI, wallet);
  
  try {
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance === 0n) {
      logger.warn('[Zenith] No USDC balance to repay');
      return null;
    }
    
    // Get user debt
    const accountData = await contract.getUserAccountData(wallet.address);
    const totalDebt = accountData.totalDebt || accountData[1];
    
    if (totalDebt === 0n) {
      logger.warn('[Zenith] No debt to repay');
      return null;
    }
    
    const repayAmount = balance < totalDebt ? balance : totalDebt;
    
    logger.info('[Zenith] Approving USDC...');
    const gasPrice = await getGasPrice();
    const approveTx = await usdcContract.approve(zenith, repayAmount, { gasPrice });
    await approveTx.wait();
    
    logger.info('[Zenith] Repaying USDC...');
    const tx = await contract.repay(usdc, repayAmount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Zenith] Repay completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Zenith] Repay failed: ${error.message}`);
    throw error;
  }
}

async function withdraw(wallet) {
  const contract = new ethers.Contract(zenith, ZENITH_LENDING_ABI, wallet);
  
  try {
    // Get user account data to check collateral
    const accountData = await contract.getUserAccountData(wallet.address);
    const totalCollateral = accountData.totalCollateral || accountData[0];
    
    if (totalCollateral === 0n) {
      logger.warn('[Zenith] No collateral to withdraw');
      return null;
    }
    
    const withdrawAmount = totalCollateral / 4n; // Withdraw 25%
    
    logger.info('[Zenith] Withdrawing USDC...');
    const gasPrice = await getGasPrice();
    const tx = await contract.withdraw(usdc, withdrawAmount, { gasPrice });
    
    const receipt = await tx.wait();
    logger.tx(receipt.hash);
    logger.success('[Zenith] Withdraw completed!');
    
    return receipt;
  } catch (error) {
    logger.error(`[Zenith] Withdraw failed: ${error.message}`);
    throw error;
  }
}

async function run(wallet, action) {
  switch (action) {
    case 'supply':
      return await supply(wallet);
    case 'borrow':
      return await borrow(wallet);
    case 'repay':
      return await repay(wallet);
    case 'withdraw':
      return await withdraw(wallet);
    default:
      return await supply(wallet);
  }
}

module.exports = { run, supply, borrow, repay, withdraw };
