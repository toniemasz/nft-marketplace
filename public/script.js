function showTab(tab) {
  document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  if (tab === "market") loadMarket();
  if (tab === "owned") loadOwned();
  if (tab === "history") loadHistory();
}

async function login() {
  const userId = document.getElementById("userIdInput").value.trim();
  if (!userId) return alert("Podaj nazwę użytkownika");

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem("userId", userId);
    document.getElementById("loginStatus").innerText = `Zalogowano jako ${userId}`;
    loadProfile();
  } else {
    document.getElementById("loginStatus").innerText = "Błąd logowania";
  }
}

async function loadProfile() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const res = await fetch(`/profile/${userId}`);
  const data = await res.json();
    console.log("PROFILE:", data); 
  if (data.success) {
    document.getElementById("balance").innerText = Number(data.user.balance).toFixed(2);
  }
}

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
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Musisz być zalogowany");

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
  const userId = localStorage.getItem("userId");
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
  document.getElementById("balance").innerText = data.user.balance;
}


async function resellNFT(id) {
  const userId = localStorage.getItem("userId");
  const price = document.getElementById(`resell-price-${id}`).value;

  if (!price) return alert("Podaj cenę!");

  const res = await fetch("/resell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, id, price })
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

window.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    document.getElementById("userIdInput").value = userId;
    document.getElementById("loginStatus").innerText = `Zalogowano jako ${userId}`;
    loadProfile();
  }
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const msg = document.getElementById("create-message");
  const preview = document.getElementById("create-preview");
  try {
    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      msg.innerText = "NFT wystawione!";
      preview.src = data.imageUrl;
      preview.style.display = "block";
    } else {
      msg.innerText = "Błąd: " + data.error;
    }
  } catch (err) {
    msg.innerText = "Błąd połączenia z serwerem";
  }
});
