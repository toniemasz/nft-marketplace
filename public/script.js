const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const marketAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Contract ABIs
const NFT_ABI = [
  "function mint(string memory _tokenURI) public",
  "function nextTokenId() public view returns (uint)",
  "function ownerOf(uint tokenId) public view returns (address)",
  "function tokenURI(uint tokenId) public view returns (string)",
  "function approve(address to, uint tokenId) public"
];

const MARKETPLACE_ABI = [
  "function listNFT(address nftContract, uint tokenId, uint _price) public",
  "function buyNFT(uint _listingId) public payable",
  "function resellNFT(uint _listingId, uint _newPrice) public",
  "function getAllListings() public view returns (tuple(address seller, address nftContract, uint tokenId, uint price, bool sold)[])",
  "function getListing(uint _id) public view returns (tuple(address seller, address nftContract, uint tokenId, uint price, bool sold))",
  "function getMyPurchases() public view returns (uint[])",
  "function getMyOwnedNFTs() public view returns (uint[])",
  "function checkIsListed(address nftContract, uint tokenId) public view returns (bool)",
  "event NFTListed(uint listingId, address seller, address nftContract, uint tokenId, uint price)",
  "event NFTSold(uint listingId, address buyer)",
  "event NFTRelisted(uint listingId, address seller, uint newPrice)"
];

let currentAccount;
let provider;
let signer;

function showTab(tab) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
  if (tab === "market") loadMarket();
  if (tab === "owned") loadOwned();
  if (tab === "history") loadHistory();
}

async function connectMetaMask() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      currentAccount = accounts[0];
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      
      document.getElementById("accountAddress").innerText = currentAccount;
      

      // Load balance
      const balance = await provider.getBalance(currentAccount);
      const ethBalance = ethers.utils.formatEther(balance);
      document.getElementById("balance").innerText = parseFloat(ethBalance).toFixed(4);


      document.getElementById("walletInfo").style.display = "block";
      
    } catch (err) {
      console.error("MetaMask connection error:", err);
      alert("Błąd połączenia z MetaMask");
    }
  } else {
    alert("MetaMask nie jest zainstalowany. Zainstaluj rozszerzenie w przeglądarce.");
  }
}

document.getElementById("connectButton").addEventListener("click", connectMetaMask);

async function loadMarket() {
  if (!provider) {
    alert("Najpierw połącz MetaMask");
    return;
  }

  try {
    const marketContract = new ethers.Contract(marketAddress, MARKETPLACE_ABI, provider);
    const listings = await marketContract.getAllListings();
    
    const container = document.getElementById("market-list");
    container.innerHTML = "";
    
    if (listings.length === 0) {
      container.innerHTML = "<p>Brak dostępnych NFT</p>";
      return;
    }

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      if (listing.sold) continue;
      
      try {
        const nftContract = new ethers.Contract(nftAddress, NFT_ABI, provider);
        const tokenURI = await nftContract.tokenURI(listing.tokenId);
        const priceInEth = ethers.utils.formatEther(listing.price);
        
        const div = document.createElement("div");
        div.className = "nft-card";
        div.innerHTML = `
          <img src="${tokenURI}" alt="NFT ${listing.tokenId}" />
          <p><strong>Token ID:</strong> ${listing.tokenId}</p>
          <p><strong>Cena:</strong> ${priceInEth} ETH</p>
          <p><strong>Sprzedający:</strong> ${listing.seller}</p>
          <button onclick="buyNFT(${i})">Kup NFT</button>
        `;
        container.appendChild(div);
      } catch (error) {
        console.error("Error loading NFT details:", error);
      }
    }
  } catch (error) {
    console.error("Error loading market:", error);
    document.getElementById("market-list").innerHTML = `<div class="error">Błąd ładowania marketplace: ${error.message}</div>`;
  }
}

async function buyNFT(listingId) {
  if (!currentAccount) return alert("Najpierw połącz MetaMask");
  
  try {
    const marketContract = new ethers.Contract(marketAddress, MARKETPLACE_ABI, signer);
    const listing = await marketContract.getListing(listingId);
    
    const tx = await marketContract.buyNFT(listingId, {
      value: listing.price
    });
    await tx.wait();
    
    alert("Kupiono NFT!");
    loadMarket();
    loadOwned();
    await loadProfile();
  } catch (error) {
    console.error("Error buying NFT:", error);
    alert("Błąd: " + error.message);
  }
}

