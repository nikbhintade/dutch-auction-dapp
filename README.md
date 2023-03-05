# Building a Dutch Auction Dapp on Celo

## Introduction[](https://docs.celo.org/community/celo-sage/tutorial-structure#introduction)

In this tutorial, we will build a dapp for a Dutch auction using Solidity, Hardhat and React. In a Dutch auction, the price of an item starts high and gradually decreases until someone is willing to purchase it. Unlike a English auction where the price increases with each bid, a Dutch auction can be a more efficient way to sell an item, especially if the seller wants to sell item quickly. We will cover the smart contract logic and user interface for the dapp, and show you how to deploy and interact with the dapp on Celo.

## Prerequisites[](https://docs.celo.org/community/celo-sage/tutorial-structure#prerequisites)

In this tutorial, we will be creating a Dutch auction dapp to sell an NFT. Therefore, we assume that you already have knowledge of how NFTs work. If you are not familiar with NFTs, please complete one of the following tutorials first:

- How to quickly build an NFT collection on Celo
- Deploy an NFT to Celo

It is recommended that you have a basic understanding of Solidity, JavaScript, and React to follow this tutorial. Familiarity with Hardhat is helpful but not necessary, as the tutorial will cover the basics. Having a grasp of these technologies will make it easier to understand and follow along, but even without prior experience, you will still learn a lot from this tutorial.

## Requirements[](https://docs.celo.org/community/celo-sage/tutorial-structure#requirements)

This tutorial requires Node.js (version >=16.0) to run and test Solidity code. To check if Node.js is installed, run this command in the terminal:

```bash
node -v
```

If Node.js isn't already installed or the version is outdated, you can download latest version from the [official website](https://nodejs.org/) and install it by following the instructions. Once Node.js is installed, you can proceed with the tutorial.

We also need to install a wallet in the browser that works with Celo, like MetaMask.

## How Dutch Auction Works?

In a Dutch auction, the price of the item being auctioned gradually decreases until someone is willing to accept the current price. This differs from a traditional auction, where the price starts low and increases gradually until someone is willing to pay the highest amount.

Here's how a Dutch auction typically works:

1. The auctioneer sets an initial asking price that is relatively high.
2. The auctioneer then gradually lowers the price over time until someone is willing to accept the current price.
3. Anyone who is interested in the item indicates their willingness to purchase it by placing a bid.
4. Once a bid is placed at the current price, the auction is complete, and the item is purchased at that price.

In a smart contract, instead of manually decreasing the price over a set period of time, we can set a discount rate (discount per second) to achieve the same result. We can calculate the current price of the item using the following formula:

```
current price = initial price - (discount rate * time elapsed in seconds)
```

## Project Setup

In this tutorial, we are going to write and test smart contracts along with building a web app. For the smart contract, we are going to use Hardhat, and for the web app, React. Let's get started on both.

### Hardhat Setup

To begin, create a directory for this tutorial and open it in a code editor like VS Code. To set up the Hardhat project, run the following command in the terminal:

```bash
npx hardhat .
```

After the project setup is complete, remove all the files from the `contracts` and `test` directories. Create three new files, `DutchAuction.sol` and `NFT.sol` in the `contracts` directory and `DutchAuction.sol` in the `test` directory, respectively. We must also create an`.env` file to store the private key of the wallet that will be used for contract deployment.

We also need to install some dependencies that will help us in the development process. Those dependencies are as follows:

- `@openzeppelin/contracts`: provide us with ERC-721 standard to create NFT
- `dotenv`: help us read the environment variables like our private key
- `solidity-coverage`: shows us test coverage for our contracts

To install that package, run the following command in the terminal:

```bash
yarn add "dotenv" "@openzeppelin/contracts" "solidity-coverage"
```

## Web App Setup

For the web app, we are going to use React.js. To create a React project, run the following command in the terminal:

```bash
npx create-react-app frontend
```

We also need to install a few packages for our web app. These packages are as follows:

- `ethers`: To interact with smart contracts and wallets
- `react-toastify`: To show notifications on the web app

To install those packages, go to the `frontend` directory and run the following command:

```bash
# Change directory to `frontend`
cd frontend
# Installing ethers v5.7.2 and react-toastify
yarn add "ethers@5.7.2" "react-toastify"
# Change directory back to base directory
cd ..
```

