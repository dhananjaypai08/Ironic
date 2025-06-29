"use client";
import { Web3Provider } from "./components/Web3Provider";
import { ConnectKitButton } from "connectkit";

export default function Home() {
  return (
    <Web3Provider>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-4xl font-bold">Welcome to Ironic</h1>
        <ConnectKitButton />
        <p className="mt-4 text-lg">Your Web3 wallet for the future.</p>
      </main>
    </Web3Provider>
  );
}
