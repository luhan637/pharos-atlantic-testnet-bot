// ERC20 ABI
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// OnchainGM ABI
const ONCHAINGM_ABI = [
    "function gm() external",
    "function gmCount(address) view returns (uint256)"
];

// Surflayer ABI
const SURFLAYER_ABI = [
    "function checkIn() external",
    "function lastCheckIn(address) view returns (uint256)"
];

// Grandline NFT ABI
const GRANDLINE_ABI = [
    "function mint() external payable",
    "function mintPrice() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
];

// FaroSwap Router ABI
const FARO_ROUTER_ABI = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
    "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
    "function WETH() view returns (address)"
];

// Bitverse ABI
const BITVERSE_ABI = [
    "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
    "function deposit(address token, uint256 amount) external",
    "function withdraw(address token, uint256 amount) external",
    "function openPosition(address token, uint256 amount, bool isLong, uint256 leverage) external",
    "function closePosition(uint256 positionId) external",
    "function getPosition(uint256 positionId) view returns (address token, uint256 amount, bool isLong, uint256 leverage, uint256 entryPrice)",
    "function getUserPositions(address user) view returns (uint256[])"
];

// Aquaflux ABI
const AQUAFLUX_ABI = [
    "function createStructure(uint256 amount, uint256 duration) external",
    "function dissolveStructure(uint256 structureId) external",
    "function earn(uint256 amount) external",
    "function claimRewards() external",
    "function getStructure(uint256 id) view returns (uint256 amount, uint256 startTime, uint256 duration)",
    "function pendingRewards(address user) view returns (uint256)"
];

// Asseto ABI
const ASSETO_ABI = [
    "function deposit(address token, uint256 amount) external",
    "function subscribe(uint256 planId, uint256 amount) external",
    "function redeem(uint256 subscriptionId) external",
    "function getSubscription(uint256 id) view returns (uint256 planId, uint256 amount, uint256 startTime)",
    "function getUserSubscriptions(address user) view returns (uint256[])",
    "function availablePlans() view returns (uint256[])"
];

// Zenith Lending ABI
const ZENITH_ABI = [
    "function supply(address token, uint256 amount) external",
    "function borrow(address token, uint256 amount) external",
    "function repay(address token, uint256 amount) external",
    "function withdraw(address token, uint256 amount) external",
    "function getSupplyBalance(address user, address token) view returns (uint256)",
    "function getBorrowBalance(address user, address token) view returns (uint256)",
    "function getHealthFactor(address user) view returns (uint256)"
];

module.exports = {
    ERC20_ABI,
    ONCHAINGM_ABI,
    SURFLAYER_ABI,
    GRANDLINE_ABI,
    FARO_ROUTER_ABI,
    BITVERSE_ABI,
    AQUAFLUX_ABI,
    ASSETO_ABI,
    ZENITH_ABI
};