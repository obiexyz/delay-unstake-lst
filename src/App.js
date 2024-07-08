import React from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import InputForm from './form';
import { BalanceDisplay } from './balanceComponent.tsx';
import './App.css';

require('@solana/wallet-adapter-react-ui/styles.css');

const theme = extendTheme({
    config: {
        initialColorMode: "dark",
    },
});

function App() {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = process.env.REACT_APP_IRONFORGE_ENDPOINT || clusterApiUrl(network);
    console.log("Using RPC endpoint:", endpoint);

    const wallets = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new MathWalletAdapter(),
    ];

    return (
        <ChakraProvider theme={theme}>
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
        </ChakraProvider>
    );
}

export default App;