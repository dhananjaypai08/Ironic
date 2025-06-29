"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import IronicABI from '@/abi/Ironic.json';
import { CONTRACT_CONFIG, CHAIN_CONFIG } from '@/utils/constants';
import toast from 'react-hot-toast';

export const useContract = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      try {
        console.log('🔄 Initializing contracts...');
        
        // Read-only contract for data fetching
        const rpcProvider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
        const readContract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          IronicABI.abi,
          rpcProvider
        );
        
        setProvider(rpcProvider);
        setReadOnlyContract(readContract);
        console.log('✅ Read-only contract initialized');

        // Write contract for transactions (only when wallet is connected)
        if (walletClient && isConnected && window.ethereum) {
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const contractSigner = await browserProvider.getSigner();
            
            // Verify we have the correct network
            const network = await browserProvider.getNetwork();
            console.log('🌐 Network:', network.chainId);
            
            if (Number(network.chainId) !== CHAIN_CONFIG.chainId) {
              console.warn('⚠️ Wrong network detected');
              toast.error(`Please switch to ${CHAIN_CONFIG.name}`);
              return;
            }
            
            const writeContract = new ethers.Contract(
              CONTRACT_CONFIG.address,
              IronicABI.abi,
              contractSigner
            );
            
            setContract(writeContract);
            setSigner(contractSigner);
            setProvider(browserProvider);
            
            console.log('✅ Write contract initialized');
            console.log('📍 Contract address:', await writeContract.getAddress());
          } catch (walletError) {
            console.error('❌ Wallet contract initialization failed:', walletError);
            toast.error('Failed to initialize wallet connection');
          }
        } else {
          // Clear write contract when wallet disconnects
          setContract(null);
          setSigner(null);
        }
      } catch (error) {
        console.error('❌ Contract initialization error:', error);
        toast.error('Failed to initialize contract');
      }
    };

    initContracts();
  }, [walletClient, isConnected]);

  // Get latest reserve data
  const getLatestReserve = useCallback(async () => {
    if (!readOnlyContract) return null;
    
    try {
      console.log('🔄 Fetching latest reserve...');
      const reserve = await readOnlyContract.getLatestReserve();
      console.log('✅ Reserve fetched:', reserve.toString());
      return ethers.formatUnits(reserve, 8); // Reserve has 8 decimals
    } catch (error) {
      console.error('❌ Error fetching reserve:', error);
      return null;
    }
  }, [readOnlyContract]);

  // Get user portfolio
  const getUserPortfolio = useCallback(async (userAddress) => {
    if (!readOnlyContract || !userAddress) return null;
    
    try {
      console.log('🔄 Fetching user portfolio for:', userAddress);
      const portfolio = await readOnlyContract.userPortfolio(userAddress);
      console.log('✅ Portfolio fetched:', portfolio);
      
      return {
        ironBalance: ethers.formatEther(portfolio.ironBalance),
        tokenDeposited: portfolio.tokenDeposited,
        withdrawn: ethers.formatEther(portfolio.withdrawn),
        allowedWithdrawalTimestamp: Number(portfolio.allowedwithdrawalTimestamp)
      };
    } catch (error) {
      console.error('❌ Error fetching user portfolio:', error);
      return null;
    }
  }, [readOnlyContract]);

  // Get user positions
  const getUserPositions = useCallback(async () => {
    if (!readOnlyContract) return [];
    
    try {
      console.log('🔄 Fetching user positions...');
      const positions = await readOnlyContract.getAllUserPositions();
      console.log('✅ Positions fetched:', positions);
      
      return positions.map(pos => ({
        amount: ethers.formatEther(pos.amount),
        tokenDeposited: pos.tokenDeposited,
        stopLossThreshold: ethers.formatUnits(pos.stopLossThreshold, 8),
        isActive: pos.isActive
      }));
    } catch (error) {
      console.error('❌ Error fetching user positions:', error);
      return [];
    }
  }, [readOnlyContract]);

  // Get Iron token balance
  const getIronBalance = useCallback(async (tokenName, userAddress) => {
    if (!readOnlyContract || !userAddress) return '0';
    
    try {
      console.log('🔄 Fetching iron balance...');
      const balance = await readOnlyContract.getIronBalance(tokenName, userAddress);
      console.log('✅ Iron balance fetched:', balance.toString());
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Error fetching iron balance:', error);
      return '0';
    }
  }, [readOnlyContract]);

  // Check if user needs to approve tokens first
  const checkTokenApproval = useCallback(async (tokenAddress, amount) => {
    if (!signer || !contract) return false;
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        signer
      );
      
      const userAddress = await signer.getAddress();
      const contractAddress = await contract.getAddress();
      const allowance = await tokenContract.allowance(userAddress, contractAddress);
      
      return allowance >= ethers.parseEther(amount.toString());
    } catch (error) {
      console.error('Error checking token approval:', error);
      return false;
    }
  }, [signer, contract]);

  // Approve tokens if needed
  const approveTokens = useCallback(async (tokenAddress, amount) => {
    if (!signer || !contract) throw new Error('Wallet not connected');
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function symbol() view returns (string)'
        ],
        signer
      );
      
      const contractAddress = await contract.getAddress();
      const amountWei = ethers.parseEther(amount.toString());
      
      console.log('🔄 Requesting token approval...');
      toast.loading('Requesting token approval...', { id: 'approval' });
      
      const approveTx = await tokenContract.approve(contractAddress, amountWei);
      console.log('✅ Approval transaction submitted:', approveTx.hash);
      
      toast.loading('Confirming approval transaction...', { id: 'approval' });
      await approveTx.wait();
      
      toast.success('Tokens approved successfully!', { id: 'approval' });
      return true;
    } catch (error) {
      console.error('❌ Token approval failed:', error);
      toast.error('Token approval failed', { id: 'approval' });
      throw error;
    }
  }, [signer, contract]);

  // Deposit function with proper MetaMask integration
  const deposit = useCallback(async (tokenName, amount) => {
    if (!contract || !signer) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const contractAddress = await contract.getAddress();
      
      console.log('🔄 Preparing deposit...');
      console.log('📍 Contract address:', contractAddress);
      console.log('💰 Amount:', amountWei.toString());
      console.log('🪙 Token:', tokenName);
      
      // Show preparation toast
      toast.loading('Preparing transaction...', { id: 'deposit' });

      // Estimate gas to check if transaction will succeed
      try {
        const gasEstimate = await contract.deposit.estimateGas(tokenName, amountWei);
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        toast.error('Transaction will fail. Check your balance and allowances.', { id: 'deposit' });
        throw new Error('Transaction validation failed');
      }

      // Execute the transaction
      console.log('🚀 Executing deposit transaction...');
      toast.loading('Please confirm transaction in MetaMask...', { id: 'deposit' });
      
      const tx = await contract.deposit(tokenName, amountWei);
      console.log('✅ Transaction submitted:', tx.hash);
      
      // Update toast with transaction hash
      toast.loading(
        <div>
          <div>Transaction submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'deposit' }
      );

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      toast.success(
        <div>
          <div>Deposit successful!</div>
          <div className="text-xs text-gray-400">Block: {receipt.blockNumber}</div>
        </div>, 
        { id: 'deposit' }
      );

      return { tx, receipt };
    } catch (error) {
      console.error('❌ Deposit error:', error);
      
      // Handle different error types
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled by user', { id: 'deposit' });
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Insufficient funds for gas', { id: 'deposit' });
      } else if (error.reason) {
        toast.error(`Transaction failed: ${error.reason}`, { id: 'deposit' });
      } else {
        toast.error('Deposit failed. Please try again.', { id: 'deposit' });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, signer]);

  // Deposit with stop loss
  const depositStopLoss = useCallback(async (tokenName, amount, stopLossThreshold) => {
    if (!contract || !signer) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const thresholdWei = ethers.parseUnits(stopLossThreshold.toString(), 8);
      const contractAddress = await contract.getAddress();
      
      console.log('🔄 Preparing stop-loss deposit...');
      console.log('📍 Contract address:', contractAddress);
      console.log('💰 Amount:', amountWei.toString());
      console.log('🛡️ Stop-loss threshold:', thresholdWei.toString());
      console.log('🪙 Token:', tokenName);
      
      toast.loading('Preparing stop-loss transaction...', { id: 'stopLossDeposit' });

      // Estimate gas
      try {
        const gasEstimate = await contract.depositStopLoss.estimateGas(tokenName, amountWei, thresholdWei);
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        toast.error('Transaction will fail. Check parameters and balance.', { id: 'stopLossDeposit' });
        throw new Error('Transaction validation failed');
      }

      console.log('🚀 Executing stop-loss deposit...');
      toast.loading('Please confirm stop-loss transaction in MetaMask...', { id: 'stopLossDeposit' });
      
      const tx = await contract.depositStopLoss(tokenName, amountWei, thresholdWei);
      console.log('✅ Stop-loss transaction submitted:', tx.hash);
      
      toast.loading(
        <div>
          <div>Stop-loss order submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'stopLossDeposit' }
      );

      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Stop-loss transaction confirmed:', receipt);
      
      toast.success(
        <div>
          <div>Stop-loss deposit successful!</div>
          <div className="text-xs text-gray-400">Block: {receipt.blockNumber}</div>
        </div>, 
        { id: 'stopLossDeposit' }
      );

      return { tx, receipt };
    } catch (error) {
      console.error('❌ Stop-loss deposit error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled by user', { id: 'stopLossDeposit' });
      } else if (error.reason) {
        toast.error(`Stop-loss failed: ${error.reason}`, { id: 'stopLossDeposit' });
      } else {
        toast.error('Stop-loss deposit failed', { id: 'stopLossDeposit' });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, signer]);

  // Withdraw function
  const withdraw = useCallback(async (tokenName, amount) => {
    if (!contract || !signer) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const contractAddress = await contract.getAddress();
      
      console.log('🔄 Preparing withdrawal...');
      console.log('📍 Contract address:', contractAddress);
      console.log('💰 Amount:', amountWei.toString());
      
      toast.loading('Preparing withdrawal...', { id: 'withdraw' });

      // Estimate gas
      try {
        const gasEstimate = await contract.withdraw.estimateGas(tokenName, amountWei);
        console.log('⛽ Estimated gas:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        toast.error('Withdrawal will fail. Check withdrawal conditions.', { id: 'withdraw' });
        throw new Error('Withdrawal validation failed');
      }

      console.log('🚀 Executing withdrawal...');
      toast.loading('Please confirm withdrawal in MetaMask...', { id: 'withdraw' });
      
      const tx = await contract.withdraw(tokenName, amountWei);
      console.log('✅ Withdrawal submitted:', tx.hash);
      
      toast.loading(
        <div>
          <div>Withdrawal submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'withdraw' }
      );

      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Withdrawal confirmed:', receipt);
      
      toast.success(
        <div>
          <div>Withdrawal successful!</div>
          <div className="text-xs text-gray-400">Block: {receipt.blockNumber}</div>
        </div>, 
        { id: 'withdraw' }
      );

      return { tx, receipt };
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled by user', { id: 'withdraw' });
      } else if (error.reason) {
        toast.error(`Withdrawal failed: ${error.reason}`, { id: 'withdraw' });
      } else {
        toast.error('Withdrawal failed', { id: 'withdraw' });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, signer]);

  // Convert to mint amount (for display purposes)
  const convertToMintAmount = useCallback(async (depositAmount, reservePrice, tokenName) => {
    if (!readOnlyContract) return '0';
    
    try {
      const depositWei = ethers.parseEther(depositAmount.toString());
      const reserveWei = ethers.parseUnits(reservePrice.toString(), 8);
      
      const mintAmount = await readOnlyContract.convertToMintAmount(
        depositWei,
        reserveWei,
        tokenName
      );
      
      return ethers.formatEther(mintAmount);
    } catch (error) {
      console.error('❌ Convert to mint amount error:', error);
      return '0';
    }
  }, [readOnlyContract]);

  // Get contract address (safe method for ethers v6)
  const getContractAddress = useCallback(async () => {
    if (!contract) return null;
    try {
      return await contract.getAddress();
    } catch (error) {
      console.error('Error getting contract address:', error);
      return null;
    }
  }, [contract]);

  return {
    contract,
    readOnlyContract,
    loading,
    isConnected,
    address,
    provider,
    signer,
    // Utility functions
    getContractAddress,
    checkTokenApproval,
    approveTokens,
    // Data fetching functions
    getLatestReserve,
    getUserPortfolio,
    getUserPositions,
    getIronBalance,
    convertToMintAmount,
    // Transaction functions
    deposit,
    depositStopLoss,
    withdraw
  };
};