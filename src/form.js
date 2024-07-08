import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useFetchTokens } from './fetchTokens.js';
import { withdrawStakeFunc } from './request.ts';
import data from './sanctum-lst-list.json';

const InputForm = () => {
    const { tokens, isLoading, error, refetch } = useFetchTokens();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [selectedToken, setSelectedToken] = useState('');
    const [amount, setAmount] = useState(0);
    const [lstArray] = useState(data.sanctum_lst_list);
    const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);

    useEffect(() => {
        if (publicKey) {
            console.log('Wallet connected:', publicKey.toBase58());
            console.log('Using RPC endpoint:', connection.rpcEndpoint);
        }
    }, [publicKey, connection]);

    useEffect(() => {
        if (tokens.length > 0) {
            const filteredTokens = lstArray.map(lst => {
                const fetchedToken = tokens.find(token => token.id === lst.mint);
                return {
                    symbol: lst.symbol,
                    balance: fetchedToken ? fetchedToken.balance : 0,
                    icon: lst.logo_uri,
                    id: lst.mint
                };
            }).filter(token => token.balance > 0);

            filteredTokens.sort((a, b) => b.balance - a.balance);

            if (filteredTokens.length > 0) {
                setSelectedToken(filteredTokens[0].id);
                setSelectedTokenBalance(filteredTokens[0].balance);
            }
        }
    }, [tokens, lstArray]);

    const handleUnstake = async () => {
        if (!publicKey || !selectedToken) {
            console.log('Wallet not connected or no token selected');
            return;
        }
        
        console.log(`Unstaking ${amount} of ${selectedToken}`);
        const amountLamports = amount * LAMPORTS_PER_SOL;

        try {
            const transaction = await withdrawStakeFunc(
                connection,
                selectedToken,
                publicKey,
                amountLamports
            );

            const signature = await sendTransaction(transaction, connection);
            console.log('Unstake Transaction signature:', signature);

            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            console.log('Transaction confirmed:', confirmation);

            // Refetch tokens after unstaking
            refetch();
        } catch (error) {
            console.error('Error unstaking:', error);
        }
    };

    if (isLoading) {
        return <div>Loading tokens...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const filteredTokens = lstArray.filter(lst => 
        tokens.some(token => token.id === lst.mint && token.balance > 0)
    );

    return (
        <div>
            <h1>Unstake</h1>
            {publicKey ? (
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
                        {filteredTokens.map((token, index) => {
                            const fetchedToken = tokens.find(t => t.id === token.mint);
                            return (
                                <option key={index} value={token.mint}>
                                    {`${token.symbol} (${fetchedToken ? fetchedToken.balance.toFixed(4) : '0'})`}
                                </option>
                            );
                        })}
                    </select>
                    <p className="clickable" onClick={() => setAmount(selectedTokenBalance)}>Max: {selectedTokenBalance.toFixed(4)}</p>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(Number(e.target.value))} 
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