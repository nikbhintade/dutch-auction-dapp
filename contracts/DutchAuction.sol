// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DutchAuction is Ownable {
    /**
     * Dutch Auction is time bound and descends in price.
     *
     * Initial parameters:
     * - Address of the NFT contract - Done
     * - Id of the NFT - Done
     * - Initial price of the NFt - Done
     * - discount rate (per seconds) - Done
     * - duration
     *
     * You need allownace to send that NFT otherwise this won't work.
     */

    IERC721 public nft;

    uint256 public initialPrice;
    uint256 public id;
    uint256 public discountRate;
    uint256 public duration;
    uint256 public startTime;

    constructor(
        uint256 _initialPrice,
        address _nftAddres,
        uint256 _id,
        uint256 _discountRate,
        uint256 _duration,
        uint256 _startTime
    ) {
        // setting up dutch auction variables
        initialPrice = _initialPrice;
        id = _id;
        discountRate = _discountRate;
        duration = _duration;
        startTime = _startTime;

        // getting allowance from the owner of the NFT to be auctioned
        nft = IERC721(_nftAddres);
        nft.approve(address(this), id);
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
