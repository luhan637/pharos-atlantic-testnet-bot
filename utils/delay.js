const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = async (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await delay(ms);
  return ms;
};

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min, max, decimals = 6) => {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
};

module.exports = { delay, randomDelay, randomInt, randomFloat };
