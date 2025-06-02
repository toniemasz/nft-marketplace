// contracts/NFTMarketplace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NFTMarketplace {
    uint public itemCount = 0;

    struct Item {
        uint id;
        string imageUrl;
        address payable owner;
        uint price;
        bool sold;
    }

    mapping(uint => Item) public items;

    event ItemCreated(uint id, string imageUrl, uint price);
    event ItemPurchased(uint id, address newOwner);

    function createItem(string memory _imageUrl, uint _price) public {
        require(_price > 0, "Price must be greater than zero");
        itemCount++;
        items[itemCount] = Item(itemCount, _imageUrl, payable(msg.sender), _price, false);
        emit ItemCreated(itemCount, _imageUrl, _price);
    }

    function purchaseItem(uint _id) public payable {
        Item storage item = items[_id];
        require(!item.sold, "Already sold");
        require(msg.value == item.price, "Incorrect price");

        item.owner.transfer(msg.value);
        item.owner = payable(msg.sender);
        item.sold = true;

        emit ItemPurchased(_id, msg.sender);
    }

    function getItem(uint _id) public view returns (Item memory) {
        return items[_id];
    }

    function resellItem(uint _id, uint _newPrice) public {
    Item storage item = items[_id];
    require(msg.sender == item.owner, "You are not the owner");
    require(item.sold == true, "NFT is already listed");

    item.sold = false;
    item.price = _newPrice;
}



}
