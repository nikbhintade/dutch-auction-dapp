const hre = require("hardhat");

async function main() {
	const deployer = await hre.ethers.getSigner();
	console.log(deployer.address);

    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.deployed();

	console.log(`NFT contract address is ${nft.address}`)

	const mintTxn = await nft.awardItem(deployer.address, "https://gist.githubusercontent.com/nikbhintade/97994377f414de00809dad098ca57bf2/raw/137da789cb4ba9710db60439c27e9c36deeee555/nft.json")
	await mintTxn.wait();

	const DutchAuction = await hre.ethers.getContractFactory("DutchAuction");
	const dutchAuction = await DutchAuction.deploy(nft.address, 0);
	await dutchAuction.deployed();

	console.log(`Dutch Auction contract is ${dutchAuction.address}`)

	const approvalTxn = await nft.approve(dutchAuction.address, 0);
	await approvalTxn.wait();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
