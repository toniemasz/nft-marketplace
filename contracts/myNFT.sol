// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint public nextTokenId;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender)  {}

    function mint(string memory _tokenURI) public {
        uint tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        nextTokenId++;
    }
}