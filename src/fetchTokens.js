import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 32000; // 32 seconds

const fetchWithRetry = async (url, options, retries = 0) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw error;
    }
    const backoff = Math.min(INITIAL_BACKOFF * Math.pow(2, retries), MAX_BACKOFF);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return fetchWithRetry(url, options, retries + 1);
  }
};

export const useFetchTokens = () => {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTokens = async () => {
    if (!publicKey) {
      setError('No wallet connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    const url = process.env.REACT_APP_IRONFORGE_ENDPOINT;
    const ownerAddress = publicKey.toString();

    try {
      const result = await fetchWithRetry(url, {
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
            page: 1,
            limit: 1000,
          },
        }),
      });

      if (result.error) {
        throw new Error(JSON.stringify(result.error));
      }

      const fetchedTokens = result.result.items.map(item => ({
        id: item.id,
        symbol: item.content.metadata.symbol,
        balance: parseFloat(item.token_info.balance) / Math.pow(10, item.token_info.decimals),
        decimals: item.token_info.decimals
      }));

      setTokens(fetchedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError('Failed to fetch token data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchTokens();
    }
  }, [publicKey]);

  return { tokens, isLoading, error, refetch: fetchTokens };
};