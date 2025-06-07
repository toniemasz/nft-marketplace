
const nftAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const marketAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";





function showTab(tab) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  if (tab === "market") loadMarket();
  if (tab === "owned") loadOwned();
  if (tab === "history") loadHistory();
}

let currentAccount;

async function connectMetaMask() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      currentAccount = accounts[0];
      document.getElementById("accountAddress").innerText = currentAccount;

      // Załaduj saldo konta
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(currentAccount);
      const ethBalance = ethers.utils.formatEther(balance);
      document.getElementById("balance").innerText = parseFloat(ethBalance).toFixed(4);
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
  const res = await fetch("/nfts");
  const data = await res.json();
  const container = document.getElementById("market-list");
  container.innerHTML = "";

  data.nfts.filter(n => !n.sold).forEach(nft => {
    const div = document.createElement("div");
    div.className = "nft-card";
    div.innerHTML = `
      <img src="${nft.imageUrl}" />
      <p>Cena: ${nft.price} ETH</p>
      <button onclick="buyNFT(${nft.id})">Kup</button>
    `;
    container.appendChild(div);
  });
}

async function buyNFT(id) {
  //const userId = localStorage.getItem("userId");
  if (!currentAccount) return alert("Najpierw połącz MetaMask");
  //if (!userId) return alert("Musisz być zalogowany");

  const res = await fetch("/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, userId })
  });

  const data = await res.json();
  if (data.success) {
    alert("Kupiono NFT!");
    loadMarket();
    loadOwned();
    await loadProfile();
  } else {
    alert("Błąd: " + data.error);
  }
}

async function loadOwned() {
  //const userId = localStorage.getItem("userId");
  if (!currentAccount) return alert("Najpierw połącz MetaMask");
  const res = await fetch(`/profile/${userId}`);
  const data = await res.json();
  const container = document.getElementById("owned-list");
  container.innerHTML = "";

  if (!data.user.ownedNFTs.length) {
    container.innerHTML = "<p>Brak posiadanych NFT</p>";
    return;
  }

  data.user.ownedNFTs.forEach(nft => {
    const div = document.createElement("div");
    div.className = "nft-card";

    div.innerHTML = `
      <img src="${nft.imageUrl}" />
      <p>Kupione za: ${nft.price} ETH</p>
      ${nft.sold
        ? `<input type="text" id="resell-price-${nft.id}" placeholder="Nowa cena w ETH" />
           <button onclick="resellNFT(${nft.id})">Wystaw ponownie</button>`
        : `<p><em>Już na rynku</em></p>`
      }
    `;

    container.appendChild(div);
  });

  // Zaktualizuj saldo
  const bal = data.user.walletBalance || data.user.balance;
  document.getElementById("balance").innerText = Number(bal).toFixed(2);
}


async function resellNFT(id) {
  //const userId = localStorage.getItem("userId");
  if (!currentAccount) return alert("Najpierw połącz MetaMask");
  const price = document.getElementById(`resell-price-${id}`).value;

  if (!price) return alert("Podaj cenę!");

  const res = await fetch("/resell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentAccount, id, price })
  });

  const data = await res.json();

  if (data.success) {
    alert("NFT zostało ponownie wystawione!");
    loadOwned();
    loadMarket();
  } else {
    alert("Błąd: " + data.error);
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



document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);





//dodaje cene z inputa 
  const price = document.getElementById("nftPrice").value;
  formData.append("price", price);





  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();
  const msg = document.getElementById("create-message");
  const preview = document.getElementById("create-preview");
  if (data.success) {
    msg.innerText = "NFT wystawione!";
    preview.src = data.imageUrl;
    preview.style.display = "block";
  } else {
    msg.innerText = "Błąd: " + data.error;
  }
});
