import {ethers} from "hardhat";
import { Web3Storage, Web3File, Web3Response, Blob, File } from "web3.storage";
import { create } from "apisauce";

function getAccessToken() {
	return process.env.WEB_STORAGE as string;
}

function makeStorageClient() {
	return new Web3Storage({ token: getAccessToken() });
}

function makeFileObjects(obj: any) {
	const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });

	const files = [
		new File(["contents-of-file-1"], "plain-utf8.txt"),
		new File([blob], "charity.json"),
	];
	return files;
}


const getAllCharities = async () => {
	const api = create({
		// baseURL: "https://TODO.herokuapp.com/",
		baseURL: "http://127.0.0.1:8000/",
	});

	const charit = await api.get(`/charities`)
	return charit.data;
};

async function storeFiles(files: any) {
	const client = makeStorageClient();
	const cid = await client.put(files);
	console.log("stored files with cid:", cid);
	return cid;
}

interface Charity {
	images: string[];
	location: string;
	description: string;
	website: string;
	tags: string[];
	ein: string;
	email: string;
	aditionalInfo: string;
	phone: string;
	Validation: Validation;
}

interface Validation{
	Validated : boolean;
	Comments : string;
	ValidationDate : string;
}

async function realTest(validateCharities: any, Charities: Charity, address : string, name : string){
	const files = makeFileObjects(Charities);
	const cid = await storeFiles(files);
	try{
		const gasLimit = await validateCharities.estimateGas.initCharity(
			address,
			name,
			true,
			cid.toString()
		);
		const tx = await validateCharities.initCharity(
			address,
			name,
			true,
			cid.toString(),
			{	gasLimit: 10000000 }
		);
	}catch(e){
		console.log(e);
	}
	
	
}



async function main() { 
    const ValidateCharity = await ethers.getContractFactory("RequestCharities");
	const validateCharities = ValidateCharity.attach(
		"0xF166d4cD88957d5e7b2aB56cf45240f67C838499"
	);
	const data: any = await getAllCharities();
	let Charities : Charity[] = [];
	//@ts-ignore
	console.log(data.data.data.length);
	for (let i = 0; i < 10; i++) {
		//@ts-ignore
		Charities[i]= {
			location: data.data.data[i].location,
			description: data.data.data[i].description,
			website: data.data.data[i].website,
			tags: data.data.data[i].tags,
			ein: data.data.data[i].ein,
			email: data.data.data[i].email,
			aditionalInfo: data.data.data[i].aditionalInfo,
			images: data.data.data[i].images,
			phone: data.data.data[i].phone,
			Validation: {
				Validated: false,
				Comments: "",
				ValidationDate: ""
			}
		};
	}
	
	 await realTest(validateCharities, Charities[0], "0x79d32A97f4bf5a92BeC459f4019C563902790d70","Let's help the kids");
	 await realTest(validateCharities, Charities[1], "0x14455dbe2b43b69a0A7bD4c2493359d57199B770", "Food for the world");

	

	for (let i = 0; i < Charities.length; i++) {
		const files = makeFileObjects(Charities[i]);
		const cid = await storeFiles(files);
		
		try{
			
			const tx = await validateCharities.initCharity(
				ethers.Wallet.createRandom().address,
				Charities[i].tags[0],
				true,
				cid.toString(),
				{	gasLimit: 10000000 }
			);
			console.log(tx.hash)
		}catch(e){
			console.log(e);
		}
		
	}
	



    
	console.log("\n Done! Smart contract: ", validateCharities.address, " has been prepopulated with charities");
	
	
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});