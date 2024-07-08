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
    const { connection } = useConnection();
    const { wallet, publicKey, connect, connected, sendTransaction } = useWallet();    
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState('');
    const [amount, setAmount] = useState(0);
    const [lstArray, setLstArray] = useState(data.sanctum_lst_list);
    const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);

    console.log('Pre-UseEffect- Wallet:', wallet);
    console.log('Pre-UseEffect- Connection:', connected);
    console.log("Pre-UseEffect- RPC Node:", process.env.REACT_APP_IRONFORGE_ENDPOINT);
    console.log("Pre-UseEffect- Public Key (useWallet):", publicKey);

    useEffect(() => {
        console.log('useEffect- running, wallet, connected, or walletAddress changed.');
        if (wallet && connected) {
            console.log('useEffect- Wallet Adapter Output:', wallet.adapter.wallet.accounts[0].address);
            console.log('useEffect- Wallet public key:', publicKey);
     
            // Fetch the token balances
            fetchTokens().then((fetchedTokens) => {
                console.log('useEffect- fetchTokenHeliusAPI:', fetchedTokens);
    
                // Map the fetched tokens to the LST list
                const tokens = lstArray.map(lst => {
                    const fetchedToken = fetchedTokens.result.items.find(item => item.id === lst.mint);
                    return {
                        symbol: lst.symbol,
                        balance: fetchedToken ? fetchedToken.token_info.balance / LAMPORTS_PER_SOL : 0, // Convert lamports to SOL
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
            });
        }
    }, [wallet, connected, walletAddress]);

    const handleUnstake = async () => {
        if (!publicKey || !selectedToken) {
            console.log('Wallet not connected or no token selected');
            return;
        }
        
        console.log(`Unstaking ${amount} of ${selectedToken}`);
        const amountLamports = amount * LAMPORTS_PER_SOL; // Convert SOL to lamports

        try {
            const signature = await withdrawStakeFunc(
                connection,
                selectedToken, // This is now the token address, not the stake pool address
                publicKey,
                amountLamports,
                sendTransaction
            );
            console.log('Unstake Transaction:', signature);
        } catch (error) {
            console.error('Error unstaking:', error);
        }
    };

    useEffect(() => {
        const selectedTokenData = tokens.find(token => token.id === selectedToken);
        if (selectedTokenData) {
            setSelectedTokenBalance(selectedTokenData.balance);
        }
    }, [selectedToken, tokens]);

    return (
        <div>
            <h1>Unstake</h1>
            {connected ? (
                <>
                    <select 
                        onChange={(e) => {
                            if (wallet && wallet.connected) {
                                const selectedTokenId = e.target.value;
                                setSelectedToken(selectedTokenId);
                            }
                        }}
                        value={selectedToken}
                    >
                        {tokens.map((token, index) => (
                            <option key={index} value={token.id}>
                                {`${token.symbol} (${token.balance.toFixed(2)})`}
                            </option>
                        ))}
                    </select>
                    <p className="clickable" onClick={() => setAmount(selectedTokenBalance)}>Max: {selectedTokenBalance}</p>
                    <input 
                        type="text" 
                        value={amount} 
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!isNaN(val) && !isNaN(parseFloat(val))) {
                                setAmount(parseFloat(val));
                            }
                        }} 
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