import data from './sanctum-lst-list.json';
const solanaWeb3 = require('@solana/web3.js');
console.log(solanaWeb3);
const solanaStakePool = require('@solana/spl-stake-pool');
console.log(solanaStakePool);
// const fetch = require('node-fetch');
// console.log(fetch);

// `solanaWeb3` is provided in the global namespace by the script bundle
console.log(solanaWeb3);
// `solanaStakePool` is provided in the global namespace by the script bundle
console.log(solanaStakePool);
// `fetch` is provided in the global namespace by the browser
// console.log(fetch); // Disabling because it may already be included


const { Connection, Transaction, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction, TransactionInstruction } = solanaWeb3;
const { getStakePoolAccount, updateStakePool, depositSol, depositStake, withdrawSol, withdrawStake, stakePoolInfo, findStakePoolFromTokenMint } = solanaStakePool;

export function findStakePool(tokenAddress, data) {
    // Find the token in the data array
    const token = data.sanctum_lst_list.find(item => item.mint === tokenAddress);

    // If the token was found and it has a pool property, return the pool address
    if (token && token.pool) {
        return token.pool.pool;
    }

    // If the token was not found or it doesn't have a pool property, return null
    return null;
}

// https://docs.solanalabs.com/cli/examples/delegate-stake#create-a-stake-account
