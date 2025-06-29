import abi from "@/abi/Ironic.json"

export const CHAIN_CONFIG = {
  chainId: 43113,
  name: "Avalanche Fuji",
  rpcUrl: "https://avalanche-fuji-c-chain-rpc.publicnode.com",
  explorerUrl: "https://testnet.snowscan.xyz",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18
  }
};

export const CONTRACT_CONFIG = {
  address: abi.address,
  ccipBnmToken: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4" // CCIP-BnM token address on Avalanche Fuji
};

export const RESERVE_TOKENS = {
  "ccip-bnm": {
    name: "CCIP BnM",
    symbol: "ccipBnM",
    decimals: 18,
    address: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4"
  }
};

// Token configuration for easy access
export const TOKENS = {
  CCIP_BNM: {
    address: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
    symbol: "CCIP-BnM",
    name: "Chainlink CCIP BnM Token",
    decimals: 18,
    contractKey: "ccip-bnm"
  }
};

// Contract addresses
export const ADDRESSES = {
  IRONIC_PROTOCOL: abi.address,
  CCIP_BNM_TOKEN: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
  BTC_B_RESERVE_ORACLE: "0xa284e0aCB9a5F46CE7884D9929Fa573Ff842d7b3"
};

// Transaction settings
export const TX_SETTINGS = {
  DEFAULT_GAS_LIMIT: 300000,
  APPROVAL_GAS_LIMIT: 100000,
  DEPOSIT_GAS_LIMIT: 250000,
  WITHDRAW_GAS_LIMIT: 200000
};