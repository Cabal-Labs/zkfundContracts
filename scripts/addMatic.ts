import {ethers} from "hardhat";

async function main() { 
    const ValidateCharity = await ethers.getContractFactory("RequestCharities");
	const validateCharities = ValidateCharity.attach(
		"0xF166d4cD88957d5e7b2aB56cf45240f67C838499"
	);
    try{
       
        await validateCharities.addTokenToWhitelist("0xE097d6B3100777DC31B34dC2c58fB524C2e76921", {
            gasLimit: 10000000,
        });
    }catch(e){
        console.log(e);
    }

	


	

}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});