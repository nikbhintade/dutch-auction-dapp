// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract DutchAuction is Ownable {
    IERC721 public nft;

    uint256 public initialPrice = 1000 ether;
    uint256 public discountRate = 2 wei;
    uint256 public duration = 7 days;
    uint256 public startTime;
    uint256 public id;

    constructor(
        address _nftAddres,
        uint256 _id
    ) {
        id = _id;
        startTime = block.timestamp;

        // getting allowance from the owner of the NFT to be auctioned
        nft = IERC721(_nftAddres);
        console.log(block.timestamp);
    }

    // Returns the current price of the NFT in auction
    function getPrice() public view returns (uint256 price) {
        uint256 timePassed = block.timestamp - startTime;
        uint256 discount = timePassed * discountRate;
        price = initialPrice - discount;
    }

    // buy the NFT
    function buy() public payable {
        require(block.timestamp < startTime + duration, "Auction ended");

        uint256 price = getPrice();
        require(msg.value >= price, "ETH < price");

        nft.transferFrom(owner(), msg.sender, id);
        uint256 refund = msg.value - price;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }
}
