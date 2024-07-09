import { useWallet } from '@solana/wallet-adapter-react';
const web3 = require("@solana/web3.js");

export const useFetchTokens = () => {
    const { publicKey } = useWallet();
    const url  = process.env.REACT_APP_IRONFORGE_ENDPOINT;

    const fetchTokens = async () => {
        if (!publicKey) {
            console.log('No wallet is connected');
            return;
        }

        const ownerAddress = publicKey.toString();
        console.log("useFetchTokens- walletAddress: ", ownerAddress);

        const getAssetsByOwner = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.REACT_APP_helius_API_key}`,
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: '323',
                        method: 'searchAssets',
                        params: {
                            ownerAddress: ownerAddress,
                            tokenType: "fungible",
                            page: 1, // Starts at 1
                            limit: 1000,
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("fetchTokens.js HeliusAPI- Response: ", result);

                if (result.error) {
                    throw new Error(JSON.stringify(result.error));
                }

                return result;
            } catch (error) {
                console.error("Error fetching assets:", error);
                throw error;
            }
        };

        return getAssetsByOwner();
    };

    return fetchTokens;
};