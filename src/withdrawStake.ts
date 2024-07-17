import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
  Connection,
  StakeProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';

// Import from existing files
import { StakePoolLayout } from './layouts';
import {
  STAKE_POOL_INSTRUCTION_LAYOUTS,
  StakePoolInstruction,
} from './instructions';
import { STAKE_POOL_PROGRAM_ID } from './constants';
import { encodeData } from './utils/utils_index';

export async function createWithdrawStakeInstruction(
  stakePool: PublicKey,
  validatorList: PublicKey,
  withdrawAuthority: PublicKey,
  stakeToSplit: PublicKey,
  stakeToReceive: PublicKey,
  userStakeAuthority: PublicKey,
  userTransferAuthority: PublicKey,
  userPoolToken: PublicKey,
  managerFeeAccount: PublicKey,
  poolMint: PublicKey,
  lamports: number,
): Promise<TransactionInstruction> {
  const dataLayout = STAKE_POOL_INSTRUCTION_LAYOUTS.WithdrawStake;
  const data = encodeData(dataLayout, {
    instruction: StakePoolInstruction.withdrawStake,
    lamports: new BN(lamports),
  });

  const keys = [
    { pubkey: stakePool, isSigner: false, isWritable: true },
    { pubkey: validatorList, isSigner: false, isWritable: true },
    { pubkey: withdrawAuthority, isSigner: false, isWritable: false },
    { pubkey: stakeToSplit, isSigner: false, isWritable: true },
    { pubkey: stakeToReceive, isSigner: false, isWritable: true },
    { pubkey: userStakeAuthority, isSigner: false, isWritable: false },
    { pubkey: userTransferAuthority, isSigner: true, isWritable: false },
    { pubkey: userPoolToken, isSigner: false, isWritable: true },
    { pubkey: managerFeeAccount, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: StakeProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: STAKE_POOL_PROGRAM_ID,
    keys,
    data,
  });
}

export async function withdrawStake(
  connection: Connection,
  stakePoolAddress: PublicKey,
  userWallet: PublicKey,
  userPoolTokenAccount: PublicKey,
  amount: number
): Promise<Transaction> {
  const stakePoolAccount = await connection.getAccountInfo(stakePoolAddress);
  if (!stakePoolAccount) {
    throw new Error('Stake pool not found');
  }

  const stakePool = StakePoolLayout.decode(stakePoolAccount.data);

  const [withdrawAuthority] = await PublicKey.findProgramAddress(
    [stakePoolAddress.toBuffer(), Buffer.from('withdraw')],
    STAKE_POOL_PROGRAM_ID
  );

  const withdrawInstruction = await createWithdrawStakeInstruction(
    stakePoolAddress,
    stakePool.validatorList,
    withdrawAuthority,
    stakePool.reserveStake,
    stakePool.reserveStake, // Using reserve stake as stakeToReceive for simplicity
    userWallet,
    userWallet,
    userPoolTokenAccount,
    stakePool.managerFeeAccount,
    stakePool.poolMint,
    amount
  );

  const transaction = new Transaction().add(withdrawInstruction);

  return transaction;
}