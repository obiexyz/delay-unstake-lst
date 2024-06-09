import React, { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, AccountInfo } from '@solana/web3.js';

export const BalanceDisplay: FC = () => {
    const [balance, setBalance] = useState(0);
    const { connection } = useConnection();
    const { publicKey } = useWallet();
  
    useEffect(() => {
      if (!connection || !publicKey) {
        return;
      }
  
      connection.onAccountChange(
        publicKey,
        (updatedAccountInfo) => {
          setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
        },
        "confirmed",
      );
  
      connection.getAccountInfo(publicKey).then((info: AccountInfo<Buffer> | null) => {
        if (info) {
            setBalance(info.lamports);
        }
    });
    }, [connection, publicKey]);
  
    return (
      <div>
        <p>{publicKey ? `Balance: ${balance / LAMPORTS_PER_SOL} SOL` : ""}</p>
      </div>
    );
  };