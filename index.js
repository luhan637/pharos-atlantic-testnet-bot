import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract addresses
const USDT_CONTRACT_ADDRESS = "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5";
const CASH_CONTRACT_ADDRESS = "0x56f4add11d723412D27A9e9433315401B351d6E3";
const WPHRS_CONTRACT_ADDRESS = "0x838800b758277cc111b2d48ab01e5e164f8e9471";
const DODO_PROXY_ADDRESS = "0x819829e5CF6e19F9fED92F6b4CC1edDF45a2cC4A2";
const ROUTER_ADDRESS = "0xb93Cd1E38809607a00FF9CaB633db5CAA6130dD0";
const PAIR_ADDRESS = "0xd7a53400494cfdd71daf5aff8bd19d8e7efd62b4";

// ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// Router ABI
const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function WETH() external view returns (address)"
];

// DODO Proxy ABI
const DODO_PROXY_ABI = [
  "function dodoSwapV2ETHToToken(address toToken, uint256 minReturnAmount, address[] calldata dodoPairs, uint256 directions, bool isIncentive, uint256 deadline) external payable returns (uint256 returnAmount)",
  "function dodoSwapV2TokenToETH(address fromToken, uint256 fromTokenAmount, uint256 minReturnAmount, address[] calldata dodoPairs, uint256 directions, bool isIncentive, uint256 deadline) external returns (uint256 returnAmount)",
  "function dodoSwapV2TokenToToken(address fromToken, address toToken, uint256 fromTokenAmount, uint256 minReturnAmount, address[] calldata dodoPairs, uint256 directions, bool isIncentive, uint256 deadline) external returns (uint256 returnAmount)"
];

// Pair ABI for reserves
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// Load config
function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  return {
    privateKeys: [],
    rpcUrl: "https://testnet.dplabs-internal.com",
    delayBetweenWallets: 5000,
    swapCount: 5,
    swapAmountMin: 0.0001,
    swapAmountMax: 0.001,
    lpAmountMin: 0.0001,
    lpAmountMax: 0.0005,
    lpCount: 1
  };
}

