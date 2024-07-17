import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL,
  StakeProgram,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as borsh from 'borsh';
import BN from 'bn.js';

const STAKE_POOL_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY');

class WithdrawStakeArgs {
  instruction: number;
  poolTokens: BN;

  constructor(poolTokens: BN) {
    this.instruction = 10; // WithdrawStake instruction index
    this.poolTokens = poolTokens;
  }

  static schema: borsh.Schema = {
    struct: {
      instruction: 'u8',
      poolTokens: 'u64',
    }
  };
}

interface WithdrawStakeParams {
  stakePool: PublicKey;
  validatorList: PublicKey;
  withdrawAuthority: PublicKey;
  validatorStake: PublicKey;
  destinationStake: PublicKey;
  destinationStakeAuthority: PublicKey;
  sourceTransferAuthority: PublicKey;
  sourcePoolAccount: PublicKey;
  managerFeeAccount: PublicKey;
  poolMint: PublicKey;
  poolTokens: BN;
}

class StakePoolInstruction {
  static withdrawStake(params: WithdrawStakeParams): TransactionInstruction {
    const {
      stakePool,
      validatorList,
      withdrawAuthority,
      validatorStake,
      destinationStake,
      destinationStakeAuthority,
      sourceTransferAuthority,
      sourcePoolAccount,
      managerFeeAccount,
      poolMint,
      poolTokens,
    } = params;

    const args = new WithdrawStakeArgs(poolTokens);
    const data = borsh.serialize(WithdrawStakeArgs.schema, args);

    const keys = [
      { pubkey: stakePool, isSigner: false, isWritable: true },
      { pubkey: validatorList, isSigner: false, isWritable: true },
      { pubkey: withdrawAuthority, isSigner: false, isWritable: false },
      { pubkey: validatorStake, isSigner: false, isWritable: true },
      { pubkey: destinationStake, isSigner: false, isWritable: true },
      { pubkey: destinationStakeAuthority, isSigner: false, isWritable: false },
      { pubkey: sourceTransferAuthority, isSigner: true, isWritable: false },
      { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
      { pubkey: managerFeeAccount, isSigner: false, isWritable: true },
      { pubkey: poolMint, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: StakeProgram.programId, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: STAKE_POOL_PROGRAM_ID,
      data: Buffer.from(data),
    });
  }
}

export const withdrawStakeFunc = async (
  connection: Connection,
  stakePoolAddress: string,
  userWallet: Keypair,
  userPoolTokenAccount: string,
  destinationStakeAccount: string,
  amount: number
): Promise<string> => {
  console.log('withdrawStakeFunc input parameters:', {
    stakePoolAddress,
    userWallet: userWallet.publicKey.toBase58(),
    userPoolTokenAccount,
    destinationStakeAccount,
    amount
  });

  const stakePoolPubkey = new PublicKey(stakePoolAddress);
  const userPoolTokenPubkey = new PublicKey(userPoolTokenAccount);
  const destinationStakePubkey = new PublicKey(destinationStakeAccount);

  // Convert the amount to lamports
  const poolTokens = new BN(Math.round(amount * LAMPORTS_PER_SOL));
  console.log('Pool tokens to withdraw:', poolTokens.toString());

  // Fetch the stake pool account data
  const stakePoolAccount = await connection.getAccountInfo(stakePoolPubkey);
  if (!stakePoolAccount) {
    throw new Error('Stake pool account not found');
  }

  // Parse the stake pool data (you'll need to implement this based on your stake pool structure)
  const stakePool = parseStakePoolData(stakePoolAccount.data);

  // Derive the withdraw authority PDA
  const [withdrawAuthority] = await PublicKey.findProgramAddress(
    [stakePoolPubkey.toBuffer(), Buffer.from('withdraw')],
    STAKE_POOL_PROGRAM_ID
  );

  // Create the withdraw instruction
  const withdrawInstruction = StakePoolInstruction.withdrawStake({
    stakePool: stakePoolPubkey,
    validatorList: stakePool.validatorList,
    withdrawAuthority,
    validatorStake: stakePool.validatorStake, // You'll need to choose which validator stake account to withdraw from
    destinationStake: destinationStakePubkey,
    destinationStakeAuthority: userWallet.publicKey,
    sourceTransferAuthority: userWallet.publicKey,
    sourcePoolAccount: userPoolTokenPubkey,
    managerFeeAccount: stakePool.managerFeeAccount,
    poolMint: stakePool.poolMint,
    poolTokens,
  });

  // Create and send the transaction
  const transaction = new Transaction().add(withdrawInstruction);
  transaction.feePayer = userWallet.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  console.log('Transaction:', {
    recentBlockhash: transaction.recentBlockhash,
    feePayer: transaction.feePayer.toBase58(),
    instructions: transaction.instructions.length
  });

  const signature = await sendAndConfirmTransaction(connection, transaction, [userWallet]);

  console.log('Withdraw transaction signature:', signature);
  return signature;
};

// You'll need to implement this function based on your stake pool structure
function parseStakePoolData(data: Buffer): any {
  // Implement parsing logic here
  throw new Error('parseStakePoolData not implemented');
}