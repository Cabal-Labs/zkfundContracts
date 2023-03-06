import {ethers} from "hardhat";

async function main() { 
    const ValidateCharity = await ethers.getContractFactory("ValidateCharities");
	const validateCharities = ValidateCharity.attach(
		"0x74E941F4Ce36338EB9D914f1a0CE99B50E312309"
	);
    
	console.log("Adding Test Charity to ValidateCharity contract... Charity Address: 0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834");
	
	console.log(await validateCharities.getCharityStatus(1))
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});