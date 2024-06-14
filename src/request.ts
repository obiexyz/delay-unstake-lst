import data from './sanctum-lst-list.json';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, sendAndConfirmTransaction, Keypair, SystemProgram, StakeProgram } from '@solana/web3.js';
import * as SinglePoolProgram from'@solana/spl-single-pool';

// https://spl.solana.com/single-pool#using-a-single-validator-pool

export const withdrawStakeFunc = async (connection, stakePool, wallet, amount) => {  
    // Generate a new random keypair
    const keypair = Keypair.generate();

    console.log('Public key:', keypair.publicKey.toString());
    console.log('Secret key:', keypair.secretKey.toString());

    console.log("withdrawStakeFunc:", 
        "connection:", connection, 
        "Stake Pool:", stakePool, 
        "Wallet:", wallet, 
        "Amount:", amount);

    const transaction = await SinglePoolProgram.withdrawTransaction({
    rpc: connection,
    pool: stakePool,
    userWallet: wallet,
    userStakeAccount: keypair.publicKey,
    tokenAmount: amount,
    createStakeAccount: true,
    });

    // sign the transaction
    // transaction.partialSign(keypair);

    // convert the wallet from a public key to a keypair
    // assuming the wallet is a string of the private key
    // const walletKeypair = Keypair.fromSecretKey(new Uint8Array(wallet.split(',').map(Number)));

    // sign the transaction with the wallet keypair
    // transaction.sign(walletKeypair);

    // send the transaction and get the transaction id
    // const txid = await connection.sendAndConfirmTransaction(transaction);

    // console.log('Transaction sent:', txid);


// sign with fee payer, and the stake account keypair if a new account is being created
}