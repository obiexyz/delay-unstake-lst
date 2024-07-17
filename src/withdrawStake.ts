import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  Connection,
  StakeProgram,
  Keypair,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';

import { StakePoolLayout } from './layouts';
import { StakePoolInstruction } from './instructions';
import { STAKE_POOL_PROGRAM_ID } from './constants';
import { findStakeProgramAddress, findWithdrawAuthorityProgramAddress } from './utils/utils_index';

export async function withdrawStake(
  connection: Connection,
  stakePoolAddress: PublicKey,
  userWallet: PublicKey,
  userPoolTokenAccount: PublicKey,
  amount: number
): Promise<Transaction> {
  console.log('Withdraw Stake function called with:');
  console.log('Stake Pool Address:', stakePoolAddress.toBase58());
  console.log('User Wallet:', userWallet.toBase58());
  console.log('User Pool Token Account:', userPoolTokenAccount.toBase58());
  console.log('Amount:', amount);
  console.log('STAKE_POOL_PROGRAM_ID:', STAKE_POOL_PROGRAM_ID.toBase58());

  const stakePoolAccount = await connection.getAccountInfo(stakePoolAddress);
  if (!stakePoolAccount) {
    throw new Error('Stake pool not found');
  }

  const stakePool = StakePoolLayout.decode(stakePoolAccount.data);
  console.log('Decoded Stake Pool:', stakePool);

  const withdrawAuthority = await findWithdrawAuthorityProgramAddress(
    STAKE_POOL_PROGRAM_ID,
    stakePoolAddress
  );
  console.log('Withdraw Authority:', withdrawAuthority.toBase58());

  // Create a new stake account owned by the user
  const newStakeAccount = Keypair.generate();
  const lamports = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: userWallet,
    newAccountPubkey: newStakeAccount.publicKey,
    lamports,
    space: StakeProgram.space,
    programId: StakeProgram.programId,
  });
  console.log('New Stake Account:', newStakeAccount.publicKey.toBase58());

  // Initialize the stake account
  const initializeInstruction = StakeProgram.initialize({
    stakePubkey: newStakeAccount.publicKey,
    authorized: {
      staker: userWallet,
      withdrawer: userWallet,
    },
  });

  // Find the validator stake account
  const validatorStake = await findStakeProgramAddress(
    STAKE_POOL_PROGRAM_ID,
    stakePool.validatorList,
    stakePoolAddress
  );
  console.log('Validator Stake:', validatorStake.toBase58());

  // Create the withdraw stake instruction using the StakePoolInstruction from instructions.ts
  const withdrawInstruction = StakePoolInstruction.withdrawStake({
    stakePool: stakePoolAddress,
    validatorList: stakePool.validatorList,
    validatorStake,
    destinationStake: newStakeAccount.publicKey,
    destinationStakeAuthority: userWallet,
    sourceTransferAuthority: userWallet,
    sourcePoolAccount: userPoolTokenAccount,
    managerFeeAccount: stakePool.managerFeeAccount,
    poolMint: stakePool.poolMint,
    poolTokens: amount,
    withdrawAuthority,
  });
  console.log('Withdraw Instruction:', withdrawInstruction);

  const transaction = new Transaction()
    .add(createAccountInstruction)
    .add(initializeInstruction)
    .add(withdrawInstruction);

  transaction.feePayer = userWallet;
  let { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log('Transaction:', transaction);

  return transaction;
}