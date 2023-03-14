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
    const deployFixture = async () => {
        const [owner, buyer] = await hre.ethers.getSigners();
        let nft;

        try {
            const NFT = await hre.ethers.getContractFactory("NFT");
            nft = await NFT.deploy();

            await nft.deployed();
            await nft.awardItem(
                owner.address,
                "https://gist.githubusercontent.com/nikbhintade/97994377f414de00809dad098ca57bf2/raw/117c9db714b13425116c2496ed0b237e7c88d83b/nft.json"
            );
        } catch (err) {
            console.log(err);
        }

        let dutchauction;

        try {
            const DutchAuction = await hre.ethers.getContractFactory(
                "DutchAuction"
            );
            dutchauction = await DutchAuction.deploy(
                nft.address,
                0
            );

            await dutchauction.deployed();
        } catch (err) {
            console.log(err);
        }

        await nft.approve(dutchauction.address, 0);
        return { dutchauction, nft, owner, buyer };
    };
    it("should deploy contract set using correct parameters", async () => {
        const { dutchauction, nft } = await loadFixture(deployFixture);
        
        expect(await dutchauction.id()).to.be.equal(0);
        expect(await dutchauction.startTime()).to.be.equal((await time.latest()) - 1);
        expect(await dutchauction.nft()).to.be.equal(nft.address);
        
        expect(await nft.getApproved(0)).to.be.equal(dutchauction.address);
    });
    it("should retrun correct price", async () => {
        const { dutchauction } = await loadFixture(deployFixture);

        
        const DISCOUNT_RATE = await dutchauction.discountRate();
        const INITIAL_PRICE = await dutchauction.initialPrice();
        

        await time.increase(3600 - 1);

        const PRICE = hre.ethers.BigNumber.from(3600).mul(DISCOUNT_RATE);

        expect(await dutchauction.getPrice()).to.be.equal(INITIAL_PRICE.sub(PRICE));
    });
    it("should allow to buy the nft", async () => {
        const { dutchauction, nft, buyer } = await loadFixture(deployFixture);

        await time.increase(3600 - 1);
        const PRICE = await dutchauction.getPrice();

        expect(await dutchauction.connect(buyer).buy({value: PRICE})).to.emit(
            nft,
            "Transfer"
        ).withArgs(
            dutchauction.address,
            buyer.address,
            0
        )
    });
    it("should refund the extra amount", async () => {
        const { dutchauction, buyer } = await loadFixture(deployFixture);

        await time.increase(3600);
        
        await dutchauction.connect(buyer).buy({value: "999999999999999999999"})
        const PRICE = await dutchauction.getPrice();

        expect(await hre.ethers.provider.getBalance(dutchauction.address)).to.be.equal(hre.ethers.BigNumber.from(PRICE));
    });
    it("should not allow to buy after auction ends", async () => {
        const { dutchauction, buyer } = await loadFixture(deployFixture);

        await time.increase(days(7));
        
        const PRICE = await dutchauction.getPrice();
        await expect(dutchauction.connect(buyer).buy({value: PRICE})).to.revertedWith("Auction ended");
    });
    it("should not allow if less price is paid", async () => {
        const { dutchauction, buyer } = await loadFixture(deployFixture);

        await time.increase(3600);
        
        const PRICE = await dutchauction.getPrice();
        await expect(dutchauction.connect(buyer).buy({value: PRICE.sub(1000)})).to.revertedWith("ETH < price");
    });
});