// Save config
function saveConfig(config) {
  const configPath = path.join(__dirname, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomAmount(min, max) {
  return Math.random() * (max - min) + min;
}

function shortenAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function formatDate() {
  return new Date().toLocaleString();
}

// Get DODO quote
async function getDodoQuote(fromToken, toToken, amount, provider) {
  try {
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    
    let reserveIn, reserveOut;
    if (fromToken.toLowerCase() === token0.toLowerCase()) {
      reserveIn = reserve0;
      reserveOut = reserve1;
    } else {
      reserveIn = reserve1;
      reserveOut = reserve0;
    }
    
    const amountInWithFee = amount * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;
    
    return amountOut;
  } catch (error) {
    console.error("Error getting DODO quote:", error.message);
    return 0n;
  }
}

// Perform FaroSwap
async function performFarosSwap(wallet, config, logFn) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  
  const swapAmount = ethers.parseEther(
    getRandomAmount(config.swapAmountMin, config.swapAmountMax).toFixed(6)
  );
  
  logFn(`[SWAP] Wallet: ${shortenAddress(signer.address)}`);
  logFn(`[SWAP] Amount: ${ethers.formatEther(swapAmount)} PHRS`);
  
  try {
    // Swap PHRS -> USDT
    const pathToUsdt = [WPHRS_CONTRACT_ADDRESS, USDT_CONTRACT_ADDRESS];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    const amountsOut = await router.getAmountsOut(swapAmount, pathToUsdt);
    const minAmountOut = amountsOut[1] * 95n / 100n; // 5% slippage
    
    logFn(`[SWAP] Expected USDT: ${ethers.formatUnits(amountsOut[1], 6)}`);
    
    const tx = await router.swapExactETHForTokens(
      minAmountOut,
      pathToUsdt,
      signer.address,
      deadline,
      { value: swapAmount }
    );
    
    logFn(`[SWAP] TX sent: ${tx.hash}`);
    const receipt = await tx.wait();
    logFn(`[SWAP] Confirmed in block: ${receipt.blockNumber}`);
    
    return { success: true, hash: tx.hash };
  } catch (error) {
    logFn(`[SWAP] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Perform Add Liquidity
async function performAddLp(wallet, config, logFn) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  const usdt = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, signer);
  
  const lpAmount = ethers.parseEther(
    getRandomAmount(config.lpAmountMin, config.lpAmountMax).toFixed(6)
  );
  
  logFn(`[LP] Wallet: ${shortenAddress(signer.address)}`);
  logFn(`[LP] Amount: ${ethers.formatEther(lpAmount)} PHRS`);
  
  try {
    // First swap some PHRS to USDT
    const pathToUsdt = [WPHRS_CONTRACT_ADDRESS, USDT_CONTRACT_ADDRESS];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    const amountsOut = await router.getAmountsOut(lpAmount, pathToUsdt);
    const minAmountOut = amountsOut[1] * 95n / 100n;
    
    const swapTx = await router.swapExactETHForTokens(
      minAmountOut,
      pathToUsdt,
      signer.address,
      deadline,
      { value: lpAmount }
    );
    await swapTx.wait();
    logFn(`[LP] Swap complete: ${swapTx.hash}`);
    
    // Check USDT balance
    const usdtBalance = await usdt.balanceOf(signer.address);
    logFn(`[LP] USDT Balance: ${ethers.formatUnits(usdtBalance, 6)}`);
    
    // Approve USDT for router
    const allowance = await usdt.allowance(signer.address, ROUTER_ADDRESS);
    if (allowance < usdtBalance) {
      const approveTx = await usdt.approve(ROUTER_ADDRESS, ethers.MaxUint256);
      await approveTx.wait();
      logFn(`[LP] USDT Approved`);
    }
    
    // Add liquidity
    const usdtForLp = usdtBalance / 2n;
    const ethForLp = lpAmount / 2n;
    
    const addLpTx = await router.addLiquidityETH(
      USDT_CONTRACT_ADDRESS,
      usdtForLp,
      0,
      0,
      signer.address,
      deadline,
      { value: ethForLp }
    );
    
    logFn(`[LP] TX sent: ${addLpTx.hash}`);
    const receipt = await addLpTx.wait();
    logFn(`[LP] Confirmed in block: ${receipt.blockNumber}`);
    
    return { success: true, hash: addLpTx.hash };
  } catch (error) {
    logFn(`[LP] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Create blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: "PHAROS Atlantic Testnet Bot"
});

// Header box
const headerBox = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: 8,
  content: "",
  tags: true,
  style: {
    fg: "cyan"
  }
});

// Set banner
const banner = figlet.textSync("PHAROS BOT", { font: "Standard" });
headerBox.setContent("{cyan-fg}" + banner + "{/cyan-fg}");

// Menu box
const menuBox = blessed.box({
  top: 8,
  left: 0,
  width: "30%",
  height: "100%-8",
  label: " Menu ",
  border: { type: "line" },
  style: {
    border: { fg: "cyan" },
    focus: { border: { fg: "yellow" } }
  }
});

// Menu list
const menuList = blessed.list({
  parent: menuBox,
  top: 0,
  left: 0,
  width: "100%-2",
  height: "100%-2",
  keys: true,
  mouse: true,
  style: {
    selected: { bg: "cyan", fg: "black" },
    item: { fg: "white" }
  },
  items: [
    "1. Run FaroSwap",
    "2. Run Add LP",
    "3. Run All Tasks",
    "4. Config Settings",
    "5. View Wallets",
    "6. Exit"
  ]
});

// Log box
const logBox = blessed.box({
  top: 8,
  left: "30%",
  width: "70%",
  height: "100%-8",
  label: " Log ",
  border: { type: "line" },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: " ",
    style: { bg: "cyan" }
  },
  style: {
    border: { fg: "cyan" }
  }
});

