import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import { findStakePool } from './tx-utils.ts';
import data from './sanctum-lst-list.json';
import { Buffer } from 'buffer';

const SINGLE_POOL_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY');
const SYSVAR_STAKE_HISTORY_PUBKEY = new PublicKey('SysvarStakeHistory1111111111111111111111111');

export const withdrawStakeFunc = async (
  connection: Connection,
  poolAddress: string,
  walletPublicKey: PublicKey,
  amount: number
): Promise<Transaction> => {
  // Find the stake pool address for the given token
  const poolPubkey = new PublicKey(poolAddress);

  // Convert the amount to lamports (or equivalent base units)
  const amountInLamports = BigInt(Math.round(amount * LAMPORTS_PER_SOL));

  // Create the instruction data
  const instructionData = Buffer.alloc(9);
  instructionData.writeUInt8(0, 0); // Instruction index for Unstake
  instructionData.writeBigUInt64LE(amountInLamports, 1);

  // Derive the stake account PDA
  const [stakeAccount] = await PublicKey.findProgramAddress(
    [Buffer.from('stake_account')],
    SINGLE_POOL_PROGRAM_ID
  );

  const unstakeIx = new TransactionInstruction({
    programId: SINGLE_POOL_PROGRAM_ID,
    keys: [
      { pubkey: poolPubkey, isSigner: false, isWritable: true },
      { pubkey: stakeAccount, isSigner: false, isWritable: true },
      { pubkey: walletPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_STAKE_HISTORY_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: instructionData
  });

  // Create a new transaction and add the unstake instruction
  const transaction = new Transaction().add(unstakeIx);

  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletPublicKey;

  return transaction;
};