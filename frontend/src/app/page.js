"use client";
import { useState } from 'react';
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import Portfolio from "@/components/Portfolio";
import Trade from "@/components/Trade";

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'trade':
        return <Trade />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-black">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main>
          {renderContent()}
        </main>
      </div>
    </Web3Provider>
  );
}
