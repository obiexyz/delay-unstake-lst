import { 
    Connection, 
    PublicKey, 
    Transaction, 
    TransactionInstruction, 
    SYSVAR_CLOCK_PUBKEY,
    SystemProgram,
  } from '@solana/web3.js';
  import { findStakePool } from './tx-utils.ts';
  import data from './sanctum-lst-list.json';
  import { Buffer } from 'buffer';
  
  // Constants from the Sanctum Unstake Program
  const SANCTUM_UNSTAKE_PROGRAM_ID = new PublicKey('SUnMP8esPBfyPKc2yJ5io1W7wUEWnT7AzXb2m2oVukh');
  const RENT_SYSVAR_ID = new PublicKey('SysvarRent111111111111111111111111111111111');
  
  export const withdrawStakeFunc = async (
    connection: Connection,
    tokenAddress: string,
    walletPublicKey: PublicKey,
    amount: number,
    sendTransaction: (transaction: Transaction) => Promise<string>
  ) => {
    // Find the stake pool address for the given token
    const stakePoolAddress = findStakePool(tokenAddress, data);
    if (!stakePoolAddress) {
      throw new Error('Stake pool not found for the given token');
    }
  
    const stakePoolPubkey = new PublicKey(stakePoolAddress);
  
    // Derive the unstake account PDA
    const unstakeAccountSeeds = [
      Buffer.from('unstake'),
      stakePoolPubkey.toBuffer(),
      walletPublicKey.toBuffer()
    ];
    const [unstakeAccount] = await PublicKey.findProgramAddress(
      unstakeAccountSeeds,
      SANCTUM_UNSTAKE_PROGRAM_ID
    );
  
    // Derive the stake account PDA
    const stakeAccountSeeds = [
      Buffer.from('stake'),
      stakePoolPubkey.toBuffer()
    ];
    const [stakeAccount] = await PublicKey.findProgramAddress(
      stakeAccountSeeds,
      SANCTUM_UNSTAKE_PROGRAM_ID
    );
  
    // Create the instruction data
    const instructionData = Buffer.alloc(9);
    instructionData.writeUInt8(0, 0); // Instruction index for Unstake
    instructionData.writeBigUInt64LE(BigInt(amount), 1);
  
    const unstakeIx = new TransactionInstruction({
      programId: SANCTUM_UNSTAKE_PROGRAM_ID,
      keys: [
        { pubkey: stakePoolPubkey, isSigner: false, isWritable: true },
        { pubkey: unstakeAccount, isSigner: false, isWritable: true },
        { pubkey: stakeAccount, isSigner: false, isWritable: true },
        { pubkey: walletPublicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false },
      ],
      data: instructionData
    });
  
    // Create a new transaction and add the unstake instruction
    const transaction = new Transaction().add(unstakeIx);
  
    // Send the transaction
    try {
      const signature = await sendTransaction(transaction);
      console.log('Unstake transaction signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error sending unstake transaction:', error);
      throw error;
    }
  };