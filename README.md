# 🖼 NFT Marketplace (Node.js + Solidity, bez MetaMask)

Prosty lokalny marketplace NFT zbudowany w Node.js i Solidity.  
Pozwala wystawiać, kupować i przeglądać NFT **bez użycia MetaMask** – wszystkie transakcje realizowane są przez backend za pomocą lokalnego portfela.

---

## 🔧 Stack technologiczny

- Node.js + Express (backend)
- Solidity + Hardhat (smart kontrakty)
- ethers.js v6 (komunikacja z blockchainem)
- HTML + CSS + JS (frontend)
- Lokalny system plików (brak IPFS, wszystko lokalnie)

---

## ✨ Funkcje

✅ Wystawianie NFT (obraz JPG/PNG + cena)  
✅ Kupowanie NFT (transakcja na blockchainie bez MetaMask)  
✅ Przeglądanie dostępnych NFT  
✅ Mój portfel – NFT przypisane do portfela backendu  
✅ Historia zakupów z blockchaina (eventy `ItemPurchased`)  

---

## 🖥️ Jak uruchomić lokalnie

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/toniemasz/nft-marketplace.git
cd nft-marketplace
```

### 2. Instalacja zależności

```bash
npm install
```

### 3. Utworzenie pliku `.env`

W głównym katalogu stwórz plik `.env`:

```
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<ADRES_KONTRAKTU_Z_DEPLOYMENTU>
```

Adres kontraktu otrzymasz po wdrożeniu (patrz niżej).

### 4. Uruchomienie lokalnego blockchaina

```bash
npx hardhat node
```

### 5. Deploy kontraktu

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Skopiuj wyświetlony adres kontraktu i wpisz go do `.env`.

### 6. Uruchomienie backendu

```bash
node index.js
```

### 7. Otwórz frontend

Wejdź w przeglądarce na:  
👉 `http://localhost:3000`

---

## 📸 Widoki

- **Zakładka `Wystaw NFT`** – formularz do przesłania zdjęcia i podania ceny  
- **Zakładka `Kup NFT`** – lista dostępnych tokenów z przyciskiem `Kup`  
- **Zakładka `Mój portfel`** – pokazuje NFT należące do backendowego portfela  
- **Zakładka `🧾 Historia`** – lista transakcji z datą, ceną i nabywcą

---

## 📂 Struktura katalogu

```
nft-marketplace/
├── contracts/              # Smart kontrakty Solidity
├── scripts/                # Skrypty deployujące
├── public/                 # Frontend (index.html + style)
├── uploads/                # Lokalne obrazy NFT
├── index.js                # Backend Express
├── abi.json                # ABI kontraktu
├── .env                    # Klucz prywatny i adres kontraktu
└── README.md
```

---

## 🛡️ Uwaga

Ten projekt działa lokalnie – nie ma rejestracji użytkowników ani zabezpieczeń.  
Nie używa MetaMask – transakcje są podpisywane automatycznie z backendu.

Projekt idealny do nauki, prezentacji lub jako baza do dalszej rozbudowy.

---



