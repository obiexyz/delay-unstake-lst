import data from './sanctum-lst-list.json';
const solanaWeb3 = require('@solana/web3.js');
console.log(solanaWeb3);
const solanaStakePool = require('@solana/spl-stake-pool');
console.log(solanaStakePool);

const { Connection, Transaction, Keypair, SystemProgram, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction, TransactionInstruction } = solanaWeb3;
const { getStakePoolAccount, updateStakePool, depositSol, depositStake, withdrawSol, withdrawStake, stakePoolInfo, findStakePoolFromTokenMint } = solanaStakePool;

export function findStakePool(tokenAddress: string, data: any): string | null {
    console.log('Finding stake pool for token:', tokenAddress);
    console.log('Data:', JSON.stringify(data, null, 2));

    // Ensure that sanctum_lst_list exists and is an array
    if (!data.sanctum_lst_list || !Array.isArray(data.sanctum_lst_list)) {
        console.log('Invalid data structure: sanctum_lst_list is missing or not an array');
        return null;
    }

    // Find the token in the sanctum_lst_list array
    const token = data.sanctum_lst_list.find((item: any) => item.mint === tokenAddress);

    // If the token was found and it has a pool property with a pool address, return the pool address
    if (token && token.pool && token.pool.pool) {
        console.log('Found stake pool:', token.pool.pool);
        return token.pool.pool;
    }

    // If the token was not found or it doesn't have the expected pool structure, return null
    console.log('Stake pool not found for token:', tokenAddress);
    return null;
}

// https://docs.solanalabs.com/cli/examples/delegate-stake#create-a-stake-account