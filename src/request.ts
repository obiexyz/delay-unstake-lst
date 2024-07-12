import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL,
  SystemProgram,
  StakeProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Buffer } from 'buffer';

const SINGLE_POOL_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY');

export const withdrawStakeFunc = async (
  connection: Connection,
  poolAddress: string,
  userPublicKey: PublicKey,
  poolTokenMint: PublicKey,
  amount: number
): Promise<Transaction> => {
  const poolPubkey = new PublicKey(poolAddress);

  // Convert the amount to lamports
  const amountInLamports = Math.round(amount * LAMPORTS_PER_SOL);

  // Create a new stake account
  const newStakeAccount = Keypair.generate();
  const createStakeAccountIx = StakeProgram.createAccount({
    fromPubkey: userPublicKey,
    stakePubkey: newStakeAccount.publicKey,
    authorized: {
      staker: userPublicKey,
      withdrawer: userPublicKey
    },
    lamports: await connection.getMinimumBalanceForRentExemption(StakeProgram.space),
    lockup: {
      epoch: 0,
      unixTimestamp: 0,
      custodian: PublicKey.default
    }
  });

  // Get the associated token account for the user's pool tokens
  const [userTokenAccount] = await PublicKey.findProgramAddress(
    [userPublicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), poolTokenMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Create the associated token account if it doesn't exist
  const createAtaIx = new TransactionInstruction({
    keys: [
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userPublicKey, isSigner: false, isWritable: false },
      { pubkey: poolTokenMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });

  // Derive necessary addresses
  const [poolStakeAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('stake'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );

  const [poolMintAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('mint'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );

  const [poolStakeAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from('stake_authority'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );

  const [poolMintAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from('mint_authority'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );

  // Create the instruction data
  const instructionData = Buffer.alloc(1 + 32 + 8);
  instructionData.writeUInt8(4, 0); // Instruction index for WithdrawStake
  userPublicKey.toBuffer().copy(instructionData, 1);
  instructionData.writeBigUInt64LE(BigInt(amountInLamports), 33);

  const withdrawStakeIx = new TransactionInstruction({
    programId: SINGLE_POOL_PROGRAM_ID,
    keys: [
      { pubkey: poolPubkey, isSigner: false, isWritable: false },
      { pubkey: poolStakeAddress, isSigner: false, isWritable: true },
      { pubkey: poolMintAddress, isSigner: false, isWritable: true },
      { pubkey: poolStakeAuthority, isSigner: false, isWritable: false },
      { pubkey: poolMintAuthority, isSigner: false, isWritable: false },
      { pubkey: newStakeAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: StakeProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData
  });

  // Create a new transaction and add all instructions
  const transaction = new Transaction()
    .add(createStakeAccountIx)
    .add(createAtaIx)
    .add(withdrawStakeIx);

  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPublicKey;

  // Partially sign the transaction with the new stake account
  transaction.partialSign(newStakeAccount);

  return transaction;
};