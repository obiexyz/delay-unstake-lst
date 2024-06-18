import data from './sanctum-lst-list.json';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, sendAndConfirmTransaction, Keypair, SystemProgram, StakeProgram, TransactionInstruction } from '@solana/web3.js';

import {withdrawStakeInstruction, withdrawTransaction} from '@solana/spl-single-pool';

export const withdrawStakeFunc = async (connection, stakePool, wallet, amount, sendTransaction) => {  
    // Generate a new random keypair
    const keypair = Keypair.generate();

    console.log('Public key:', keypair.publicKey.toString());
    console.log('Secret key:', keypair.secretKey.toString());
    let walletString = wallet.toBase58();
    console.log("withdrawStakeFunc:", 
        "connection:", connection, 
        "Stake Pool:", stakePool, 
        "UserStakeAccount:", keypair.publicKey,
        "Wallet:", walletString, 
        "Amount:", amount);

    // Ensure wallet is a string
    if (typeof walletString !== 'string') {
        console.error('Wallet must be a string');
        return;
    }

    
    const instruction = await withdrawStakeInstruction({
        // rpc: connection,
        pool: stakePool,
        userStakeAccount: keypair.publicKey.toBase58(),
        userStakeAuthority: walletString,
        userTokenAccount: 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v',
        tokenAmount: amount,
        // createStakeAccount: true,
    });
    
    const transaction = new Transaction();
    transaction.add(new TransactionInstruction(instruction));

    const signature = await connection.sendTransaction(transaction, [wallet]);
    console.log('Transaction signature:', signature);
}