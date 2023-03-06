import { ethers } from "hardhat";
import { json } from "hardhat/internal/core/params/argumentTypes";
var fs = require('fs');

async function main() {	
	//Starting deployment of contracts to Goerli testnet
	console.log("Starting deployment to Goerli testnet...\n \n")

	//Deploying ValidateCharities
	console.log("Deploying ValidateCharities... \n")
	const ValidateCharities = await ethers.getContractFactory(
		"ValidateCharities"
	);
	const STAKE = ethers.utils.parseEther("0.2");
	
	const validateCharities = await ValidateCharities.deploy({
		value: STAKE,
	});
	
	
	await validateCharities.deployed();

	console.log("\n============================== \n ")
	const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
	const charityRegistry = await CharityRegistry.deploy(
		validateCharities.address
	);
	console.log("Deploying CharityRegistry... \n ")
	await charityRegistry.deployed();

	console.log("============================== \n ")
	
	console.log(`Setting CharityRegistry address in ValidateCharities... Address: ${charityRegistry.address} \n `)
	const gasLimit1 = await validateCharities.estimateGas.setCharityRegistry(charityRegistry.address);
	await validateCharities.setCharityRegistry(charityRegistry.address,{
		gasLimit: gasLimit1,
	});

	console.log("============================== \n ")

	console.log("Adding Test Charity to ValidateCharity contract... Charity Address: 0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834");
	console.log("============================== \n ")
	const gasLimit = await validateCharities.estimateGas.initCharity(
		"0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834",
		"Test Charity",
		true,
		"https://bafkreihxlypi6srdrvsohdfy57e3zn2cvgo3dgr6xfj4ux235ive3s4e2a.ipfs.nftstorage.link/",
	);
	await validateCharities.initCharity(
		"0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834",
		"Test Charity",
		true,
		"https://bafkreihxlypi6srdrvsohdfy57e3zn2cvgo3dgr6xfj4ux235ive3s4e2a.ipfs.nftstorage.link/",
		{
			gasLimit: gasLimit,
		}
	);
	
	console.log("Voting for Test Charity...\n ")

	console.log("============================== \n ")
	const gasLimit2 = await validateCharities.estimateGas.vote(1, true);
	await validateCharities.vote(1, true,{	gasLimit: gasLimit2,});

	

	console.log("Adding Charity to Charity Resgitry:", charityRegistry.address, "... Charity Address: 0x5E7Ce9F588F2aa647E0518e25A9c88AB48Ec6834 \n");
	
	console.log("============================== \n ")
	const gasLimit3 = await validateCharities.estimateGas.resolveCharity(1)
	await validateCharities.resolveCharity(1,{gasLimit: gasLimit3});
	

	console.log("Deployment complete! CharityRegistry address:", charityRegistry.address, "ValidateCharities address:", validateCharities.address);
	
	console.log("============================== \n ")

	const jsonData = JSON.stringify({
		"ValidateCharities": validateCharities.address,
		"CharityRegistry": charityRegistry.address
	})
	//Writing addresses to file
	fs.exists('ContractAddresses.json', function(exists: any) {
		if (exists) {
			//Edditing file
			fs.readFile('ContractAddresses.json', 'utf8', function readFileCallback(err: any, data: any){
				if (err){
					console.log(err);
				}
				else {
					var obj = JSON.parse(data);
					obj.ValidateCharities = validateCharities.address;
					obj.CharityRegistry = charityRegistry.address;
					var json = JSON.stringify(obj);
					fs.writeFile('ContractAddresses.json', json, 'utf8', function(err: any) {
						if (err) {
							console.log(err);
						}
					});
				}	
			});
		}else{
			fs.writeFile('ContractAddresses.json', jsonData, 'utf8', function(err: any) {
				if (err) {
					console.log(err);
				}
			});
		}
		
	});
	

	

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
