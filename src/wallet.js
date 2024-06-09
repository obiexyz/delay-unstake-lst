import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export function useCustomWallet() {
    const { publicKey, connect, disconnect } = useWallet();
    const { connection } = useConnection();
    const [balance, setBalance] = useState(0);

    async function updateBalance() {
        if (publicKey && connection) {
            const balance = await connection.getBalance(new PublicKey(publicKey.toBase58()));
            setBalance(balance);
        }
    }

    return {
        publicKey: publicKey ? publicKey.toBase58() : '',
        balance,
        connect,
        disconnect,
        updateBalance,
    };
}

export function WalletComponent() {
    const { wallet, publicKey, balance, connect, disconnect, updateBalance } = useCustomWallet();

    return (
        <div>
            <button onClick={connect}>Connect</button>
            <button onClick={disconnect}>Disconnect</button>
            <button onClick={updateBalance}>Update Balance</button>
            <p>Public Key: {publicKey}</p>
            <p>Balance: {balance}</p>
        </div>
    );
}