import {ethers} from "hardhat";

async function main() { 
    const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
	const charityRegistry = CharityRegistry.attach(
		"0xbFD279BA2E714111B30B04ad52e893D1e99Ae6E4"
	);
    
    console.log(await charityRegistry.votingContract());
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});