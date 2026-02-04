const config = require('../config.json');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = async () => {
    const min = config.settings.delayMin || 5000;
    const max = config.settings.delayMax || 15000;
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    await delay(ms);
    return ms;
};

const countdown = async (seconds) => {
    for (let i = seconds; i > 0; i--) {
        process.stdout.write(`\rWaiting ${i} seconds...`);
        await delay(1000);
    }
    process.stdout.write('\r' + ' '.repeat(30) + '\r');
};

module.exports = { delay, randomDelay, countdown };