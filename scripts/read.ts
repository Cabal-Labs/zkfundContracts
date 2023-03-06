import {ethers} from "hardhat";

async function main() { 
    const ValidateCharities = await ethers.getContractFactory("ValidateCharities");
	const validateCharities = ValidateCharities.attach(
		"0x74E941F4Ce36338EB9D914f1a0CE99B50E312309"
	);
	const gasLimit = await validateCharities.estimateGas.resolveCharity(1);
    const charity = await validateCharities.resolveCharity(1, {gasLimit: gasLimit});
    console.log(charity + "\n");
	

}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});