import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONSTANTS ====================
const RPC_URL = "https://atlantic.dplabs-internal.com";
const API_BASE_URL = "https://api.pharosnetwork.xyz";
const DODO_API_BASE_URL = "https://api.dodoex.io/route-service/v2/widget/getdodoroute";
const CONFIG_FILE = "config.json";

// Contract addresses
const USDT_CONTRACT_ADDRESS = "0xE7E84B8B4f39C507499c40B4ac199B050e2882d5";
const CASH_CONTRACT_ADDRESS = "0x56f4add11d723412D27A9e9433315401B351d6E3";
const WPHRS_CONTRACT_ADDRESS = "0x838800b758277cc111b2d48ab01e5e164f8e9471";
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DODO_PROXY_ADDRESS = "0x819829e5CF6e19F9fED92F6b4CC1edDF45a2cC4A2";
const ROUTER_ADDRESS = "0xb93Cd1E38809607a00FF9CaB633db5CAA6130dD0";
const PAIR_ADDRESS = "0xd7a53400494cfdd71daf5aff8bd19d8e7efd62b4";

// ==================== ABIs ====================
const CONTRACT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function deposit() external payable",
  "function withdraw(uint256 amount) external"
];

const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// ==================== CONFIG ====================
let dailyActivityConfig = {
  sendPhrsRepetitions: 1,
  minSendAmount: 0.0001,
  maxSendAmount: 0.0002,
  swapRepetitions: 1,
  minUsdtSwapAmount: 0.001,
  maxUsdtSwapAmount: 0.003,
  minCashSwapAmount: 0.001,
  maxCashSwapAmount: 0.003,
  farosSwapRepetitions: 1,
  minPhrsSwapAmount: 0.0001,
  maxPhrsSwapAmount: 0.0002,
  minUsdtFarosSwapAmount: 0.004,
  maxUsdtFarosSwapAmount: 0.01,
  addLpRepetitions: 1,
  minAddLpAmount: 0.0001,
  maxAddLpAmount: 0.0003
};

// Global state
let wallets = [];
let proxies = [];
let walletAddresses = [];
let logs = [];
let isRunning = false;
let currentWalletIndex = 0;
let nonceMap = new Map();
let currentSubMenu = null;

// ==================== UTILITY FUNCTIONS ====================
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const config = JSON.parse(data);
      if (config.dailyActivityConfig) {
        dailyActivityConfig = { ...dailyActivityConfig, ...config.dailyActivityConfig };
      }
      return config;
    }
  } catch (error) {
    addLog(`Error loading config: ${error.message}`);
  }
  return {};
}

function saveConfig() {
  try {
    const config = { dailyActivityConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    addLog("Config saved successfully");
  } catch (error) {
    addLog(`Error saving config: ${error.message}`);
  }
}

function loadPrivateKeys() {
  try {
    const filePath = path.join(__dirname, "privateKeys.txt");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
      return [];
    }
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  } catch (error) {
    addLog(`Error loading private keys: ${error.message}`);
    return [];
  }
}

function loadProxies() {
  try {
    const filePath = path.join(__dirname, "proxies.txt");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
      return [];
    }
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  } catch (error) {
    addLog(`Error loading proxies: ${error.message}`);
    return [];
  }
}

function loadWalletAddresses() {
  try {
    const filePath = path.join(__dirname, "walletAddresses.txt");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
      return [];
    }
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  } catch (error) {
    addLog(`Error loading wallet addresses: ${error.message}`);
    return [];
  }
}

function createAgent(proxyUrl) {
  if (!proxyUrl) return null;
  try {
    if (proxyUrl.startsWith("socks")) {
      return new SocksProxyAgent(proxyUrl);
    }
    return new HttpsProxyAgent(proxyUrl);
  } catch (error) {
    addLog(`Error creating proxy agent: ${error.message}`);
    return null;
  }
}

function getProviderWithProxy(proxyUrl = null) {
  const fetchRequest = new ethers.FetchRequest(RPC_URL);
  fetchRequest.timeout = 30000;
  if (proxyUrl) {
    const agent = createAgent(proxyUrl);
    if (agent) {
      fetchRequest.getUrlFunc = ethers.FetchRequest.createGetUrlFunc({ agent });
    }
  }
  return new ethers.JsonRpcProvider(fetchRequest);
}

