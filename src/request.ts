import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction, 
  SYSVAR_CLOCK_PUBKEY,
  LAMPORTS_PER_SOL,
  StakeProgram,
  Keypair,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as borsh from 'borsh';

const SINGLE_POOL_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY');

class WithdrawStakeArgs {
  instruction: number;
  amount: bigint;

  constructor(amount: bigint) {
    this.instruction = 4; // WithdrawStake instruction index
    this.amount = amount;
  }

  static schema: borsh.Schema = {
    struct: {
      instruction: 'u8',
      amount: 'u64',
    }
  };
}

export const withdrawStakeFunc = async (
  connection: Connection,
  poolAddress: string,
  userPublicKey: PublicKey,
  userTokenAccount: string,
  userStakeAccount: string,
  amount: number
): Promise<Transaction> => {
  console.log('withdrawStakeFunc input parameters:', {
    poolAddress,
    userPublicKey: userPublicKey.toBase58(),
    userTokenAccount,
    userStakeAccount,
    amount
  });

  const poolPubkey = new PublicKey(poolAddress);
  const userTokenPubkey = new PublicKey(userTokenAccount);
  const userStakePubkey = new PublicKey(userStakeAccount);

  // Convert the amount to lamports
  const amountInLamports = BigInt(Math.round(amount * LAMPORTS_PER_SOL));
  console.log('Amount in lamports:', amountInLamports.toString());

  // Derive necessary addresses
  const [poolStakeAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  console.log('Pool Stake Address:', poolStakeAddress.toBase58());

  const [poolMintAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  console.log('Pool Mint Address:', poolMintAddress.toBase58());

  const [poolStakeAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake_authority'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  console.log('Pool Stake Authority:', poolStakeAuthority.toBase58());

  const [poolMintAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint_authority'), poolPubkey.toBuffer()],
    SINGLE_POOL_PROGRAM_ID
  );
  console.log('Pool Mint Authority:', poolMintAuthority.toBase58());

  // Generate a new authority (this should ideally be provided by the user)
  const newAuthority = Keypair.generate().publicKey;
  console.log('New Authority:', newAuthority.toBase58());

  // Create the instruction data
  const args = new WithdrawStakeArgs(amountInLamports);
  console.log('WithdrawStakeArgs:', args);
  const instructionData = borsh.serialize(WithdrawStakeArgs.schema, args);
  console.log('Instruction data (hex):', Buffer.from(instructionData).toString('hex'));

  const withdrawStakeIx = new TransactionInstruction({
    programId: SINGLE_POOL_PROGRAM_ID,
    keys: [
      { pubkey: poolPubkey, isSigner: false, isWritable: false },
      { pubkey: poolStakeAddress, isSigner: false, isWritable: true },
      { pubkey: poolMintAddress, isSigner: false, isWritable: true },
      { pubkey: poolStakeAuthority, isSigner: false, isWritable: false },
      { pubkey: poolMintAuthority, isSigner: false, isWritable: false },
      { pubkey: userStakePubkey, isSigner: false, isWritable: true },
      { pubkey: userTokenPubkey, isSigner: false, isWritable: true },
      { pubkey: newAuthority, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: StakeProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(instructionData)
  });

  console.log('Instruction keys:', withdrawStakeIx.keys.map(key => ({
    pubkey: key.pubkey.toBase58(),
    isSigner: key.isSigner,
    isWritable: key.isWritable
  })));

  // Create a new transaction and add the withdraw stake instruction
  const transaction = new Transaction().add(withdrawStakeIx);

  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPublicKey;

  console.log('Transaction:', {
    recentBlockhash: transaction.recentBlockhash,
    feePayer: transaction.feePayer.toBase58(),
    instructions: transaction.instructions.length
  });

  console.log('Full transaction object:', JSON.stringify(transaction, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

  return transaction;
};