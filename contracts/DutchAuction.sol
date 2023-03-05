// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DutchAuction {
    IERC721 public nft;

    uint256 public initialPrice = 50 ether;
    uint256 public discountRate = 20 wei;
    uint256 public duration = 7 days;
    bool public sold = false;

    uint256 public startTime;
    uint256 public id;

    constructor(
        address _nft,
        uint256 _id
    ) {
        id = _id;
        startTime = block.timestamp;

        // getting allowance from the owner of the NFT to be auctioned
        nft = IERC721(_nft);
    }

    // Returns the current price of the NFT in auction
    function getPrice() public view returns (uint256 price) {
        uint256 timePassed = block.timestamp - startTime;
        price = initialPrice - (timePassed * discountRate);
    }

    // buy the NFT
    function buy() public payable {
        require(block.timestamp < startTime + duration, "Auction ended");

        uint256 price = getPrice();
        require(msg.value >= price, "ETH < price");

        nft.safeTransferFrom(nft.ownerOf(0), msg.sender, id);
        uint256 refund = msg.value - price;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
        sold = true;
    }
}
