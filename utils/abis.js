// ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// OnchainGM ABI
const ONCHAINGM_ABI = [
  "function gm() external",
  "function lastGM(address user) view returns (uint256)",
  "function gmCount(address user) view returns (uint256)"
];

// Surflayer ABI
const SURFLAYER_ABI = [
  "function checkIn() external",
  "function getCheckInCount(address user) view returns (uint256)",
  "function lastCheckIn(address user) view returns (uint256)"
];

// Grandline NFT ABI
const GRANDLINE_NFT_ABI = [
  "function mint() external payable",
  "function mintPrice() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];

// FaroSwap Router ABI
const FAROSWAP_ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function factory() view returns (address)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)",
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)",
  "function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)"
];

// Bitverse Router ABI
const BITVERSE_ROUTER_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function openPosition(bool isLong, address token, uint256 collateral, uint256 leverage) external returns (uint256 positionId)",
  "function closePosition(uint256 positionId) external",
  "function getPosition(uint256 positionId) view returns (tuple(address owner, bool isLong, address token, uint256 collateral, uint256 leverage, uint256 entryPrice, uint256 openTime))"
];

// Aquaflux ABI
const AQUAFLUX_ABI = [
  "function createStructure(uint256 amount, uint256 duration) external",
  "function claimStructure(uint256 structureId) external",
  "function earn(uint256 amount) external",
  "function claimEarnings() external",
  "function getStructure(uint256 structureId) view returns (tuple(address owner, uint256 amount, uint256 duration, uint256 startTime, bool claimed))",
  "function getUserEarnings(address user) view returns (uint256)"
];

// Asseto ABI  
const ASSETO_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function subscribe(uint256 planId, uint256 amount) external",
  "function requestRedemption(uint256 subscriptionId) external",
  "function claimRedemption(uint256 redemptionId) external",
  "function getSubscription(uint256 subscriptionId) view returns (tuple(address owner, uint256 planId, uint256 amount, uint256 startTime, bool active))",
  "function getPlans() view returns (tuple(uint256 id, string name, uint256 minAmount, uint256 apy, uint256 lockPeriod)[])"
];

// Zenith Lending ABI
const ZENITH_LENDING_ABI = [
  "function supply(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function borrow(address token, uint256 amount) external",
  "function repay(address token, uint256 amount) external",
  "function getUserAccountData(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrow, uint256 healthFactor)",
  "function getReserveData(address token) view returns (tuple(uint256 totalSupply, uint256 totalBorrow, uint256 supplyRate, uint256 borrowRate, uint256 utilizationRate))"
];

module.exports = {
  ERC20_ABI,
  ONCHAINGM_ABI,
  SURFLAYER_ABI,
  GRANDLINE_NFT_ABI,
  FAROSWAP_ROUTER_ABI,
  BITVERSE_ROUTER_ABI,
  AQUAFLUX_ABI,
  ASSETO_ABI,
  ZENITH_LENDING_ABI
};