// Log text
const logText = blessed.log({
  parent: logBox,
  top: 0,
  left: 0,
  width: "100%-2",
  height: "100%-2",
  tags: true,
  scrollable: true
});

// Log function
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logText.log(`{gray-fg}[${timestamp}]{/gray-fg} ${message}`);
  screen.render();
}

// Config form
function showConfigForm() {
  const config = loadConfig();
  
  const form = blessed.form({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: "70%",
    label: " Configuration ",
    border: { type: "line" },
    keys: true,
    style: {
      border: { fg: "yellow" }
    }
  });
  
  let yPos = 1;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "RPC URL:",
    style: { fg: "white" }
  });
  
  const rpcInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: "60%",
    height: 1,
    value: config.rpcUrl || "",
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "Swap Count:",
    style: { fg: "white" }
  });
  
  const swapCountInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 10,
    height: 1,
    value: String(config.swapCount || 5),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "Swap Min:",
    style: { fg: "white" }
  });
  
  const swapMinInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 15,
    height: 1,
    value: String(config.swapAmountMin || 0.0001),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "Swap Max:",
    style: { fg: "white" }
  });
  
  const swapMaxInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 15,
    height: 1,
    value: String(config.swapAmountMax || 0.001),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "LP Count:",
    style: { fg: "white" }
  });
  
  const lpCountInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 10,
    height: 1,
    value: String(config.lpCount || 1),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "LP Min:",
    style: { fg: "white" }
  });
  
  const lpMinInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 15,
    height: 1,
    value: String(config.lpAmountMin || 0.0001),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "LP Max:",
    style: { fg: "white" }
  });
  
  const lpMaxInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 15,
    height: 1,
    value: String(config.lpAmountMax || 0.0005),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 2;
  
  blessed.text({
    parent: form,
    top: yPos,
    left: 2,
    content: "Delay (ms):",
    style: { fg: "white" }
  });
  
  const delayInput = blessed.textbox({
    parent: form,
    top: yPos,
    left: 15,
    width: 10,
    height: 1,
    value: String(config.delayBetweenWallets || 5000),
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  yPos += 3;
  
  const saveBtn = blessed.button({
    parent: form,
    top: yPos,
    left: 2,
    width: 10,
    height: 1,
    content: " Save ",
    style: {
      fg: "black",
      bg: "green",
      focus: { bg: "cyan" }
    }
  });
  
  const cancelBtn = blessed.button({
    parent: form,
    top: yPos,
    left: 15,
    width: 10,
    height: 1,
    content: " Cancel ",
    style: {
      fg: "black",
      bg: "red",
      focus: { bg: "cyan" }
    }
  });
  
  saveBtn.on("press", () => {
    const newConfig = {
      ...config,
      rpcUrl: rpcInput.getValue() || config.rpcUrl,
      swapCount: parseInt(swapCountInput.getValue()) || config.swapCount,
      swapAmountMin: parseFloat(swapMinInput.getValue()) || config.swapAmountMin,
      swapAmountMax: parseFloat(swapMaxInput.getValue()) || config.swapAmountMax,
      lpCount: parseInt(lpCountInput.getValue()) || config.lpCount,
      lpAmountMin: parseFloat(lpMinInput.getValue()) || config.lpAmountMin,
      lpAmountMax: parseFloat(lpMaxInput.getValue()) || config.lpAmountMax,
      delayBetweenWallets: parseInt(delayInput.getValue()) || config.delayBetweenWallets
    };
    saveConfig(newConfig);
    log("{green-fg}Configuration saved!{/green-fg}");
    form.destroy();
    screen.render();
  });
  
  cancelBtn.on("press", () => {
    form.destroy();
    screen.render();
  });
  
  form.key(["escape"], () => {
    form.destroy();
    screen.render();
  });
  
  rpcInput.focus();
  screen.render();
}

// Add wallet form
function showAddWalletForm() {
  const form = blessed.form({
    parent: screen,
    top: "center",
    left: "center",
    width: "60%",
    height: 10,
    label: " Add Wallet ",
    border: { type: "line" },
    keys: true,
    style: {
      border: { fg: "yellow" }
    }
  });
  
  blessed.text({
    parent: form,
    top: 1,
    left: 2,
    content: "Private Key:",
    style: { fg: "white" }
  });
  
  const pkInput = blessed.textbox({
    parent: form,
    top: 1,
    left: 15,
    width: "70%",
    height: 1,
    censor: true,
    inputOnFocus: true,
    style: {
      fg: "white",
      bg: "black",
      focus: { bg: "blue" }
    }
  });
  
  const addBtn = blessed.button({
    parent: form,
    top: 4,
    left: 2,
    width: 10,
    height: 1,
    content: " Add ",
    style: {
      fg: "black",
      bg: "green",
      focus: { bg: "cyan" }
    }
  });
  
  const cancelBtn = blessed.button({
    parent: form,
    top: 4,
    left: 15,
    width: 10,
    height: 1,
    content: " Cancel ",
    style: {
      fg: "black",
      bg: "red",
      focus: { bg: "cyan" }
    }
  });
  
  addBtn.on("press", () => {
    const pk = pkInput.getValue().trim();
    if (pk) {
      try {
        const wallet = new ethers.Wallet(pk);
        const config = loadConfig();
        if (!config.privateKeys.includes(pk)) {
          config.privateKeys.push(pk);
          saveConfig(config);
          log(`{green-fg}Wallet added: ${shortenAddress(wallet.address)}{/green-fg}`);
        } else {
          log("{yellow-fg}Wallet already exists{/yellow-fg}");
        }
      } catch (e) {
        log("{red-fg}Invalid private key{/red-fg}");
      }
    }
    form.destroy();
    screen.render();
  });
  
  cancelBtn.on("press", () => {
    form.destroy();
    screen.render();
  });
  
  form.key(["escape"], () => {
    form.destroy();
    screen.render();
  });
  
  pkInput.focus();
  screen.render();
}

// View wallets
function showWalletsView() {
  const config = loadConfig();
  const wallets = config.privateKeys.map(pk => {
    try {
      const wallet = new ethers.Wallet(pk);
      return wallet.address;
    } catch {
      return "Invalid";
    }
  });
  
  const box = blessed.box({
    parent: screen,
    top: "center",
    left: "center",
    width: "50%",
    height: "50%",
    label: " Wallets ",
    border: { type: "line" },
    scrollable: true,
    style: {
      border: { fg: "yellow" }
    }
  });
  
  const list = blessed.list({
    parent: box,
    top: 0,
    left: 0,
    width: "100%-2",
    height: "100%-4",
    keys: true,
    mouse: true,
    style: {
      selected: { bg: "cyan", fg: "black" },
      item: { fg: "white" }
    },
    items: wallets.length > 0 ? wallets.map((w, i) => `${i + 1}. ${w}`) : ["No wallets configured"]
  });
  
  const closeBtn = blessed.button({
    parent: box,
    bottom: 0,
    left: "center",
    width: 10,
    height: 1,
    content: " Close ",
    style: {
      fg: "black",
      bg: "red",
      focus: { bg: "cyan" }
    }
  });
  
  const addBtn = blessed.button({
    parent: box,
    bottom: 0,
    left: 2,
    width: 12,
    height: 1,
    content: " Add New ",
    style: {
      fg: "black",
      bg: "green",
      focus: { bg: "cyan" }
    }
  });
  
  addBtn.on("press", () => {
    box.destroy();
    showAddWalletForm();
  });
  
  closeBtn.on("press", () => {
    box.destroy();
    screen.render();
  });
  
  box.key(["escape"], () => {
    box.destroy();
    screen.render();
  });
  
  list.focus();
  screen.render();
}

// Run FaroSwap for all wallets
async function runFaroSwap() {
  const config = loadConfig();
  
  if (config.privateKeys.length === 0) {
    log("{red-fg}No wallets configured! Please add wallets first.{/red-fg}");
    return;
  }
  
  log("{cyan-fg}Starting FaroSwap...{/cyan-fg}");
  log(`Total wallets: ${config.privateKeys.length}`);
  log(`Swap count per wallet: ${config.swapCount}`);
  log("â".repeat(50));
  
  for (let w = 0; w < config.privateKeys.length; w++) {
    const pk = config.privateKeys[w];
    const wallet = { privateKey: pk };
    
    log(`\n{yellow-fg}Wallet ${w + 1}/${config.privateKeys.length}{/yellow-fg}`);
    
    for (let i = 0; i < config.swapCount; i++) {
      log(`\n{cyan-fg}Swap ${i + 1}/${config.swapCount}{/cyan-fg}`);
      await performFarosSwap(wallet, config, log);
      
      if (i < config.swapCount - 1) {
        log(`Waiting ${config.delayBetweenWallets / 1000}s...`);
        await sleep(config.delayBetweenWallets);
      }
    }
    
    if (w < config.privateKeys.length - 1) {
      log(`\nMoving to next wallet in ${config.delayBetweenWallets / 1000}s...`);
      await sleep(config.delayBetweenWallets);
    }
  }
  
  log("\n{green-fg}FaroSwap completed for all wallets!{/green-fg}");
}

// Run Add LP for all wallets
async function runAddLp() {
  const config = loadConfig();
  
  if (config.privateKeys.length === 0) {
    log("{red-fg}No wallets configured! Please add wallets first.{/red-fg}");
    return;
  }
  
  log("{cyan-fg}Starting Add Liquidity...{/cyan-fg}");
  log(`Total wallets: ${config.privateKeys.length}`);
  log(`LP count per wallet: ${config.lpCount}`);
  log("â".repeat(50));
  
  for (let w = 0; w < config.privateKeys.length; w++) {
    const pk = config.privateKeys[w];
    const wallet = { privateKey: pk };
    
    log(`\n{yellow-fg}Wallet ${w + 1}/${config.privateKeys.length}{/yellow-fg}`);
    
    for (let i = 0; i < config.lpCount; i++) {
      log(`\n{cyan-fg}LP ${i + 1}/${config.lpCount}{/cyan-fg}`);
      await performAddLp(wallet, config, log);
      
      if (i < config.lpCount - 1) {
        log(`Waiting ${config.delayBetweenWallets / 1000}s...`);
        await sleep(config.delayBetweenWallets);
      }
    }
    
    if (w < config.privateKeys.length - 1) {
      log(`\nMoving to next wallet in ${config.delayBetweenWallets / 1000}s...`);
      await sleep(config.delayBetweenWallets);
    }
  }
  
  log("\n{green-fg}Add Liquidity completed for all wallets!{/green-fg}");
}

// Run all tasks
async function runAllTasks() {
  log("{cyan-fg}Running all tasks...{/cyan-fg}");
  await runFaroSwap();
  log("\n" + "â".repeat(50) + "\n");
  await runAddLp();
  log("\n{green-fg}All tasks completed!{/green-fg}");
}

// Menu selection handler
menuList.on("select", async (item, index) => {
  switch (index) {
    case 0: // Run FaroSwap
      await runFaroSwap();
      break;
    case 1: // Run Add LP
      await runAddLp();
      break;
    case 2: // Run All Tasks
      await runAllTasks();
      break;
    case 3: // Config Settings
      showConfigForm();
      break;
    case 4: // View Wallets
      showWalletsView();
      break;
    case 5: // Exit
      process.exit(0);
      break;
  }
});

// Append elements to screen
screen.append(headerBox);
screen.append(menuBox);
screen.append(logBox);

// Key bindings
screen.key(["q", "C-c"], () => process.exit(0));
screen.key(["tab"], () => {
  if (menuList.focused) {
    logText.focus();
  } else {
    menuList.focus();
  }
  screen.render();
});

// Initial focus and render
menuList.focus();
log("{green-fg}PHAROS Atlantic Testnet Bot started!{/green-fg}");
log("Use arrow keys to navigate, Enter to select");
log("Press Tab to switch focus, Q to quit");
log("â".repeat(50));

screen.render();
