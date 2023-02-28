import { ethers } from "hardhat";
import { expect } from "chai";
//@ts-ignore
// Wating to end ValidateCharity.sol to add the interface
import { CharityRegistry, Charity } from "../t";

describe("CharityRegistry", function () {
  let charityRegistry: CharityRegistry;
  let charity: Charity;

  beforeEach(async function () {
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy();

    const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
    charityRegistry = await CharityRegistry.deploy(votingContract.address);

    charity = {
      id: 1,
      name: "Test Charity",
      wallet: ethers.constants.AddressZero,
      donationPool: 0,
      lastReleaseTimestamp: 0,
      isRemoved: false,
      isDonationLimitEnabled: false,
      donationLimit: 0,
      isEmergencyStopEnabled: false,
      isDonationReleasePaused: false,
    };
  });

  it("should add a new charity", async function () {
    await charityRegistry.addCharity(charity.name, charity.wallet);
    const storedCharity = await charityRegistry.charities(charity.id);

    expect(storedCharity.name).to.equal(charity.name);
    expect(storedCharity.wallet).to.equal(charity.wallet);
    expect(storedCharity.donationPool).to.equal(charity.donationPool);
    expect(storedCharity.lastReleaseTimestamp).to.equal(charity.lastReleaseTimestamp);
    expect(storedCharity.isRemoved).to.equal(charity.isRemoved);
    expect(storedCharity.isDonationLimitEnabled).to.equal(charity.isDonationLimitEnabled);
    expect(storedCharity.donationLimit).to.equal(charity.donationLimit);
    expect(storedCharity.isEmergencyStopEnabled).to.equal(charity.isEmergencyStopEnabled);
    expect(storedCharity.isDonationReleasePaused).to.equal(charity.isDonationReleasePaused);
  });

  it("should update an existing charity", async function () {
    await charityRegistry.addCharity(charity.name, charity.wallet);
    const newWallet = ethers.Wallet.createRandom().address;
    await charityRegistry.updateCharity(charity.id, charity.name, newWallet);
    const storedCharity = await charityRegistry.charities(charity.id);

    expect(storedCharity.wallet).to.equal(newWallet);
  });

  it("should remove an existing charity", async function () {
    await charityRegistry.addCharity(charity.name, charity.wallet);
    await charityRegistry.removeCharity(charity.id);
    const storedCharity = await charityRegistry.charities(charity.id);

    expect(storedCharity.isRemoved).to.equal(true);
  });

  it("should limit donations for a charity", async function () {
    const donationLimit = 1000;
    await charityRegistry.addCharity(charity.name, charity.wallet);
    await charityRegistry.limitDonation(charity.id, donationLimit);
    const storedCharity = await charityRegistry.charities(charity.id);

    expect(storedCharity.isDonationLimitEnabled).to.equal(true);
    expect(storedCharity.donationLimit).to.equal(donationLimit);
  });
});