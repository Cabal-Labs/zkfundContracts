import { ethers } from "hardhat";
import { expect } from "chai";
//@ts-ignore
// Wating to end ValidateCharity.sol to add the interface

//create an interface to store the charity data
interface Charity {
  id?: number;
  name?: string;
  wallet?: string;
  donationPool?: number;
  lastReleaseTimestamp: number;
  isRemoved: boolean;
  isDonationLimitEnabled: boolean;
  donationLimit: number;
  isEmergencyStopEnabled: boolean;
  isDonationReleasePaused: boolean;
}


describe("CharityRegistry", function () {
 
  let charity: Charity;
  

  async function deployCharitiesFixture() {
    const ONE_GWEI = 1_000_000_000;

    
		const ValidateCharities = await ethers.getContractFactory("ValidateCharities");
    const lockedAmount = ONE_GWEI * 100;
		const validateCharities = await ValidateCharities.deploy( {value: lockedAmount});
   
    const _addresses = await ethers.getSigners();
		const owner = _addresses[0];
		const testAddresses = _addresses.slice(1, 5);
		const validatorAddresses = _addresses.slice(5, 10);
		

    await populateCharities(validateCharities.initCharity, validatorAddresses[1].address, validatorAddresses[2].address, validatorAddresses[3].address);
    
    const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
    const charityRegistry = await CharityRegistry.deploy(validateCharities.address);

    await validateCharities.setCharityRegistry(charityRegistry.address);

    charity = {
      donationPool: 0,
      lastReleaseTimestamp: 0,
      isRemoved: false,
      isDonationLimitEnabled: false,
      donationLimit: 0,
      isEmergencyStopEnabled: false,
      isDonationReleasePaused: false,
    };

		

		return {
			validateCharities,
      charityRegistry,
			owner,
			testAddresses,
			validatorAddresses,
		};
	}
  async function waitForEvent(contract: any, eventName: string, timeout: number = 2000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        contract.removeAllListeners(eventName);
       
      }, timeout);
  
      contract.on(eventName, (...args: any[]) => {
        clearTimeout(timeoutId);
        contract.removeAllListeners(eventName);
        resolve(args);
      });
    });
  }

  async function populateCharities(initCharity: Function, address1: string, address2: string, address3: string) {
		const charities = [
			{
				charityAddress: address1,
				charityName: "Charity 1",
				hasWallet: true,
			},
			{
				charityAddress: address2,
				charityName: "Charity 2",
				hasWallet: true,
			},
			{
				charityAddress: address3,
				charityName: "Charity 3",
				hasWallet: true,
			},
		];
		for (let i = 0; i < charities.length; i++) {
			await initCharity(
				charities[i].charityAddress,
				charities[i].charityName,
				charities[i].hasWallet
			);
		}
	}



  it("should add a new charity for donations", async function () {
    const { 
      validateCharities,
      charityRegistry,
			owner,
    } = await deployCharitiesFixture();
    

    const charities = await validateCharities.getCharities();
    const charityId = charities[1].charityId.toNumber();
  

    expect(await validateCharities.voteApprove(charityId)).to.emit(validateCharities, "ApproveVote").withArgs(owner, charityId);
    //@ts-ignore
    await waitForEvent(charityRegistry, "CharityAdded", 10000);
    const storedCharity = await charityRegistry.getCharity(1);
    expect(storedCharity.name).to.equal(charities[1].name);
    expect(storedCharity.wallet).to.equal(charities[1].walletAddress);
    expect(storedCharity.donationPool).to.equal(charity.donationPool);
    expect(storedCharity.lastReleaseTimestamp).to.equal(charity.lastReleaseTimestamp);
    expect(storedCharity.isRemoved).to.equal(charity.isRemoved);
    expect(storedCharity.isDonationLimitEnabled).to.equal(charity.isDonationLimitEnabled);
    expect(storedCharity.donationLimit).to.equal(charity.donationLimit);
    expect(storedCharity.isEmergencyStopEnabled).to.equal(charity.isEmergencyStopEnabled);
    expect(storedCharity.isDonationReleasePaused).to.equal(charity.isDonationReleasePaused);
  });

  it("should make a donation", async function () {
    const { 
      validateCharities,
      charityRegistry,
			owner,
      validatorAddresses
    } = await deployCharitiesFixture();
    
    const charities = await validateCharities.getCharities();
    const charityId = charities[1].charityId
   await validateCharities.voteApprove(charityId)

    const balance = await ethers.provider.getBalance(validatorAddresses[1].address);

    await expect(await charityRegistry.makeDonation(charityId, {value: ethers.utils.parseEther("1")})).to.emit(charityRegistry, "DonationMade").withArgs(1, owner.address, ethers.utils.parseEther("1"));
    
    const sb = await charityRegistry.charities(charityId)
    expect(sb.donationPool).to.equal(ethers.utils.parseEther("1"));

  });


  
});