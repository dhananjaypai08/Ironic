import abi from "@/abi/Ironic.json"
export const CHAIN_CONFIG = {
  chainId: 43113,
  name: "Avalanche Fuji",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  explorerUrl: "https://testnet.snowscan.xyz",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18
  }
};

export const CONTRACT_CONFIG = {
  address: abi.address,
  ccipBnmToken: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4"
};

export const RESERVE_TOKENS = {
  "ccip-bnm": {
    name: "CCIP BnM",
    symbol: "ccipBnM",
    decimals: 18,
    address: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4"
  }
};