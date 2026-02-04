const chalk = require('chalk');

const logger = {
    info: (wallet, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` [Wallet ${wallet}]`) + chalk.white(` ${message}`));
    },
    success: (wallet, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` [Wallet ${wallet}]`) + chalk.green(` ✓ ${message}`));
    },
    error: (wallet, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` [Wallet ${wallet}]`) + chalk.red(` ✗ ${message}`));
    },
    warning: (wallet, message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` [Wallet ${wallet}]`) + chalk.yellow(` ⚠ ${message}`));
    },
    tx: (wallet, txHash) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` [Wallet ${wallet}]`) + chalk.magenta(` TX: https://testnet.pharosscan.xyz/tx/${txHash}`));
    },
    banner: (text) => {
        console.log(chalk.cyan('═'.repeat(60)));
        console.log(chalk.cyan.bold(text));
        console.log(chalk.cyan('═'.repeat(60)));
    }
};

module.exports = logger;