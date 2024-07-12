import React, { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, AccountInfo, Transaction, SendTransactionOptions, TransactionSignature } from '@solana/web3.js';
import { useFetchTokens } from './fetchTokens.js';
import { withdrawStakeFunc } from './request.ts';
import data from './sanctum-lst-list.json';
import { findStakePool } from './tx-utils.ts';

console.log('Sanctum LST List:', data);

const InputForm = () => {
    const fetchTokens = useFetchTokens();
    const {wallet, publicKey, connect, connected, sendTransaction } = useWallet();
    const { connection } = useConnection();    
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState('');
    const [amount, setAmount] = useState(0);
    const [lstArray, setLstArray] = useState(data.sanctum_lst_list);
    const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    console.log('Pre-UseEffect- Wallet:', wallet);
    console.log('Pre-UseEffect- Connected:', connected);
    console.log("Pre-UseEffect- RPC Node:", process.env.REACT_APP_IRONFORGE_ENDPOINT);
    console.log("Pre-UseEffect- Public Key (useWallet):", publicKey);

    useEffect(() => {
        console.log('useEffect- running, wallet, connected, or walletAddress changed.');
        if (wallet && connected) {
            console.log('useEffect- Wallet Adapter Output:', wallet.adapter.wallet.accounts[0].address);
            console.log('useEffect- Wallet public key:', publicKey);
     
            setIsLoading(true);
            setError(null);

            // Fetch the token balances
            fetchTokens().then((fetchedTokens) => {
                console.log('useEffect- fetchTokenHeliusAPI:', fetchedTokens);
    
                if (fetchedTokens && fetchedTokens.result && Array.isArray(fetchedTokens.result.items)) {
                    // Map the fetched tokens to the LST list
                    const tokens = lstArray.map(lst => {
                        const fetchedToken = fetchedTokens.result.items.find(item => item.id === lst.mint);
                        return {
                            symbol: lst.symbol,
                            balance: fetchedToken && fetchedToken.token_info ? parseFloat(fetchedToken.token_info.balance) / Math.pow(10, fetchedToken.token_info.decimals) : 0,
                            icon: lst.logo_uri,
                            id: lst.mint
                        };
                    });
    
                    // Sort the tokens by balance
                    tokens.sort((a, b) => b.balance - a.balance);
    
                    setTokens(tokens);
                    console.log('useEffect- Tokens:', tokens);
                    if (tokens.length > 0) {
                        setSelectedToken(tokens[0].id);
                        setSelectedTokenBalance(tokens[0].balance);
                    }
                } else {
                    console.error('Unexpected structure in fetchedTokens:', fetchedTokens);
                    setError('Failed to fetch token data. Please try again later.');
                }
            }).catch((error) => {
                console.error('Error fetching tokens:', error);
                setError('Failed to fetch token data. Please try again later.');
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [wallet, connected, walletAddress]);

    const handleUnstake = async () => {
        if (!publicKey || !selectedToken) {
            console.log('Wallet not connected or no token selected');
            return;
        }
    
        console.log(`Unstaking ${amount} of ${selectedToken}`);
        
        try {
            // Find the pool address for the selected token
            const poolAddress = data.sanctum_lst_list.find(token => token.mint === selectedToken)?.pool?.pool;

            if (!poolAddress) {
                throw new Error('Pool address not found for the selected token');
            }
            

            let transaction = await withdrawStakeFunc(
                connection,
                poolAddress,
                publicKey,
                Number(amount)
            );
            console.log('Unstake Transaction:', transaction);
            const signature = await sendTransaction(transaction, connection);
            console.log('Sending transaction...');
            await connection.confirmTransaction(signature, 'processed');
            console.log('Unstake Transaction signature:', signature);

        } catch (error) {
            console.error('Error unstaking:', error);
            setError(`Failed to unstake. Error: ${error.message}`);
        }
    };

    useEffect(() => {
        const selectedTokenData = tokens.find(token => token.id === selectedToken);
        if (selectedTokenData) {
            setSelectedTokenBalance(selectedTokenData.balance);
        }
    }, [selectedToken, tokens]);

    if (isLoading) {
        return <div>Loading tokens...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Unstake</h1>
            {connected ? (
                <>
                    <select 
                        onChange={(e) => {
                            const selectedTokenId = e.target.value;
                            setSelectedToken(selectedTokenId);
                            const selectedTokenData = tokens.find(token => token.id === selectedTokenId);
                            if (selectedTokenData) {
                                setSelectedTokenBalance(selectedTokenData.balance);
                            }
                        }}
                        value={selectedToken}
                    >
                        {tokens.map((token, index) => (
                            <option key={index} value={token.id}>
                                {`${token.symbol} (${token.balance.toFixed(4)})`}
                            </option>
                        ))}
                    </select>
                    <p className="clickable" onClick={() => setAmount(selectedTokenBalance)}>Max: {selectedTokenBalance.toFixed(4)}</p>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                                setAmount(val);
                            }
                        }} 
                        step="0.0001"
                        min="0"
                        max={selectedTokenBalance}
                    />
                    <button onClick={handleUnstake}>Unstake LST</button>
                </>
            ) : (
                <p>Please connect your wallet to launch app</p>
            )}
        </div>
    );
};

export default InputForm;