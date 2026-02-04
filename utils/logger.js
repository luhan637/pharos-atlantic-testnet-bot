const chalk = require('chalk');

const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const logger = {
  info: (msg) => {
    console.log(chalk.blue(`[${getTimestamp()}] [INFO] ${msg}`));
  },
  
  success: (msg) => {
    console.log(chalk.green(`[${getTimestamp()}] [SUCCESS] ${msg}`));
  },
  
  warn: (msg) => {
    console.log(chalk.yellow(`[${getTimestamp()}] [WARN] ${msg}`));
  },
  
  error: (msg) => {
    console.log(chalk.red(`[${getTimestamp()}] [ERROR] ${msg}`));
  },
  
  tx: (hash, explorer = 'https://testnet.pharosscan.xyz') => {
    console.log(chalk.magenta(`[${getTimestamp()}] [TX] ${explorer}/tx/${hash}`));
  }
};

module.exports = logger;
