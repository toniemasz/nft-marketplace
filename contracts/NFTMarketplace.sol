// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721 {
    function transferFrom(address from, address to, uint tokenId) external;
    function ownerOf(uint tokenId) external view returns (address);
}

contract NFTMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint tokenId;
        uint price;
        bool sold;
    }

    uint public listingId;
    mapping(uint => Listing) public listings;
    mapping(address => uint[]) public purchasedNFTs;
    
    // New mapping to track which NFTs a user currently owns (not sold)
    mapping(address => uint[]) public ownedNFTs;
    
    // Mapping to track if an NFT is currently listed (to prevent double listing)
    mapping(address => mapping(uint => bool)) public isListed;

    event NFTListed(uint listingId, address seller, address nftContract, uint tokenId, uint price);
    event NFTSold(uint listingId, address buyer);
    event NFTRelisted(uint listingId, address seller, uint newPrice);

    function listNFT(address nftContract, uint tokenId, uint _price) public {
        require(_price > 0, "Price must be > 0");
        require(!isListed[nftContract][tokenId], "NFT already listed");
        
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: _price,
            sold: false
        });
        
        isListed[nftContract][tokenId] = true;
        emit NFTListed(listingId, msg.sender, nftContract, tokenId, _price);
        listingId++;
    }

    function buyNFT(uint _listingId) public payable {
        Listing storage listing = listings[_listingId];
        require(!listing.sold, "Already sold");
        require(msg.value == listing.price, "Incorrect value");

        listing.sold = true;
        isListed[listing.nftContract][listing.tokenId] = false;
        
        payable(listing.seller).transfer(msg.value);
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        purchasedNFTs[msg.sender].push(_listingId);
        ownedNFTs[msg.sender].push(_listingId);
        
        emit NFTSold(_listingId, msg.sender);
    }

    // New function to relist/resell an owned NFT
    function resellNFT(uint _listingId, uint _newPrice) public {
        require(_newPrice > 0, "Price must be > 0");
        
        Listing storage originalListing = listings[_listingId];
        require(originalListing.sold, "NFT not sold yet");
        
        // Check if the caller owns this NFT
        bool ownsNFT = false;
        uint[] memory userOwned = ownedNFTs[msg.sender];
        uint ownedIndex;
        
        for (uint i = 0; i < userOwned.length; i++) {
            if (userOwned[i] == _listingId) {
                ownsNFT = true;
                ownedIndex = i;
                break;
            }
        }
        require(ownsNFT, "You don't own this NFT");
        require(!isListed[originalListing.nftContract][originalListing.tokenId], "NFT already listed");
        
        // Transfer NFT from owner back to marketplace
        IERC721(originalListing.nftContract).transferFrom(msg.sender, address(this), originalListing.tokenId);
        
        // Create new listing
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: originalListing.nftContract,
            tokenId: originalListing.tokenId,
            price: _newPrice,
            sold: false
        });
        
        // Remove from owned NFTs array
        ownedNFTs[msg.sender][ownedIndex] = ownedNFTs[msg.sender][ownedNFTs[msg.sender].length - 1];
        ownedNFTs[msg.sender].pop();
        
        isListed[originalListing.nftContract][originalListing.tokenId] = true;
        emit NFTListed(listingId, msg.sender, originalListing.nftContract, originalListing.tokenId, _newPrice);
        emit NFTRelisted(listingId, msg.sender, _newPrice);
        listingId++;
    }

    function getMyPurchases() public view returns (uint[] memory) {
        return purchasedNFTs[msg.sender];
    }
    
    // New function to get currently owned NFTs (not relisted)
    function getMyOwnedNFTs() public view returns (uint[] memory) {
        return ownedNFTs[msg.sender];
    }

    function getListing(uint _id) public view returns (Listing memory) {
        return listings[_id];
    }

    function getAllListings() public view returns (Listing[] memory) {
        Listing[] memory allListings = new Listing[](listingId);
        for (uint i = 0; i < listingId; i++) {
            allListings[i] = listings[i];
        }
        return allListings;
    }
    
    // Helper function to check if NFT is currently listed
    function checkIsListed(address nftContract, uint tokenId) public view returns (bool) {
        return isListed[nftContract][tokenId];
    }
}