async function makeApiRequest(endpoint, method = "GET", data = null, token = null, proxy = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 30000
    };
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    if (proxy) {
      const agent = createAgent(proxy);
      if (agent) {
        config.httpsAgent = agent;
        config.httpAgent = agent;
      }
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getNextNonce(wallet, provider) {
  const address = wallet.address;
  if (!nonceMap.has(address)) {
    const nonce = await provider.getTransactionCount(address, "pending");
    nonceMap.set(address, nonce);
  }
  const nonce = nonceMap.get(address);
  nonceMap.set(address, nonce + 1);
  return nonce;
}

function resetNonce(address) {
  nonceMap.delete(address);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function formatAmount(amount, decimals = 4) {
  return parseFloat(amount.toFixed(decimals));
}

// ==================== CORE FUNCTIONS ====================
async function loginAccount(privateKey, proxy = null) {
  try {
    const provider = getProviderWithProxy(proxy);
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;
    
    // Get nonce for signing
    const message = `Welcome to Pharos Network!\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
    const signature = await wallet.signMessage(message);
    
    const response = await makeApiRequest("/user/login", "POST", {
      address,
      signature,
      message
    }, null, proxy);
    
    if (response && response.token) {
      addLog(`Logged in: ${address.slice(0, 8)}...${address.slice(-6)}`);
      return { wallet, token: response.token, provider };
    }
    
    return { wallet, token: null, provider };
  } catch (error) {
    addLog(`Login error: ${error.message}`);
    const provider = getProviderWithProxy(proxy);
    const wallet = new ethers.Wallet(privateKey, provider);
    return { wallet, token: null, provider };
  }
}

async function reportTransaction(token, txHash, type, proxy = null) {
  try {
    if (!token) return false;
    
    await makeApiRequest("/user/transaction", "POST", {
      hash: txHash,
      type
    }, token, proxy);
    
    addLog(`Reported tx: ${txHash.slice(0, 10)}... (${type})`);
    return true;
  } catch (error) {
    addLog(`Report error: ${error.message}`);
    return false;
  }
}

async function claimFaucetForAccount(wallet, token, provider, proxy = null) {
  try {
    addLog(`Claiming faucet for ${wallet.address.slice(0, 8)}...`);
    
    const response = await makeApiRequest("/faucet/claim", "POST", {
      address: wallet.address
    }, token, proxy);
    
    if (response && response.success) {
      addLog(`Faucet claimed successfully`);
      return true;
    }
    
    addLog(`Faucet claim: ${response?.message || "Already claimed"}`);
    return false;
  } catch (error) {
    addLog(`Faucet error: ${error.message}`);
    return false;
  }
}

async function approveToken(wallet, tokenAddress, spenderAddress, amount, provider) {
  try {
    const contract = new ethers.Contract(tokenAddress, CONTRACT_ABI, wallet);
    
    const currentAllowance = await contract.allowance(wallet.address, spenderAddress);
    if (currentAllowance >= amount) {
      return true;
    }
    
    const nonce = await getNextNonce(wallet, provider);
    const tx = await contract.approve(spenderAddress, ethers.MaxUint256, { nonce });
    addLog(`Approving... tx: ${tx.hash.slice(0, 10)}...`);
    
    await tx.wait();
    addLog("Approval confirmed");
    return true;
  } catch (error) {
    addLog(`Approve error: ${error.message}`);
    resetNonce(wallet.address);
    return false;
  }
}

async function getTokenBalance(wallet, tokenAddress, provider) {
  try {
    const contract = new ethers.Contract(tokenAddress, CONTRACT_ABI, provider);
    const balance = await contract.balanceOf(wallet.address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    return "0";
  }
}

async function performSubscribe(wallet, token, provider, proxy = null) {
  try {
    addLog(`Performing subscribe for ${wallet.address.slice(0, 8)}...`);
    
    const response = await makeApiRequest("/user/subscribe", "POST", {
      address: wallet.address
    }, token, proxy);
    
    if (response && response.success) {
      addLog("Subscribe successful");
      return true;
    }
    
    return false;
  } catch (error) {
    addLog(`Subscribe error: ${error.message}`);
    return false;
  }
}

async function performRedemption(wallet, token, provider, proxy = null) {
  try {
    addLog(`Performing redemption for ${wallet.address.slice(0, 8)}...`);
    
    const response = await makeApiRequest("/user/redeem", "POST", {
      address: wallet.address
    }, token, proxy);
    
    if (response && response.success) {
      addLog("Redemption successful");
      return true;
    }
    
    return false;
  } catch (error) {
    addLog(`Redemption error: ${error.message}`);
    return false;
  }
}

// ==================== SWAP FUNCTIONS ====================
async function getDodoQuote(fromToken, toToken, amount, slippage = 1, proxy = null) {
  try {
    const params = new URLSearchParams({
      chainId: "688688",
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount: amount.toString(),
      slippage: slippage.toString(),
      userAddr: "0x0000000000000000000000000000000000000000"
    });
    
    const config = {
      method: "GET",
      url: `${DODO_API_BASE_URL}?${params.toString()}`,
      timeout: 30000
    };
    
    if (proxy) {
      const agent = createAgent(proxy);
      if (agent) {
        config.httpsAgent = agent;
        config.httpAgent = agent;
      }
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    addLog(`DODO quote error: ${error.message}`);
    return null;
  }
}

async function performDodoSwap(wallet, token, provider, fromToken, toToken, amount, proxy = null) {
  try {
    addLog(`DODO Swap: ${amount} ${fromToken === NATIVE_TOKEN_ADDRESS ? "PHRS" : "Token"}`);
    
    const quote = await getDodoQuote(fromToken, toToken, amount, 1, proxy);
    if (!quote || !quote.data) {
      addLog("Failed to get DODO quote");
      return false;
    }
    
    const { data: txData, to: targetAddress, value } = quote.data;
    
    // Approve if not native token
    if (fromToken !== NATIVE_TOKEN_ADDRESS) {
      const approved = await approveToken(wallet, fromToken, DODO_PROXY_ADDRESS, amount, provider);
      if (!approved) return false;
    }
    
    const nonce = await getNextNonce(wallet, provider);
    const tx = await wallet.sendTransaction({
      to: targetAddress,
      data: txData,
      value: value || "0",
      nonce,
      gasLimit: 500000
    });
    
    addLog(`DODO Swap tx: ${tx.hash.slice(0, 10)}...`);
    await tx.wait();
    
    await reportTransaction(token, tx.hash, "swap", proxy);
    addLog("DODO Swap confirmed");
    return true;
  } catch (error) {
    addLog(`DODO Swap error: ${error.message}`);
    resetNonce(wallet.address);
    return false;
  }
}

async function performFarosSwap(wallet, token, provider, fromToken, toToken, amountIn, proxy = null) {
  try {
    const fromSymbol = fromToken === WPHRS_CONTRACT_ADDRESS ? "WPHRS" : 
                       fromToken === USDT_CONTRACT_ADDRESS ? "USDT" : "Token";
    const toSymbol = toToken === WPHRS_CONTRACT_ADDRESS ? "WPHRS" : 
                     toToken === USDT_CONTRACT_ADDRESS ? "USDT" : "Token";
    
    addLog(`Faros Swap: ${ethers.formatEther(amountIn)} ${fromSymbol} -> ${toSymbol}`);
    
    // Approve token
    const approved = await approveToken(wallet, fromToken, ROUTER_ADDRESS, amountIn, provider);
    if (!approved) return false;
    
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const path = [fromToken, toToken];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    // Get expected output
    const amounts = await router.getAmountsOut(amountIn, path);
    const amountOutMin = amounts[1] * 95n / 100n; // 5% slippage
    
    const nonce = await getNextNonce(wallet, provider);
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      wallet.address,
      deadline,
      { nonce, gasLimit: 300000 }
    );
    
    addLog(`Faros Swap tx: ${tx.hash.slice(0, 10)}...`);
    await tx.wait();
    
    await reportTransaction(token, tx.hash, "faros_swap", proxy);
    addLog("Faros Swap confirmed");
    return true;
  } catch (error) {
    addLog(`Faros Swap error: ${error.message}`);
    resetNonce(wallet.address);
    return false;
  }
}

async function performAddLp(wallet, token, provider, proxy = null) {
  try {
    const amount = ethers.parseEther(
      formatAmount(randomBetween(dailyActivityConfig.minAddLpAmount, dailyActivityConfig.maxAddLpAmount)).toString()
    );
    
    addLog(`Adding LP: ${ethers.formatEther(amount)} PHRS`);
    
    // Wrap PHRS to WPHRS first
    const wphrs = new ethers.Contract(WPHRS_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    let nonce = await getNextNonce(wallet, provider);
    
    const wrapTx = await wphrs.deposit({ value: amount, nonce, gasLimit: 100000 });
    addLog(`Wrapping PHRS... tx: ${wrapTx.hash.slice(0, 10)}...`);
    await wrapTx.wait();
    
    // Approve WPHRS
    await approveToken(wallet, WPHRS_CONTRACT_ADDRESS, ROUTER_ADDRESS, amount, provider);
    
    // Get pair info and calculate USDT amount needed
    const pair = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    
    let usdtAmount;
    if (token0.toLowerCase() === WPHRS_CONTRACT_ADDRESS.toLowerCase()) {
      usdtAmount = (amount * reserve1) / reserve0;
    } else {
      usdtAmount = (amount * reserve0) / reserve1;
    }
    
    // Approve USDT
    await approveToken(wallet, USDT_CONTRACT_ADDRESS, ROUTER_ADDRESS, usdtAmount, provider);
    
    // Add liquidity
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    nonce = await getNextNonce(wallet, provider);
    const tx = await router.addLiquidity(
      WPHRS_CONTRACT_ADDRESS,
      USDT_CONTRACT_ADDRESS,
      amount,
      usdtAmount,
      (amount * 95n) / 100n,
      (usdtAmount * 95n) / 100n,
      wallet.address,
      deadline,
      { nonce, gasLimit: 400000 }
    );
    
    addLog(`Add LP tx: ${tx.hash.slice(0, 10)}...`);
    await tx.wait();
    
    await reportTransaction(token, tx.hash, "add_lp", proxy);
    addLog("Add LP confirmed");
    return true;
  } catch (error) {
    addLog(`Add LP error: ${error.message}`);
    resetNonce(wallet.address);
    return false;
  }
}

async function sendPhrs(wallet, token, provider, toAddress, amount, proxy = null) {
  try {
    addLog(`Sending ${amount} PHRS to ${toAddress.slice(0, 8)}...`);
    
    const nonce = await getNextNonce(wallet, provider);
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
      nonce,
      gasLimit: 21000
    });
    
    addLog(`Send tx: ${tx.hash.slice(0, 10)}...`);
    await tx.wait();
    
    await reportTransaction(token, tx.hash, "transfer", proxy);
    addLog("Send confirmed");
    return true;
  } catch (error) {
    addLog(`Send error: ${error.message}`);
    resetNonce(wallet.address);
    return false;
  }
}

// ==================== MAIN ACTIVITY LOOP ====================
async function runDailyActivity() {
  if (isRunning) {
    addLog("Activity already running!");
    return;
  }
  
  isRunning = true;
  updateStatus("Running Daily Activity...");
  
  const privateKeys = loadPrivateKeys();
  const proxiesData = loadProxies();
  const targetAddresses = loadWalletAddresses();
  
  if (privateKeys.length === 0) {
    addLog("No private keys found! Add keys to privateKeys.txt");
    isRunning = false;
    updateStatus("Ready");
    return;
  }
  
  addLog(`Starting daily activity for ${privateKeys.length} wallet(s)`);
  
  for (let i = 0; i < privateKeys.length; i++) {
    currentWalletIndex = i;
    const privateKey = privateKeys[i];
    const proxy = proxiesData[i] || null;
    
    try {
      addLog(`\n=== Processing Wallet ${i + 1}/${privateKeys.length} ===`);
      
      // Login
      const { wallet, token, provider } = await loginAccount(privateKey, proxy);
      updateWalletDisplay(wallet.address, i + 1, privateKeys.length);
      
      // Claim faucet
      await claimFaucetForAccount(wallet, token, provider, proxy);
      await sleep(2000);
      
      // Subscribe
      await performSubscribe(wallet, token, provider, proxy);
      await sleep(2000);
      
      // Send PHRS
      for (let j = 0; j < dailyActivityConfig.sendPhrsRepetitions; j++) {
        const amount = formatAmount(randomBetween(
          dailyActivityConfig.minSendAmount,
          dailyActivityConfig.maxSendAmount
        ));
        const toAddress = targetAddresses[Math.floor(Math.random() * targetAddresses.length)] || wallet.address;
        await sendPhrs(wallet, token, provider, toAddress, amount, proxy);
        await sleep(3000);
      }
      
      // DODO Swaps
      for (let j = 0; j < dailyActivityConfig.swapRepetitions; j++) {
        // USDT swap
        const usdtAmount = ethers.parseUnits(
          formatAmount(randomBetween(
            dailyActivityConfig.minUsdtSwapAmount,
            dailyActivityConfig.maxUsdtSwapAmount
          )).toString(),
          18
        );
        await performDodoSwap(wallet, token, provider, USDT_CONTRACT_ADDRESS, CASH_CONTRACT_ADDRESS, usdtAmount, proxy);
        await sleep(3000);
        
        // CASH swap back
        const cashAmount = ethers.parseUnits(
          formatAmount(randomBetween(
            dailyActivityConfig.minCashSwapAmount,
            dailyActivityConfig.maxCashSwapAmount
          )).toString(),
          18
        );
        await performDodoSwap(wallet, token, provider, CASH_CONTRACT_ADDRESS, USDT_CONTRACT_ADDRESS, cashAmount, proxy);
        await sleep(3000);
      }
      
      // Faros Swaps
      for (let j = 0; j < dailyActivityConfig.farosSwapRepetitions; j++) {
        // Wrap and swap PHRS -> USDT
        const wrapAmount = ethers.parseEther(
          formatAmount(randomBetween(
            dailyActivityConfig.minPhrsSwapAmount,
            dailyActivityConfig.maxPhrsSwapAmount
          )).toString()
        );
        
        // Wrap PHRS
        const wphrs = new ethers.Contract(WPHRS_CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        const wrapNonce = await getNextNonce(wallet, provider);
        const wrapTx = await wphrs.deposit({ value: wrapAmount, nonce: wrapNonce, gasLimit: 100000 });
        await wrapTx.wait();
        
        await performFarosSwap(wallet, token, provider, WPHRS_CONTRACT_ADDRESS, USDT_CONTRACT_ADDRESS, wrapAmount, proxy);
        await sleep(3000);
        
        // Swap USDT -> WPHRS
        const usdtSwapAmount = ethers.parseUnits(
          formatAmount(randomBetween(
            dailyActivityConfig.minUsdtFarosSwapAmount,
            dailyActivityConfig.maxUsdtFarosSwapAmount
          )).toString(),
          18
        );
        await performFarosSwap(wallet, token, provider, USDT_CONTRACT_ADDRESS, WPHRS_CONTRACT_ADDRESS, usdtSwapAmount, proxy);
        await sleep(3000);
      }
      
      // Add LP
      for (let j = 0; j < dailyActivityConfig.addLpRepetitions; j++) {
        await performAddLp(wallet, token, provider, proxy);
        await sleep(3000);
      }
      
      // Redemption
      await performRedemption(wallet, token, provider, proxy);
      
      addLog(`Wallet ${i + 1} completed successfully!\n`);
      
    } catch (error) {
      addLog(`Error with wallet ${i + 1}: ${error.message}`);
    }
    
    // Delay between wallets
    if (i < privateKeys.length - 1) {
      const delay = Math.floor(randomBetween(5000, 10000));
      addLog(`Waiting ${delay / 1000}s before next wallet...`);
      await sleep(delay);
    }
  }
  
  addLog("\n=== Daily Activity Completed! ===");
  isRunning = false;
  updateStatus("Ready");
}

// ==================== BLESSED TUI ====================
const screen = blessed.screen({
  smartCSR: true,
  title: "PHAROS Atlantic Testnet Bot"
});

// Header Box
const headerBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: "100%",
  height: 8,
  content: "",
  tags: true,
  style: {
    fg: "cyan",
    bg: "black"
  }
});

// Status Box
const statusBox = blessed.box({
  parent: screen,
  top: 8,
  left: 0,
  width: "50%",
  height: 3,
  content: " Status: Ready ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "green",
    border: { fg: "white" }
  }
});

// Wallet Box
const walletBox = blessed.box({
  parent: screen,
  top: 8,
  left: "50%",
  width: "50%",
  height: 3,
  content: " Wallet: None ",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "yellow",
    border: { fg: "white" }
  }
});

// Log Box
const logBox = blessed.log({
  parent: screen,
  top: 11,
  left: 0,
  width: "70%",
  height: "100%-14",
  content: "",
  tags: true,
  border: { type: "line" },
  label: " Logs ",
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: " ",
    track: { bg: "gray" },
    style: { inverse: true }
  },
  style: {
    fg: "white",
    border: { fg: "blue" }
  }
});

// Menu Box
const menuBox = blessed.list({
  parent: screen,
  top: 11,
  left: "70%",
  width: "30%",
  height: "100%-14",
  label: " Menu ",
  border: { type: "line" },
  keys: true,
  vi: true,
  mouse: true,
  items: [
    "1. Start Daily Activity",
    "2. Configure Activity",
    "3. View Config",
    "4. Reload Files",
    "5. Clear Logs",
    "6. Exit"
  ],
  style: {
    fg: "white",
    border: { fg: "green" },
    selected: {
      fg: "black",
      bg: "cyan"
    }
  }
});

// Daily Activity SubMenu
const dailyActivitySubMenu = blessed.list({
  parent: screen,
  top: "center",
  left: "center",
  width: "60%",
  height: 17,
  label: " Configure Daily Activity ",
  border: { type: "line" },
  keys: true,
  vi: true,
  mouse: true,
  hidden: true,
  items: [
    "1. Send PHRS Repetitions",
    "2. Send Amount Config",
    "3. DODO Swap Repetitions",
    "4. USDT Swap Amount Config",
    "5. CASH Swap Amount Config",
    "6. Faros Swap Repetitions",
    "7. PHRS Faros Swap Amount",
    "8. USDT Faros Swap Amount",
    "9. Add LP Repetitions",
    "10. Add LP Amount Config",
    "11. Back to Main Menu"
  ],
  style: {
    fg: "white",
    border: { fg: "magenta" },
    selected: {
      fg: "black",
      bg: "magenta"
    }
  }
});

// Config Forms
function createConfigForm(label, fields) {
  const form = blessed.form({
    parent: screen,
    top: "center",
    left: "center",
    width: "50%",
    height: fields.length * 3 + 6,
    label: ` ${label} `,
    border: { type: "line" },
    keys: true,
    hidden: true,
    style: {
      border: { fg: "yellow" }
    }
  });
  
  const inputs = [];
  fields.forEach((field, idx) => {
    blessed.text({
      parent: form,
      top: idx * 3,
      left: 1,
      content: field.label + ":"
    });
    
    const input = blessed.textbox({
      parent: form,
      name: field.name,
      top: idx * 3 + 1,
      left: 1,
      width: "90%",
      height: 1,
      inputOnFocus: true,
      value: field.value.toString(),
      style: {
        fg: "white",
        bg: "blue"
      }
    });
    inputs.push(input);
  });
  
  blessed.button({
    parent: form,
    top: fields.length * 3 + 1,
    left: 1,
    width: 10,
    height: 1,
    content: " Save ",
    style: {
      fg: "black",
      bg: "green"
    }
  });
  
  blessed.button({
    parent: form,
    top: fields.length * 3 + 1,
    left: 15,
    width: 10,
    height: 1,
    content: " Cancel ",
    style: {
      fg: "black",
      bg: "red"
    }
  });
  
  return { form, inputs };
}

// Create all config forms
const repetitionsForm = createConfigForm("Send PHRS Repetitions", [
  { name: "sendPhrsRepetitions", label: "Repetitions", value: dailyActivityConfig.sendPhrsRepetitions }
]);

const sendAmountConfigForm = createConfigForm("Send Amount Config", [
  { name: "minSendAmount", label: "Min Amount", value: dailyActivityConfig.minSendAmount },
  { name: "maxSendAmount", label: "Max Amount", value: dailyActivityConfig.maxSendAmount }
]);

const swapRepetitionsForm = createConfigForm("DODO Swap Repetitions", [
  { name: "swapRepetitions", label: "Repetitions", value: dailyActivityConfig.swapRepetitions }
]);

const usdtSwapAmountConfigForm = createConfigForm("USDT Swap Amount", [
  { name: "minUsdtSwapAmount", label: "Min Amount", value: dailyActivityConfig.minUsdtSwapAmount },
  { name: "maxUsdtSwapAmount", label: "Max Amount", value: dailyActivityConfig.maxUsdtSwapAmount }
]);

const cashSwapAmountConfigForm = createConfigForm("CASH Swap Amount", [
  { name: "minCashSwapAmount", label: "Min Amount", value: dailyActivityConfig.minCashSwapAmount },
  { name: "maxCashSwapAmount", label: "Max Amount", value: dailyActivityConfig.maxCashSwapAmount }
]);

const farosRepetitionsForm = createConfigForm("Faros Swap Repetitions", [
  { name: "farosSwapRepetitions", label: "Repetitions", value: dailyActivityConfig.farosSwapRepetitions }
]);

const phrsFarosAmountConfigForm = createConfigForm("PHRS Faros Swap Amount", [
  { name: "minPhrsSwapAmount", label: "Min Amount", value: dailyActivityConfig.minPhrsSwapAmount },
  { name: "maxPhrsSwapAmount", label: "Max Amount", value: dailyActivityConfig.maxPhrsSwapAmount }
]);

const usdtFarosAmountConfigForm = createConfigForm("USDT Faros Swap Amount", [
  { name: "minUsdtFarosSwapAmount", label: "Min Amount", value: dailyActivityConfig.minUsdtFarosSwapAmount },
  { name: "maxUsdtFarosSwapAmount", label: "Max Amount", value: dailyActivityConfig.maxUsdtFarosSwapAmount }
]);

const addLpRepetitionsForm = createConfigForm("Add LP Repetitions", [
  { name: "addLpRepetitions", label: "Repetitions", value: dailyActivityConfig.addLpRepetitions }
]);

const addLpAmountConfigForm = createConfigForm("Add LP Amount", [
  { name: "minAddLpAmount", label: "Min Amount", value: dailyActivityConfig.minAddLpAmount },
  { name: "maxAddLpAmount", label: "Max Amount", value: dailyActivityConfig.maxAddLpAmount }
]);

// ==================== UI FUNCTIONS ====================
function safeRender() {
  try {
    screen.render();
  } catch (e) {
    // Ignore render errors
  }
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  logs.push(`[${timestamp}] ${message}`);
  logBox.log(`{gray-fg}[${timestamp}]{/gray-fg} ${message}`);
  safeRender();
}

function updateStatus(status) {
  statusBox.setContent(` Status: {bold}${status}{/bold} `);
  safeRender();
}

function updateWalletDisplay(address, current, total) {
  walletBox.setContent(` Wallet ${current}/${total}: {yellow-fg}${address.slice(0, 8)}...${address.slice(-6)}{/yellow-fg} `);
  safeRender();
}

function showHeader() {
  figlet.text("PHAROS BOT", { font: "Small" }, (err, data) => {
    if (!err) {
      headerBox.setContent("{cyan-fg}" + data + "{/cyan-fg}\n{white-fg}Atlantic Testnet Bot v2.0 - Full Features{/white-fg}");
      safeRender();
    }
  });
}

function hideAllForms() {
  repetitionsForm.form.hide();
  sendAmountConfigForm.form.hide();
  swapRepetitionsForm.form.hide();
  usdtSwapAmountConfigForm.form.hide();
  cashSwapAmountConfigForm.form.hide();
  farosRepetitionsForm.form.hide();
  phrsFarosAmountConfigForm.form.hide();
  usdtFarosAmountConfigForm.form.hide();
  addLpRepetitionsForm.form.hide();
  addLpAmountConfigForm.form.hide();
  dailyActivitySubMenu.hide();
  safeRender();
}

function showConfigForm(formObj, configKeys) {
  hideAllForms();
  formObj.inputs.forEach((input, idx) => {
    input.setValue(dailyActivityConfig[configKeys[idx]].toString());
  });
  formObj.form.show();
  formObj.inputs[0].focus();
  safeRender();
}

function saveFormValues(formObj, configKeys) {
  formObj.inputs.forEach((input, idx) => {
    const value = parseFloat(input.getValue()) || 0;
    dailyActivityConfig[configKeys[idx]] = value;
  });
  saveConfig();
  hideAllForms();
  dailyActivitySubMenu.show();
  dailyActivitySubMenu.focus();
  addLog("Configuration saved!");
}

// ==================== EVENT HANDLERS ====================
menuBox.on("select", (item, index) => {
  switch (index) {
    case 0: // Start Daily Activity
      runDailyActivity();
      break;
    case 1: // Configure Activity
      currentSubMenu = "dailyActivity";
      dailyActivitySubMenu.show();
      dailyActivitySubMenu.focus();
      safeRender();
      break;
    case 2: // View Config
      addLog("=== Current Configuration ===");
      Object.entries(dailyActivityConfig).forEach(([key, value]) => {
        addLog(`${key}: ${value}`);
      });
      break;
    case 3: // Reload Files
      loadConfig();
      addLog("Files reloaded");
      break;
    case 4: // Clear Logs
      logBox.setContent("");
      logs = [];
      addLog("Logs cleared");
      break;
    case 5: // Exit
      process.exit(0);
      break;
  }
});

dailyActivitySubMenu.on("select", (item, index) => {
  switch (index) {
    case 0: showConfigForm(repetitionsForm, ["sendPhrsRepetitions"]); break;
    case 1: showConfigForm(sendAmountConfigForm, ["minSendAmount", "maxSendAmount"]); break;
    case 2: showConfigForm(swapRepetitionsForm, ["swapRepetitions"]); break;
    case 3: showConfigForm(usdtSwapAmountConfigForm, ["minUsdtSwapAmount", "maxUsdtSwapAmount"]); break;
    case 4: showConfigForm(cashSwapAmountConfigForm, ["minCashSwapAmount", "maxCashSwapAmount"]); break;
    case 5: showConfigForm(farosRepetitionsForm, ["farosSwapRepetitions"]); break;
    case 6: showConfigForm(phrsFarosAmountConfigForm, ["minPhrsSwapAmount", "maxPhrsSwapAmount"]); break;
    case 7: showConfigForm(usdtFarosAmountConfigForm, ["minUsdtFarosSwapAmount", "maxUsdtFarosSwapAmount"]); break;
    case 8: showConfigForm(addLpRepetitionsForm, ["addLpRepetitions"]); break;
    case 9: showConfigForm(addLpAmountConfigForm, ["minAddLpAmount", "maxAddLpAmount"]); break;
    case 10: // Back
      hideAllForms();
      menuBox.focus();
      break;
  }
});

// Form key handlers
const forms = [
  { obj: repetitionsForm, keys: ["sendPhrsRepetitions"] },
  { obj: sendAmountConfigForm, keys: ["minSendAmount", "maxSendAmount"] },
  { obj: swapRepetitionsForm, keys: ["swapRepetitions"] },
  { obj: usdtSwapAmountConfigForm, keys: ["minUsdtSwapAmount", "maxUsdtSwapAmount"] },
  { obj: cashSwapAmountConfigForm, keys: ["minCashSwapAmount", "maxCashSwapAmount"] },
  { obj: farosRepetitionsForm, keys: ["farosSwapRepetitions"] },
  { obj: phrsFarosAmountConfigForm, keys: ["minPhrsSwapAmount", "maxPhrsSwapAmount"] },
  { obj: usdtFarosAmountConfigForm, keys: ["minUsdtFarosSwapAmount", "maxUsdtFarosSwapAmount"] },
  { obj: addLpRepetitionsForm, keys: ["addLpRepetitions"] },
  { obj: addLpAmountConfigForm, keys: ["minAddLpAmount", "maxAddLpAmount"] }
];

forms.forEach(({ obj, keys }) => {
  obj.form.key(["enter"], () => saveFormValues(obj, keys));
  obj.form.key(["escape"], () => {
    hideAllForms();
    dailyActivitySubMenu.show();
    dailyActivitySubMenu.focus();
  });
});

// Global key handlers
screen.key(["escape"], () => {
  hideAllForms();
  menuBox.focus();
});

screen.key(["q", "C-c"], () => {
  process.exit(0);
});

// ==================== INITIALIZATION ====================
function initialize() {
  showHeader();
  loadConfig();
  
  const privateKeys = loadPrivateKeys();
  const proxiesData = loadProxies();
  const walletAddrsData = loadWalletAddresses();
  
  addLog("=== PHAROS Atlantic Testnet Bot v2.0 ===");
  addLog(`Loaded ${privateKeys.length} private key(s)`);
  addLog(`Loaded ${proxiesData.length} proxy(ies)`);
  addLog(`Loaded ${walletAddrsData.length} target address(es)`);
  addLog("");
  addLog("Features: Faucet, Subscribe, Send PHRS, DODO Swap,");
  addLog("          Faros Swap, Add LP, Redemption");
  addLog("");
  addLog("Press arrow keys to navigate, Enter to select");
  addLog("Press 'q' or Ctrl+C to quit");
  
  menuBox.focus();
  safeRender();
}

initialize();
