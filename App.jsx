import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ArrowDownUp, ArrowRight, Check, ChevronDown, CircleHelp, Globe2, Menu, Settings2, ShieldCheck, Wallet, Zap } from "lucide-react";

const NETWORKS = [
  { name: "Ethereum", id: 1, hex: "0x1", symbol: "ETH", color: "#8b8fff" },
  { name: "Base", id: 8453, hex: "0x2105", symbol: "ETH", color: "#4e8bff" },
  { name: "Polygon", id: 137, hex: "0x89", symbol: "POL", color: "#9a78ff" },
  { name: "Arbitrum", id: 42161, hex: "0xa4b1", symbol: "ETH", color: "#42b7db" },
  { name: "BNB Chain", id: 56, hex: "0x38", symbol: "BNB", color: "#f2bd45" }
];
const TOKENS = {
  1: [{symbol:"ETH",name:"Ethereum",address:"native"},{symbol:"USDC",name:"USD Coin",address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"},{symbol:"USDT",name:"Tether USD",address:"0xdAC17F958D2ee523a2206206994597C13D831ec7"}],
  8453: [{symbol:"ETH",name:"Ethereum",address:"native"},{symbol:"USDC",name:"USD Coin",address:"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}],
  137: [{symbol:"POL",name:"POL",address:"native"},{symbol:"USDC",name:"USD Coin",address:"0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"}],
  42161: [{symbol:"ETH",name:"Ethereum",address:"native"},{symbol:"USDC",name:"USD Coin",address:"0xaf88d065e77c8cC2239327C5EDb3A432268e5831"}],
  56: [{symbol:"BNB",name:"BNB",address:"native"},{symbol:"USDT",name:"Tether USD",address:"0x55d398326f99059fF775485246999027B3197955"}]
};

export default function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(1);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const network = NETWORKS.find(n => n.id === chainId) || NETWORKS[0];
  const tokens = TOKENS[chainId] || TOKENS[1];

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({method:"eth_accounts"}).then(a => { if(a?.[0]) setAccount(a[0]); }).catch(()=>{});
    window.ethereum.request({method:"eth_chainId"}).then(id => setChainId(parseInt(id,16))).catch(()=>{});
    const onAccounts = a => setAccount(a?.[0] || "");
    const onChain = id => { setChainId(parseInt(id,16)); setNotice(""); };
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => { window.ethereum.removeListener?.("accountsChanged", onAccounts); window.ethereum.removeListener?.("chainChanged", onChain); };
  }, []);

  useEffect(() => {
    if (!tokens.some(t=>t.symbol===fromToken)) setFromToken(tokens[0].symbol);
    if (!tokens.some(t=>t.symbol===toToken) || toToken===fromToken) setToToken(tokens.find(t=>t.symbol!==fromToken)?.symbol || tokens[0].symbol);
  }, [chainId]);

  async function connectWallet() {
    if (!window.ethereum) {
      setNotice("No compatible wallet found. Install MetaMask or open this site in a compatible wallet browser.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({method:"eth_requestAccounts"});
      setAccount(accounts?.[0] || "");
      const id = await window.ethereum.request({method:"eth_chainId"});
      setChainId(parseInt(id,16));
      setNotice("");
    } catch (e) { setNotice(e?.code === 4001 ? "Wallet connection was cancelled." : "Could not connect wallet. Please try again."); }
  }

  async function switchNetwork(n) {
    setNetworkOpen(false);
    if (!window.ethereum) { setNotice("Connect a compatible wallet to switch networks."); return; }
    try {
      await window.ethereum.request({method:"wallet_switchEthereumChain", params:[{chainId:n.hex}]});
      setChainId(n.id); setNotice("");
    } catch (e) {
      if (e?.code === 4902) setNotice(`${n.name} is not added to your wallet yet. Add it using the wallet's official network settings, then try again.`);
      else if (e?.code === 4001) setNotice("Network switch cancelled.");
      else setNotice("Couldn't switch network. Check your wallet and try again.");
    }
  }

  function switchTokens() { setFromToken(toToken); setToToken(fromToken); }
  function requestSwap() {
    if (!account) { connectWallet(); return; }
    if (!amount || Number(amount) <= 0) { setNotice("Enter an amount greater than zero."); return; }
    setNotice("Swap execution is not enabled yet. This starter needs a vetted swap quote/transaction provider, API credentials where required, and end-to-end testing before it can move real funds.");
  }

  return <div className="app-shell">
    <div className="ambient ambient-one"></div><div className="ambient ambient-two"></div>
    <header className="topbar">
      <a className="brand" href="#" aria-label="Starstacks Exchange home"><span className="brand-mark"><span></span><span></span><span></span></span><span className="brand-name">starstacks<span> exchange</span></span></a>
      <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
        <a className="active" href="#swap">Swap</a><a href="#networks">Networks</a><a href="#security">Security</a>
      </nav>
      <div className="header-actions">
        <div className="network-wrap">
          <button className="network-button" onClick={()=>setNetworkOpen(!networkOpen)}><i style={{background:network.color}}></i>{network.name}<ChevronDown size={15}/></button>
          {networkOpen && <div className="network-menu">{NETWORKS.map(n=><button key={n.id} onClick={()=>switchNetwork(n)}><i style={{background:n.color}}></i>{n.name}{n.id===chainId&&<Check size={15}/>}</button>)}</div>}
        </div>
        <button className="connect-button" onClick={connectWallet}><Wallet size={16}/>{account ? `${account.slice(0,6)}…${account.slice(-4)}` : "Connect wallet"}</button>
      </div>
      <button className="mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu/></button>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><span className="pulse"></span> MULTI-CHAIN SWAP EXPERIENCE</div>
        <h1>Move at the speed<br/>of <span>possibility.</span></h1>
        <p>One simple interface for exploring digital assets across multiple networks.</p>
      </section>

      <section className="swap-card" id="swap">
        <div className="card-heading"><div><h2>Swap tokens</h2><p>Trade across supported networks</p></div><button className="icon-button" aria-label="Settings" onClick={()=>setNotice("Swap settings will be available when the swap provider is integrated.")}><Settings2 size={19}/></button></div>
        <div className="amount-panel">
          <div className="panel-top"><label>You pay</label><span>Network: {network.name}</span></div>
          <div className="amount-row"><input inputMode="decimal" placeholder="0.0" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,""))} aria-label="Amount to swap"/><select value={fromToken} onChange={e=>{setFromToken(e.target.value); if(e.target.value===toToken) setToToken(tokens.find(t=>t.symbol!==e.target.value)?.symbol || e.target.value);}} aria-label="Token to pay">{tokens.map(t=><option key={t.symbol}>{t.symbol}</option>)}</select></div>
          <div className="panel-bottom"><span>Balance: —</span><button onClick={()=>setNotice("Wallet balance display will be enabled with the transaction provider integration.")}>MAX</button></div>
        </div>
        <button className="flip-button" onClick={switchTokens} aria-label="Switch tokens"><ArrowDownUp size={18}/></button>
        <div className="amount-panel receive-panel">
          <div className="panel-top"><label>You receive</label><span>Estimated amount</span></div>
          <div className="amount-row"><div className="output-amount">—</div><select value={toToken} onChange={e=>setToToken(e.target.value)} aria-label="Token to receive">{tokens.filter(t=>t.symbol!==fromToken).map(t=><option key={t.symbol}>{t.symbol}</option>)}</select></div>
          <div className="panel-bottom"><span>Price impact: —</span><span className="estimate-tag">Quote unavailable</span></div>
        </div>
        <div className="trade-details"><span><CircleHelp size={14}/> Network fee</span><span>Calculated before swap</span></div>
        <button className="primary-button" onClick={requestSwap}>{account ? "Get swap quote" : "Connect wallet"}<ArrowRight size={18}/></button>
        {notice && <div className="notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss notice">×</button></div>}
        <div className="security-note"><ShieldCheck size={15}/><span>Always verify the network and token before approving a transaction.</span></div>
      </section>

      <section className="network-section" id="networks"><div className="section-label">BUILT FOR MULTIPLE NETWORKS</div><h2>One place. More possibilities.</h2><div className="network-grid">{NETWORKS.map(n=><button key={n.id} className={`network-tile ${chainId===n.id?"selected":""}`} onClick={()=>switchNetwork(n)}><i style={{background:n.color}}></i><span>{n.name}</span><ArrowRight size={15}/></button>)}</div></section>
      <section className="security-section" id="security"><div className="security-icon"><ShieldCheck size={22}/></div><div><h3>Security comes first</h3><p>Starstacks Exchange will never ask for your recovery phrase or private key. Review every wallet prompt carefully, and never approve a transaction you don't understand.</p></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><span></span><span></span><span></span></span><span className="brand-name">starstacks<span> exchange</span></span></a><span>Independent project · Not affiliated with Uniswap</span><span>© {new Date().getFullYear()} Starstacks Exchange</span></footer>
  </div>;
}