async function loadOwned() {
  if (!currentAccount) return alert("Najpierw połącz MetaMask");
  
  try {
    const marketContract = new ethers.Contract(marketAddress, MARKETPLACE_ABI, signer);
    const ownedIds = await marketContract.getMyOwnedNFTs();
    
    const container = document.getElementById("owned-list");
    container.innerHTML = "";
    
    if (ownedIds.length === 0) {
      container.innerHTML = "<p>Brak posiadanych NFT</p>";
      return;
    }

    for (let i = 0; i < ownedIds.length; i++) {
      try {
        const listingId = ownedIds[i];
        const listing = await marketContract.getListing(listingId);
        const nftContract = new ethers.Contract(nftAddress, NFT_ABI, provider);
        const tokenURI = await nftContract.tokenURI(listing.tokenId);
        const priceInEth = ethers.utils.formatEther(listing.price);
        
        const div = document.createElement("div");
        div.className = "nft-card";
        div.innerHTML = `
          <img src="${tokenURI}" alt="NFT ${listing.tokenId}" />
          <p><strong>Token ID:</strong> ${listing.tokenId}</p>
          <p><strong>Kupione za:</strong> ${priceInEth} ETH</p>
          <div class="resell-section">
            <h4>Sprzedaj ponownie to NFT</h4>
            <input type="number" id="resell-price-${listingId}" placeholder="Nowa cena w ETH" step="0.01" min="0.01" />
            <button class="resell-button" onclick="resellNFT(${listingId})">Wystaw ponownie</button>
          </div>
        `;
        container.appendChild(div);
      } catch (error) {
        console.error("Error loading owned NFT:", error);
      }
    }
  } catch (error) {
    console.error("Error loading owned NFTs:", error);
    document.getElementById("owned-list").innerHTML = `<div class="error">Błąd ładowania NFT: ${error.message}</div>`;
  }
}

async function resellNFT(listingId) {
  if (!currentAccount) return alert("Najpierw połącz MetaMask");

  const priceInput = document.getElementById(`resell-price-${listingId}`);
  const newPrice = priceInput.value;

  if (!newPrice || parseFloat(newPrice) <= 0) {
    return alert("Podaj prawidłową cenę!");
  }

  try {
    const marketContract = new ethers.Contract(marketAddress, MARKETPLACE_ABI, signer);
    const listing = await marketContract.getListing(listingId);
    
    // First, approve the marketplace to transfer the NFT
    const nftContract = new ethers.Contract(nftAddress, NFT_ABI, signer);
    const approveTx = await nftContract.approve(marketAddress, listing.tokenId);
    await approveTx.wait();

    // Now resell the NFT
    const priceInWei = ethers.utils.parseEther(newPrice);
    const resellTx = await marketContract.resellNFT(listingId, priceInWei);
    await resellTx.wait();

    alert("NFT zostało ponownie wystawione!");
    loadOwned();
    loadMarket();
  } catch (error) {
    console.error("Error reselling NFT:", error);
    alert("Błąd: " + error.message);
  }
}

async function loadHistory() {
  const res = await fetch("/history");
  const data = await res.json();
  const container = document.getElementById("history-list");
  container.innerHTML = "";

  if (data.history.length === 0) {
    container.innerHTML = "<p>Brak transakcji.</p>";
    return;
  }

  data.history.forEach(entry => {
    const date = new Date(entry.timestamp * 1000).toLocaleString();
    const div = document.createElement("div");
    div.className = "nft-card";
    div.innerHTML = `
      <img src="${entry.imageUrl}" />
      <p>Kupione za: ${entry.price} ETH</p>
      <p>Kupujący: ${entry.buyer}</p>
      <p>Data: ${date}</p>
    `;
    container.appendChild(div);
  });
}

async function loadProfile() {
  if (!currentAccount) return;
  
  try {
    const balance = await provider.getBalance(currentAccount);
    const ethBalance = ethers.utils.formatEther(balance);
    document.getElementById("balance").innerText = parseFloat(ethBalance).toFixed(4);
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentAccount) {
    alert("Najpierw połącz MetaMask");
    return;
  }

  const formData = new FormData(e.target);
  const price = document.getElementById("nftPrice").value;
  formData.append("price", price);

  try {
    // Upload image
    const uploadRes = await fetch("/upload", {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();
    
    if (!uploadData.success) {
      throw new Error(uploadData.error);
    }

    // Mint NFT
    const nftContract = new ethers.Contract(nftAddress, NFT_ABI, signer);
    const mintTx = await nftContract.mint(uploadData.imageUrl);
    await mintTx.wait();
    
    // Get the token ID that was just minted
    const nextTokenId = await nftContract.nextTokenId();
    const tokenId = nextTokenId.toNumber() - 1;
    
    // Approve marketplace to transfer the NFT
    const approveTx = await nftContract.approve(marketAddress, tokenId);
    await approveTx.wait();
    
    // List NFT on marketplace
    const marketContract = new ethers.Contract(marketAddress, MARKETPLACE_ABI, signer);
    const priceInWei = ethers.utils.parseEther(price);
    const listTx = await marketContract.listNFT(nftAddress, tokenId, priceInWei);
    await listTx.wait();
    
    const msg = document.getElementById("create-message");
    const preview = document.getElementById("create-preview");
    
    msg.innerText = "NFT wystawione!";
    preview.src = uploadData.imageUrl;
    preview.style.display = "block";
    
  } catch (error) {
    console.error("Error creating NFT:", error);
    document.getElementById("create-message").innerText = "Błąd: " + error.message;
  }
});