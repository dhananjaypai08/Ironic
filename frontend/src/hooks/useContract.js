"use client";
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import IronicABI from '@/abi/Ironic.json';
import IERC20ABI from '@/abi/IERC20.json';
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

  // Get token contract instance
  const getTokenContract = useCallback((tokenAddress, readOnly = false) => {
    if (readOnly || !signer) {
      return new ethers.Contract(tokenAddress, IERC20ABI.abi, provider);
    }
    return new ethers.Contract(tokenAddress, IERC20ABI.abi, signer);
  }, [provider, signer]);

  // Check token allowance
  const checkTokenAllowance = useCallback(async (tokenAddress, userAddress, spenderAddress) => {
    try {
      const tokenContract = getTokenContract(tokenAddress, true);
      const allowance = await tokenContract.allowance(userAddress, spenderAddress);
      console.log('📊 Current allowance:', ethers.formatEther(allowance));
      return allowance;
    } catch (error) {
      console.error('❌ Error checking allowance:', error);
      return ethers.BigNumber.from('0');
    }
  }, [getTokenContract]);

  // Check token balance
  const checkTokenBalance = useCallback(async (tokenAddress, userAddress) => {
    try {
      const tokenContract = getTokenContract(tokenAddress, true);
      const balance = await tokenContract.balanceOf(userAddress);
      console.log('💰 Token balance:', ethers.formatEther(balance));
      return balance;
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      return ethers.BigNumber.from('0');
    }
  }, [getTokenContract]);

  // Approve tokens
  const approveToken = useCallback(async (tokenAddress, spenderAddress, amount) => {
    if (!signer) throw new Error('Wallet not connected');

    try {
      console.log('🔄 Approving tokens...');
      console.log('📍 Token:', tokenAddress);
      console.log('📍 Spender:', spenderAddress);
      console.log('💰 Amount:', amount.toString());

      const tokenContract = getTokenContract(tokenAddress);
      
      toast.loading('Requesting token approval...', { id: 'approve' });

      // Estimate gas for approval
      const gasEstimate = await tokenContract.approve.estimateGas(spenderAddress, amount);
      console.log('⛽ Approval gas estimate:', gasEstimate.toString());

      // Execute approval
      const approveTx = await tokenContract.approve(spenderAddress, amount);
      console.log('✅ Approval transaction submitted:', approveTx.hash);
      
      toast.loading(
        <div>
          <div>Approval submitted!</div>
          <div className="text-xs text-gray-400">Hash: {approveTx.hash.slice(0, 10)}...</div>
        </div>,
        { id: 'approve' }
      );

      // Wait for confirmation
      const receipt = await approveTx.wait();
      console.log('✅ Approval confirmed:', receipt);
      
      toast.success('Tokens approved successfully!', { id: 'approve' });
      
      return { tx: approveTx, receipt };
    } catch (error) {
      console.error('❌ Approval error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Approval cancelled by user', { id: 'approve' });
      } else if (error.reason) {
        toast.error(`Approval failed: ${error.reason}`, { id: 'approve' });
      } else {
        toast.error('Token approval failed', { id: 'approve' });
      }
      
      throw error;
    }
  }, [signer, getTokenContract]);

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
      const balance = await readOnlyContract.balanceOf(userAddress);
      console.log('✅ Iron balance fetched:', balance.toString());
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Error fetching iron balance:', error);
      console.log('💡 Falling back to portfolio ironBalance...');
      
      try {
        const portfolio = await readOnlyContract.userPortfolio(userAddress);
        return ethers.formatEther(portfolio.ironBalance);
      } catch (portfolioError) {
        console.error('❌ Portfolio fallback also failed:', portfolioError);
        return '0';
      }
    }
  }, [readOnlyContract]);

  // Enhanced deposit with approval flow
  const deposit = useCallback(async (tokenName, amount) => {
    if (!contract || !signer || !address) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const contractAddress = await contract.getAddress();
      const tokenAddress = CONTRACT_CONFIG.ccipBnmToken;
      
      console.log('🔄 Starting deposit flow...');
      console.log('📍 Contract address:', contractAddress);
      console.log('📍 Token address:', tokenAddress);
      console.log('💰 Amount:', amountWei.toString());
      console.log('🪙 Token:', tokenName);

      // Step 1: Check user's token balance
      const userBalance = await checkTokenBalance(tokenAddress, address);
      if (userBalance < amountWei) {
        throw new Error('Insufficient token balance');
      }
      console.log('✅ Balance check passed');

      // Step 2: Check current allowance
      const currentAllowance = await checkTokenAllowance(tokenAddress, address, contractAddress);
      console.log('📊 Current allowance:', ethers.formatEther(currentAllowance));
      
      // Step 3: Approve if necessary
      if (currentAllowance < amountWei) {
        console.log('🔄 Allowance insufficient, requesting approval...');
        await approveToken(tokenAddress, contractAddress, amountWei);
        console.log('✅ Approval completed');
      } else {
        console.log('✅ Sufficient allowance available');
      }

      // Step 4: Verify allowance after approval
      const newAllowance = await checkTokenAllowance(tokenAddress, address, contractAddress);
      if (newAllowance < amountWei) {
        throw new Error('Approval failed or insufficient');
      }

      // Step 5: Execute deposit
      console.log('🚀 Executing deposit transaction...');
      toast.loading('Please confirm deposit transaction in MetaMask...', { id: 'deposit' });
      
      const connectedContract = contract.connect(signer);
      
      // Estimate gas for deposit
      const gasEstimate = await connectedContract.deposit.estimateGas(tokenName, amountWei);
      console.log('⛽ Deposit gas estimate:', gasEstimate.toString());

      const tx = await connectedContract.deposit(tokenName, amountWei);
      console.log('✅ Deposit transaction submitted:', tx.hash);
      
      toast.loading(
        <div>
          <div>Deposit submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'deposit' }
      );

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Deposit confirmed:', receipt);
      
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
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled by user', { id: 'deposit' });
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Insufficient funds for gas', { id: 'deposit' });
      } else if (error.reason) {
        toast.error(`Deposit failed: ${error.reason}`, { id: 'deposit' });
      } else {
        toast.error(`Deposit failed: ${error.message}`, { id: 'deposit' });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, address, checkTokenBalance, checkTokenAllowance, approveToken]);

  // Enhanced deposit with stop loss and approval flow
  const depositStopLoss = useCallback(async (tokenName, amount, stopLossThreshold) => {
    if (!contract || !signer || !address) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const thresholdWei = ethers.parseUnits(stopLossThreshold.toString(), 8);
      const contractAddress = await contract.getAddress();
      const tokenAddress = CONTRACT_CONFIG.ccipBnmToken;
      
      console.log('🔄 Starting stop-loss deposit flow...');
      console.log('📍 Contract address:', contractAddress);
      console.log('📍 Token address:', tokenAddress);
      console.log('💰 Amount:', amountWei.toString());
      console.log('🛡️ Stop-loss threshold:', thresholdWei.toString());

      // Step 1: Check user's token balance
      const userBalance = await checkTokenBalance(tokenAddress, address);
      if (userBalance < amountWei) {
        throw new Error('Insufficient token balance');
      }
      console.log('✅ Balance check passed');

      // Step 2: Check current allowance
      const currentAllowance = await checkTokenAllowance(tokenAddress, address, contractAddress);
      console.log('📊 Current allowance:', ethers.formatEther(currentAllowance));
      
      // Step 3: Approve if necessary
      if (currentAllowance < amountWei) {
        console.log('🔄 Allowance insufficient, requesting approval...');
        await approveToken(tokenAddress, contractAddress, amountWei);
        console.log('✅ Approval completed');
      } else {
        console.log('✅ Sufficient allowance available');
      }

      // Step 4: Execute stop-loss deposit
      console.log('🚀 Executing stop-loss deposit...');
      toast.loading('Please confirm stop-loss transaction in MetaMask...', { id: 'stopLossDeposit' });
      
      const connectedContract = contract.connect(signer);
      
      const gasEstimate = await connectedContract.depositStopLoss.estimateGas(tokenName, amountWei, thresholdWei);
      console.log('⛽ Stop-loss gas estimate:', gasEstimate.toString());

      const tx = await connectedContract.depositStopLoss(tokenName, amountWei, thresholdWei);
      console.log('✅ Stop-loss transaction submitted:', tx.hash);
      
      toast.loading(
        <div>
          <div>Stop-loss order submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'stopLossDeposit' }
      );

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
        toast.error(`Stop-loss deposit failed: ${error.message}`, { id: 'stopLossDeposit' });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, address, checkTokenBalance, checkTokenAllowance, approveToken]);

  // Withdraw function (unchanged)
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
      
      const connectedContract = contract.connect(signer);
      
      toast.loading('Preparing withdrawal...', { id: 'withdraw' });

      const gasEstimate = await connectedContract.withdraw.estimateGas(tokenName, amountWei);
      console.log('⛽ Estimated gas:', gasEstimate.toString());

      console.log('🚀 Executing withdrawal...');
      toast.loading('Please confirm withdrawal in MetaMask...', { id: 'withdraw' });
      
      const tx = await connectedContract.withdraw(tokenName, amountWei);
      console.log('✅ Withdrawal submitted:', tx.hash);
      
      toast.loading(
        <div>
          <div>Withdrawal submitted!</div>
          <div className="text-xs text-gray-400">Hash: {tx.hash.slice(0, 10)}...</div>
        </div>, 
        { id: 'withdraw' }
      );

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
      const tokenDecimals = 18;
      const mintAmount = await readOnlyContract.convertToMintAmount(
        depositWei,
        tokenDecimals,
        reserveWei,
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
    // Token functions
    checkTokenAllowance,
    checkTokenBalance,
    approveToken,
    getTokenContract,
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