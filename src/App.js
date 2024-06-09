import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import * as web3 from "@solana/web3.js";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    MathWalletAdapter,} from "@solana/wallet-adapter-wallets";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import InputForm from './form.js';
import {BalanceDisplay} from './balanceComponent.tsx';
import './App.css';
import { useMemo, FC, ReactNode } from 'react';
require("@solana/wallet-adapter-react-ui/styles.css");

const theme = extendTheme({
    config: {
      initialColorMode: "dark",
    },
  });

function App() {
    const endpoint = 'https://rpc.ironforge.network/mainnet?apiKey=01HJ1S17D99F3CNWAEQAA6FNR1';
    console.log("App.js- endpoint: ", endpoint);
    const wallets = useMemo(
        () => [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
          new MathWalletAdapter(),
        ],
        []
      );


    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="App">
                        <header className="App-header">
                            <WalletMultiButton />
                            <BalanceDisplay />
                            <InputForm />
                        </header>
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;