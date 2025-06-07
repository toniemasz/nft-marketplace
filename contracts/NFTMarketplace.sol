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

    event NFTListed(uint listingId, address seller, address nftContract, uint tokenId, uint price);
    event NFTSold(uint listingId, address buyer);

    function listNFT(address _nftContract, uint _tokenId, uint _price) public {
        require(_price > 0, "Price must be > 0");
        
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            sold: false
        });

        emit NFTListed(listingId, msg.sender, _nftContract, _tokenId, _price);
        listingId++;
    }

    function buyNFT(uint _listingId) public payable {
        Listing storage listing = listings[_listingId];
        require(!listing.sold, "Already sold");
        require(msg.value == listing.price, "Incorrect value");

        listing.sold = true;
        payable(listing.seller).transfer(msg.value);
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        purchasedNFTs[msg.sender].push(_listingId);
        emit NFTSold(_listingId, msg.sender);
    }

    function getMyPurchases() public view returns (uint[] memory) {
        return purchasedNFTs[msg.sender];
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
}
