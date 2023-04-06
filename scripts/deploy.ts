import { ethers } from "hardhat";
import { promises as fs } from "fs";
import { CharityRegistryABI } from "../ABIs/CharityRegistry";


async function main() {
  // Starting deployment of contracts to Goerli testnet
  console.log("Starting deployment to Goerli testnet...\n \n");

  // Deploying ValidateCharities
  console.log("Deploying ValidateCharities... \n");
  const reqCharArtifact = await ethers.getContractFactory("RequestCharities");
  const STAKE = ethers.utils.parseEther("0.2");

  const reqChar = await reqCharArtifact.deploy({
    value: STAKE,
  });

  await reqChar.deployed();

  console.log(`RequestCharities address: ${reqChar.address}`);

  // Deploying FundToken
  console.log("Deploying FundToken... \n");
  const fundTokenArtifact = await ethers.getContractFactory("FundToken");
  const fundToken = await fundTokenArtifact.deploy("FundToken", "FT", 18);
  await fundToken.deployed();

  console.log(`FundToken address: ${fundToken.address}`);

  // Deploying CharityRegistry
  console.log("Deploying CharityRegistry... \n");
  const charityRegistryArtifact = await ethers.getContractFactory(
    "CharityRegistry"
  );
  
  const charityRegistry = await charityRegistryArtifact.deploy(
    reqChar.address,
    fundToken.address, 
	"bafybeifr4a2ld6pnowtgg4syn4tc5qfk6hi3pukgiyeu3zloi7rbfdw5fq"
  );
  await charityRegistry.deployed();
  console.log(`CharityRegistry address: ${charityRegistry.address}`);

  try {
    await (await reqChar.setCharityRegistry(charityRegistry.address, {
      gasLimit: 10000000,
    })).wait();
    console.log("RequestCharities Contract connected to CharityRegistry");
  } catch (err) {
    console.error(err);
  }

  try {
    await fundToken.setRegistry(charityRegistry.address, {
      gasLimit: 10000000,
    });
    console.log("FundToken Contract connected to CharityRegistry");
  } catch (err) {
    console.error(err);
  }

  console.log("============================== \n ");

	console.log("Adding Test Charity to ValidateCharity contract... Charity Address: 0x330deD2987a65d0B24d7A9379b0F8a66c8302D01 \n");

    try{
        
        await reqChar.initCharity(
            "0x330deD2987a65d0B24d7A9379b0F8a66c8302D01",
            "Test Charity",
            true,
            "bafybeiamgpe4aad4qz4hyad26owkayoh3df7hl6sjlhjzbpjw6hzllxtja",
            {
                gasLimit: 10000000,
            }
        );
    
    }catch(e) {
        console.log(e);
    }

	console.log("============================== \n ")
	

	console.log("Voting for Test Charity...\n ")

	
	await reqChar.vote(1, true,{
        gasLimit: 10000000,
    });

	console.log("============================== \n ")

    console.log("Adding Charity to Charity Resgitry. Charity Address: 0x330deD2987a65d0B24d7A9379b0F8a66c8302D01 \n");


	await reqChar.resolveCharity(1,{
        gasLimit: 10000000,
    });

    console.log("============================== \n ")

    console.log('Set whitelisted token to CharityRegistry contract... \n')

	try{
       
        await reqChar.addTokenToWhitelist("0x0fa8781a83e46826621b3bc094ea2a0212e71b23", {
            gasLimit: 10000000,
        });
    }catch(e){
        console.log(e);
    }

	try{
       
        await reqChar.addTokenToWhitelist("0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa", {
            gasLimit: 10000000,
        });
    }catch(e){
        console.log(e);
    }
    
    
    


    console.log("============================== \n ")

	
    console.log("Deployment complete! CharityRegistry address:", charityRegistry.address, " \n ValidateCharities address:", reqChar.address, "\n FundToken address:", fundToken.address, "\n AAFactory address:", );
   
	//Writing addresses to file
	try {
		await fs.access("ContractAddresses.json");
		// File exists, edit the file
		try {
		  const data = await fs.readFile("ContractAddresses.json", "utf8");
		  const obj = JSON.parse(data);
		  obj.RequestCharities = reqChar.address;
		  obj.CharityRegistry = charityRegistry.address;
		  obj.FundToken = fundToken.address;
		  const json = JSON.stringify(obj);
		  await fs.writeFile("ContractAddresses.json", json, "utf8");
		} catch (err) {
		  console.error(err);
		}
	  } catch (error) {
		// File does not exist, create a new file
		const jsonData = JSON.stringify({
		  ValidateCharities: reqChar.address,
		  CharityRegistry: charityRegistry.address,
		  FundToken: fundToken.address,
		});
		try {
		  await fs.writeFile("ContractAddresses.json", jsonData, "utf8");
		} catch (err) {
		  console.error(err);
		}
	  }
	}
	
	// We recommend this pattern to be able to use async/await everywhere
	// and properly handle errors.
	main().catch((error) => {
	  console.error(error);
	  process.exitCode = 1;
	});
