import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Menu,
  Settings2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const NETWORKS = [
  { name: "Ethereum", id: 1, hex: "0x1", symbol: "ETH", color: "#8b8fff" },
  { name: "Base", id: 8453, hex: "0x2105", symbol: "ETH", color: "#4e8bff" },
  { name: "Polygon", id: 137, hex: "0x89", symbol: "POL", color: "#9a78ff" },
  { name: "Arbitrum", id: 42161, hex: "0xa4b1", symbol: "ETH", color: "#42b7db" },
  { name: "BNB Chain", id: 56, hex: "0x38", symbol: "BNB", color: "#f2bd45" },
];

const TOKENS = {
  1: [
    { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
  ],
  8453: [
    { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  ],
  137: [
    { symbol: "POL", name: "POL", address: "native", decimals: 18 },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
    },
  ],
  42161: [
    { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18 },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
    },
  ],
  56: [
    { symbol: "BNB", name: "BNB", address: "native", decimals: 18 },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0x55d398326f99059fF775485246999027B3197955",
      decimals: 18,
    },
  ],
};

const NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function formatAmount(value, maximumFractionDigits = 6) {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return number.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

function getReadableError(error) {
  const message = error?.message || "";

  if (message.includes("UNSUPPORTED")) {
    return "This token or network is not supported by the quote provider.";
  }

  if (message.includes("fetch")) {
    return "Could not reach the quote service. Please try again.";
  }

  return (
    error?.error ||
    error?.detail ||
    "Unable to complete the request. Please try again."
  );
}

export default function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(1);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const network = NETWORKS.find((n) => n.id === chainId) || NETWORKS[0];
  const tokens = TOKENS[chainId] || TOKENS[1];

  const selectedFrom = tokens.find((t) => t.symbol === fromToken);
  const selectedTo = tokens.find((t) => t.symbol === toToken);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => setAccount(accounts?.[0] || ""))
      .catch(() => {});

    window.ethereum
      .request({ method: "eth_chainId" })
      .then((id) => setChainId(parseInt(id, 16)))
      .catch(() => {});

    const onAccounts = (accounts) => {
      setAccount(accounts?.[0] || "");
      setQuote(null);
      setBalance(null);
    };

    const onChain = (id) => {
      setChainId(parseInt(id, 16));
      setNotice("");
      setQuote(null);
      setBalance(null);
    };

    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    const available = TOKENS[chainId] || TOKENS[1];

    if (!available.some((t) => t.symbol === fromToken)) {
      setFromToken(available[0].symbol);
    }

    if (
      !available.some((t) => t.symbol === toToken) ||
      fromToken === toToken
    ) {
      setToToken(
        available.find((t) => t.symbol !== fromToken)?.symbol ||
          available[0].symbol
      );
    }

    setQuote(null);
    setQuoteError("");
  }, [chainId]);

  async function connectWallet() {
    if (!window.ethereum) {
      setNotice(
        "No compatible wallet found. Open StarStacks in a compatible wallet browser or install a supported wallet."
      );
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const id = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAccount(accounts?.[0] || "");
      setChainId(parseInt(id, 16));
      setNotice("");
    } catch (error) {
      setNotice(
        error?.code === 4001
          ? "Wallet connection was cancelled."
          : "Could not connect wallet. Please try again."
      );
    }
  }

  async function switchNetwork(selectedNetwork) {
    setNetworkOpen(false);

    if (!window.ethereum) {
      setNotice("Connect a compatible wallet to switch networks.");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: selectedNetwork.hex }],
      });

      setChainId(selectedNetwork.id);
      setNotice("");
    } catch (error) {
      if (error?.code === 4902) {
        setNotice(
          `${selectedNetwork.name} is not added to your wallet. Add it through your wallet's official network settings.`
        );
      } else if (error?.code === 4001) {
        setNotice("Network switch cancelled.");
      } else {
        setNotice("Couldn't switch network. Check your wallet and try again.");
      }
    }
  }

  function switchTokens() {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    setQuoteError("");
  }

  // Fetch the selected token's balance directly from the connected wallet.
  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      if (!account || !window.ethereum || !selectedFrom) {
        setBalance(null);
        return;
      }

      setBalanceLoading(true);

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const walletNetwork = await provider.getNetwork();

        if (Number(walletNetwork.chainId) !== chainId) {
          if (!cancelled) setBalance(null);
          return;
        }

        let rawBalance;

        if (selectedFrom.address === "native") {
          rawBalance = await provider.getBalance(account);
        } else {
          const contract = new ethers.Contract(
            selectedFrom.address,
            ERC20_ABI,
            provider
          );

          rawBalance = await contract.balanceOf(account);
        }

        const formatted = ethers.formatUnits(
          rawBalance,
          selectedFrom.decimals
        );

        if (!cancelled) setBalance(formatted);
      } catch {
        if (!cancelled) setBalance(null);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    }

    loadBalance();

    return () => {
      cancelled = true;
    };
  }, [account, chainId, fromToken, selectedFrom]);

  // Fetch a quote after the user pauses typing.
  useEffect(() => {
    let cancelled = false;

    setQuote(null);
    setQuoteError("");

    if (
      !account ||
      !selectedFrom ||
      !selectedTo ||
      fromToken === toToken ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setQuoteLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);

      try {
        const rawAmount = ethers.parseUnits(
          amount,
          selectedFrom.decimals
        );

        const response = await fetch("/api/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenIn:
              selectedFrom.address === "native"
                ? NATIVE_ADDRESS
                : selectedFrom.address,
            tokenOut:
              selectedTo.address === "native"
                ? NATIVE_ADDRESS
                : selectedTo.address,
            tokenInChainId: chainId,
            tokenOutChainId: chainId,
            amount: rawAmount.toString(),
            swapper: account,
            slippageTolerance: 0.5,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || data?.detail || "Quote request failed."
          );
        }

        // The quote API can return different quote shapes for different routes.
        const outputAmount =
          data?.quote?.output?.amount ??
          data?.quote?.amountOut ??
          data?.quote?.outputAmount ??
          null;

        if (!outputAmount) {
          throw new Error(
            "The provider returned no usable output amount for this route."
          );
        }

        const formattedOutput = ethers.formatUnits(
          outputAmount,
          selectedTo.decimals
        );

        if (!cancelled) {
          setQuote({
            outputAmount: formattedOutput,
            routing: data.routing || "",
            raw: data,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(getReadableError(error));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 650);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    account,
    chainId,
    fromToken,
    toToken,
    amount,
    selectedFrom,
    selectedTo,
  ]);

  function useMaxBalance() {
    if (balance === null) {
      setNotice("Connect your wallet and wait for your balance to load.");
      return;
    }

    // Leave a small native-token reserve for transaction gas.
    if (selectedFrom?.address === "native") {
      const reserve = chainId === 56 ? "0.005" : "0.002";
      const available = Number(balance) - Number(reserve);

      if (available <= 0) {
        setNotice("Your balance may be too low to cover network fees.");
        return;
      }

      setAmount(available.toFixed(8).replace(/\.?0+$/, ""));
    } else {
      setAmount(balance);
    }

    setNotice("");
  }

  function requestSwap() {
    if (!account) {
      connectWallet();
      return;
    }

    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setNotice("Enter an amount greater than zero.");
      return;
    }

    if (!quote) {
      setNotice("Wait for a valid quote before continuing.");
      return;
    }

    setNotice(
      "Your quote is ready. Transaction execution is not enabled yet; no funds have been moved."
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <header className="topbar">
        <a
          className="brand"
          href="#swap"
          aria-label="Starstacks Exchange home"
        >
          <span className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span className="brand-name">
            starstacks<span> exchange</span>
          </span>
        </a>

        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          <a className="active" href="#swap">
            Swap
          </a>
          <a href="#networks">Networks</a>
          <a href="#security">Security</a>
        </nav>

        <div className="header-actions">
          <div className="network-wrap">
            <button
              type="button"
              className="network-button"
              aria-expanded={networkOpen}
              aria-haspopup="true"
              onClick={() => setNetworkOpen((open) => !open)}
            >
              <i style={{ background: network.color }}></i>
              {network.name}
              <ChevronDown size={15} />
            </button>

            {networkOpen && (
              <div className="network-menu">
                {NETWORKS.map((n) => (
                  <button key={n.id} onClick={() => switchNetwork(n)}>
                    <i style={{ background: n.color }}></i>
                    {n.name}
                    {n.id === chainId && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="connect-button" onClick={connectWallet}>
            <Wallet size={16} />
            {account
              ? `${account.slice(0, 6)}…${account.slice(-4)}`
              : "Connect wallet"}
          </button>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu((open) => !open)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="pulse"></span>
            MULTI-CHAIN SWAP EXPERIENCE
          </div>
          <h1>
            Move at the speed
            <br />
            of <span>possibility.</span>
          </h1>
          <p>
            One simple interface for exploring digital assets across multiple
            networks.
          </p>
        </section>

        <section className="swap-card" id="swap">
          <div className="card-heading">
            <div>
              <h2>Swap tokens</h2>
              <p>Trade across supported networks</p>
            </div>
            <button
              className="icon-button"
              aria-label="Settings"
              onClick={() =>
                setNotice("Slippage is currently set to 0.5%.")
              }
            >
              <Settings2 size={19} />
            </button>
          </div>

          <div className="amount-panel">
            <div className="panel-top">
              <label>You pay</label>
              <span>Network: {network.name}</span>
            </div>

            <div className="amount-row">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^\d*\.?\d*$/.test(value)) {
                    setAmount(value);
                    setNotice("");
                  }
                }}
                aria-label="Amount to swap"
              />

              <select
                value={fromToken}
                onChange={(e) => {
                  const value = e.target.value;
                  setFromToken(value);

                  if (value === toToken) {
                    setToToken(
                      tokens.find((t) => t.symbol !== value)?.symbol || value
                    );
                  }
                }}
                aria-label="Token to pay"
              >
                {tokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="panel-bottom">
              <span>
                Balance:{" "}
                {balanceLoading
                  ? "Loading…"
                  : balance !== null
                    ? formatAmount(balance, 8)
                    : "—"}
              </span>

              <button onClick={useMaxBalance}>MAX</button>
            </div>
          </div>

          <button
            className="flip-button"
            onClick={switchTokens}
            aria-label="Switch tokens"
          >
            <ArrowDownUp size={18} />
          </button>

          <div className="amount-panel receive-panel">
            <div className="panel-top">
              <label>You receive</label>
              <span>Estimated amount</span>
            </div>

            <div className="amount-row">
              <div className="output-amount">
                {quoteLoading
                  ? "Loading…"
                  : quote
                    ? formatAmount(quote.outputAmount, 8)
                    : "—"}
              </div>

              <select
                value={toToken}
                onChange={(e) => {
                  setToToken(e.target.value);
                  setQuote(null);
                }}
                aria-label="Token to receive"
              >
                {tokens
                  .filter((t) => t.symbol !== fromToken)
                  .map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
              </select>
            </div>

            <div className="panel-bottom">
              <span>Price impact: —</span>
              <span className="estimate-tag">
                {quoteLoading
                  ? "Getting quote…"
                  : quote
                    ? "Quote available"
                    : quoteError
                      ? "Quote unavailable"
                      : "Enter amount"}
              </span>
            </div>
          </div>

          <div className="trade-details">
            <span>
              <CircleHelp size={14} /> Network fee
            </span>
            <span>Calculated during transaction preparation</span>
          </div>

          <button className="primary-button" onClick={requestSwap}>
            {!account
              ? "Connect wallet"
              : quote
                ? "Continue to swap"
                : "Get swap quote"}
            <ArrowRight size={18} />
          </button>

          {quoteError && (
            <div className="notice" role="status">
              {quoteError}
              <button
                onClick={() => setQuoteError("")}
                aria-label="Dismiss quote error"
              >
                ×
              </button>
            </div>
          )}

          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </div>
          )}

          <div className="security-note">
            <ShieldCheck size={15} />
            <span>
              Always verify the network and token before approving a
              transaction.
            </span>
          </div>
        </section>

        <section className="network-section" id="networks">
          <div className="section-label">BUILT FOR MULTIPLE NETWORKS</div>
          <h2>One place. More possibilities.</h2>

          <div className="network-grid">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                className={`network-tile ${chainId === n.id ? "selected" : ""}`}
                onClick={() => switchNetwork(n)}
              >
                <i style={{ background: n.color }}></i>
                <span>{n.name}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="security-section" id="security">
          <div className="security-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3>Security comes first</h3>
            <p>
              Starstacks Exchange will never ask for your recovery phrase or
              private key. Review every wallet prompt carefully, and never
              approve a transaction you don't understand.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#swap">
          <span className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span className="brand-name">
            starstacks<span> exchange</span>
          </span>
        </a>

        <span>Independent project · Not affiliated with Uniswap</span>
        <span>© {new Date().getFullYear()} Starstacks Exchange</span>
      </footer>
    </div>
  );
}
