import { ethers } from "hardhat";

async function main() {	
	//Starting deployment of contracts to Goerli testnet
	console.log("Starting deployment to Goerli testnet...")

	//Deploying ValidateCharities
	console.log("Deploying ValidateCharities...")
	const ValidateCharities = await ethers.getContractFactory(
		"ValidateCharities"
	);
	const STAKE = ethers.utils.parseEther("0.2");
	const validateCharities = await ValidateCharities.deploy({
		value: STAKE,
	});
	
	
	await validateCharities.deployed();

	const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
	const charityRegistry = await CharityRegistry.deploy(
		validateCharities.address
	);
	console.log("Deploying CharityRegistry...")
	await charityRegistry.deployed();
	
	console.log(`Setting CharityRegistry address in ValidateCharities... Address: ${charityRegistry.address} `)
	await validateCharities.setCharityRegistry(charityRegistry.address);

	console.log("Adding Test Charity to ValidateCharity contract... Charity Address: 0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834");

	await validateCharities.initCharity(
		"0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834",
		"Test Charity",
		true,
		"https://bafkreihxlypi6srdrvsohdfy57e3zn2cvgo3dgr6xfj4ux235ive3s4e2a.ipfs.nftstorage.link/",
	);
	
	console.log("Voting for Test Charity...")

	await validateCharities.vote(1, true);

	console.log("Adding Charity to Charity Resgitry:", charityRegistry.address, "... Charity Address: 0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834 ");
	
	await validateCharities.resolveCharity(1);
	

	console.log("Deployment complete! CharityRegistry address:", charityRegistry.address, "ValidateCharities address:", validateCharities.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
