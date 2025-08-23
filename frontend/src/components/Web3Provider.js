"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
// import { polygonZkEvmCardona } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const AvalancheTestnet = {
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: {name: 'Avalanche fuji', symbol: 'AVAX', decimals: 18},
  rpcUrls: {
    default: { http : ["https://avalanche-fuji.drpc.org"] }
  },
  blockExplorers: {
    default: { name: 'Avalanche Fuji expolorer', url: "https://testnet.snowcan.xyz/" }
  },
}

const config = createConfig(
  getDefaultConfig({
    chains: [AvalancheTestnet],

    walletConnectProjectId: "a7a2557c75d9558a9c932d5f99559799",

    appName: "DJWallet",

    // Optional App Info
    appDescription: "Ironic",
    appUrl: "https://family.co",
    appIcon: "https://family.co/logo.png",
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>

            {children}
          
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};