We have set up our project, so let's start by writing the NFT smart contract.

## NFT Contract

First, we will write our NFT contract, with which we are going to mint the NFT that will be auctioned. As the NFT contract is not the focus of this tutorial, simply copy the following code snippet into the **`NFT.sol`** file. If you want to learn more about NFTs, you can read the tutorials linked in the Prerequisites section.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("GameItem", "ITM") {}

    function awardItem(
        address player,
        string memory tokenURI
    ) public returns (uint256) {
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIds.increment();
        return newItemId;
    }
}
```

When we will put the NFT up for auction, we are going give permissions to auction contract to transfer the NFT from our wallet. The next step will be to write the auction contract.

## Auction Contract

To create a auction smart contract, we start by opening the `DutchAuction.sol` file and pasting the following code snippet that defines the smart contract outline and necessary imports:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract DutchAuction { }
```

### **Defining Variables**

We want to store some key parameters related to the auction in the contract, and for each of those, we should create a variable. The variables are as follows:

- **`nft`**: This variable is of type **`IERC721`** and it stores the address of the non-fungible token (NFT) contract that will be used to mint and auction the NFT.
- **`initialPrice`**: This variable of type **`uint256`** sets the initial price of the NFT in ether.
- **`discountRate`**: This variable of type **`uint256`** sets the discount rate at which the price of the NFT will decrease per unit time.
- **`duration`**: This variable of type **`uint256`** sets the duration of the auction in days.
- **`sold`**: This variable of type **`bool`** indicates whether the NFT has been sold or not. It is initially set to **`false`**.
- **`startTime`**: This variable of type **`uint256`** stores the timestamp when the auction starts.
- **`id`**: This variable of type **`uint256`** stores the ID of the NFT that will be auctioned.

```solidity
contract DutchAuction {		
		IERC721 public nft;
		
		uint256 public initialPrice = 50 ether;
		uint256 public discountRate = 20 wei;
		uint256 public duration = 7 days;
		bool public sold = false;
		
		uint256 public startTime;
		uint256 public id;
		
		// Constructor
}
```

### Defining Constructor

In the constructor function, we are initializing three variables, namely **`id`**, **`startTime`**
, and **`nft`**. We require two arguments to set these variables, **`_id`** and **`_nft`**. We pass **`_nft`** to **`IERC721`** to set up the **`nft`** variable, while **`id`** is assigned the value of **`_id`**. Additionally, we also set the value of **`startTime`** as the current timestamp at the moment of contract deployment.

```solidity
		constructor(
        address _nft,
        uint256 _id
    ) {
        id = _id;
        nft = IERC721(_nft);

        startTime = block.timestamp;
    }

		//Calculate current price of the NFT
```

### Get Current Price

We have learned how we can calculate current price of the item being auctioned so let’s implement that in the function called `getPrice`. The formula for current price is:

```
current price = initial price - (discount rate * time elapsed in seconds)
```

Time elapsed can be calculated by subtracting current timestamp and start time. This will give us elapsed time in seconds. We can multiply of time elapsed with `discountRate` and subtract result from initial price.

```solidity
		// Calculate current price of the NFT
    function getPrice() public view returns (uint256 price) {
        uint256 timePassed = block.timestamp - startTime;
        price = initialPrice - (timePassed * discountRate);
    }

		// buy NFT being auctioned
```

### Buy NFT

Let’s write a function that will allow anyone to buy at current price called `buy`. The function checks if the auction is still ongoing by verifying if the current block timestamp is less than the end time of the auction. Then, it calculates the current price of the NFT using the **`getPrice()`** function, and verifies if the value sent with the transaction is greater than or equal to the calculated price. If the conditions are met, the function transfers the NFT from the contract owner to the caller and refunds any excess ETH sent with the transaction. Finally, it sets the **`sold`** variable to **`true`**.

```solidity
		// buy NFT being auctioned
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
```

We have completed to our smart contract so we can move on to unit testing it.

## Unit Tests

It is a best practice to write unit tests for all smart contracts to ensure that they work according to our assumptions. Let’s write unit tests for our smart contract. To begin, paste the following code snippet which will import dependencies and create a `describe` block containing all the tests:

```solidity
const {
    days,
} = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration");
const {
    loadFixture,
    time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");

describe("Dutch Auction", async () => {
    const deployFixture = async () => { }
});
```