import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

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


describe("ValidateCharities", function () {
	// We define a fixture to reuse the same setup in every test."
	let charity: Charity;


	async function deployValidateCharitiesFixture() {
		const ONE_GWEI = 1_000_000_000;
		const ValidateCharities = await ethers.getContractFactory(
			"ValidateCharities"
		);
		const lockedAmount = ONE_GWEI * 100;
		const validateCharities = await ValidateCharities.deploy({
			value: lockedAmount,
		});
		const _addresses = await ethers.getSigners();
		const owner = _addresses[0];
		const testAddresses = _addresses.slice(1, 5);
		const validatorAddresses = _addresses.slice(5, 10);
		for (let i = 0; i < validatorAddresses.length; i++) {
			await validateCharities.addValidator(validatorAddresses[i].address);
		}

		
		async function populateCharities(
			address1: string = ethers.Wallet.createRandom().address,
			address2: string = ethers.Wallet.createRandom().address,
			address3: string = ethers.Wallet.createRandom().address
			) {
			let _charities = [
				{
					charityAddress: validatorAddresses[0].address,
					charityName: "Charity 1",
					hasWallet: true,
				},
				{
					charityAddress: ethers.Wallet.createRandom().address,
					charityName: "Charity 2",
					hasWallet: true,
				},
				{
					charityAddress: ethers.Wallet.createRandom().address,
					charityName: "Charity 3",
					hasWallet: true,
				},
				{
					charityAddress: ethers.Wallet.createRandom().address,
					charityName: "Charity 4",
					hasWallet: true,
				},
				{
					charityAddress: ethers.Wallet.createRandom().address,
					charityName: "Charity 5",
					hasWallet: false,
				},
			];
			let charities = [];
			for (let i = 0; i < _charities.length; i++) {
				let newCharity = await validateCharities.initCharity(
					_charities[i].charityAddress,
					_charities[i].charityName,
					_charities[i].hasWallet
				);
				charities.push(newCharity);
			}
			charity = {
				donationPool: 0,
				lastReleaseTimestamp: 0,
				isRemoved: false,
				isDonationLimitEnabled: false,
				donationLimit: 0,
				isEmergencyStopEnabled: false,
				isDonationReleasePaused: false,
			};
			// loop through validators and vote pass for charity 1, fail for charity 2, pending for charity 3
			// for (let i = 0; i < validatorAddresses.length; i++) {
			// 	// all validators will vote for charity1 and charity2, only 20% of validators will vote for charity3
			// 	//90% of validators will vote approve (true) for charity1 and 50% will approve for charity2
			// 	//getVote one is a function that returns true x% of the time
			// 	function getVote(x: number) {
			// 		return Math.random() < x;
			// 	}
			// 	//approved
			// 	await validateCharities
			// 		.connect(validatorAddresses[i])
			// 		.vote(_charities[1].charityAddress, getVote(0.9));
			// 	// has turnout, not approval
			// 	await validateCharities
			// 		.connect(validatorAddresses[i])
			// 		.vote(_charities[1].charityAddress, getVote(0.5));
			// 	// doesn't have turnout, but has approval
			// 	if (i < validatorAddresses.length * 0.2) {
			// 		await validateCharities
			// 			.connect(validatorAddresses[i])
			// 			.vote(_charities[2].charityAddress, getVote(1));
			// 		// not enough support or approval
			// 		await validateCharities
			// 			.connect(validatorAddresses[i])
			// 			.vote(_charities[3].charityAddress, getVote(0.4));
			// 	}
			// 	// doesn't  have an wallet
			// 	await validateCharities
			// 		.connect(validatorAddresses[i])
			// 		.vote(_charities[4].charityAddress, getVote(1));
			// }
		}

		const CharityRegistry = await ethers.getContractFactory("CharityRegistry");
		const charityRegistry = await CharityRegistry.deploy(
			validateCharities.address
		);

		await validateCharities.setCharityRegistry(charityRegistry.address);

		return {
			validateCharities,
			owner,
			testAddresses,
			validatorAddresses,
			charityRegistry,
			populateCharities,
		};
	}

	async function waitForEvent(
		contract: any,
		eventName: string,
		timeout: number = 2000
	) {
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

	describe("Deployment", function () {
		it("should return an empty list of charities", async function () {
			const { validateCharities } = await deployValidateCharitiesFixture();
			let charities = await validateCharities.getCharities();
			expect(charities.length).to.equal(0);
		});
		it("should have the owner as the only validator", async function () {
			const { validateCharities, owner } =
				await deployValidateCharitiesFixture();
			expect(await validateCharities.validators(owner.address)).to.equal(true);
		});
		it("adds 1 charity", async function () {
			const { validateCharities } = await deployValidateCharitiesFixture();
			await validateCharities.initCharity(
				ethers.Wallet.createRandom().address,
				"Charity 1",
				true
			);
			let charities = await validateCharities.getCharities();
			expect(charities.length).to.equal(1);
		});
	});
	describe("Validator Creation", function () {
		it("should allow the owner to create a new validator", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const newValidator = testAddresses[1].address;
			await validateCharities.addValidator(newValidator);
			expect(await validateCharities.validators(newValidator)).to.equal(true);
		});
		it("should prevent a non-validator from creating a validator", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const newValidator = testAddresses[1].address;

			await expect(
				validateCharities.connect(testAddresses[0]).addValidator(newValidator)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should prevent a validator from being created twice", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const newValidator = testAddresses[1].address;
			await validateCharities.addValidator(newValidator);
			expect(await validateCharities.validators(newValidator)).to.equal(true);
			await expect(
				validateCharities.addValidator(newValidator)
			).to.be.revertedWith("Validator already exists");
		});
	});
	describe("Charity Creation", function () {
		it("should allow the any validator to create a charity", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const _charityAddress = ethers.Wallet.createRandom().address;
			const _charityName = "Charity 1";
			const _hasWallet = true;
			expect(
				await validateCharities.initCharity(
					_charityAddress,
					_charityName,
					_hasWallet
				)
			)
				.to.emit(validateCharities, "CharityCreated")
				.withArgs(_charityAddress, _charityName, _hasWallet);
		});
		it("should prevent a non-validator from creating a charity", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const _charityAddress = ethers.Wallet.createRandom().address;
			const _charityName = "Charity 1";
			const _hasWallet = true;
			await expect(
				validateCharities
					.connect(testAddresses[0])
					.initCharity(_charityAddress, _charityName, _hasWallet)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should prevent two charities with the same name from being created", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			//@ts-ignore -> type error
			const _charityAddress =  ethers.Wallet.createRandom().address;
			const _charityName = "Charity 3";
			const _hasWallet = true;
			expect(
				await validateCharities.initCharity(
					_charityAddress,
					_charityName,
					_hasWallet
				)
			)
				.to.emit(validateCharities, "CharityCreated")
				.withArgs(_charityAddress, _charityName, _hasWallet);
			await expect(
				validateCharities.initCharity(_charityAddress, _charityName, _hasWallet)
			).to.be.revertedWith("Charity with this name already exists");
		});
		it("should prevent two charities with the same address from being created", async function () {
			const { validateCharities, owner, testAddresses, validatorAddresses } =
				await deployValidateCharitiesFixture();
			//@ts-ignore -> type error
			const _charityAddress = validatorAddresses[0].address;
			const _charityName = "Charity 15";
			const _hasWallet = true;
			
			expect(
				await validateCharities.initCharity(
					_charityAddress,
					_charityName,
					_hasWallet
				)
			)
				.to.emit(validateCharities, "CharityCreated")
				.withArgs(_charityAddress, _charityName, _hasWallet);
			await expect(
				validateCharities.initCharity(_charityAddress, _charityName, _hasWallet)
			).to.be.revertedWith("Charity with this name already exists");
		});
	});
	describe("Voting", function () {
		it("should allow a validator to vote to approve", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			expect(await validateCharities.vote(charityId, true))
				.to.emit(validateCharities, "ApproveVote")
				.withArgs(owner, charityId);
		});
		it("should allow a validator to disapprove", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			expect(await validateCharities.vote(charityId, false))
				.to.emit(validateCharities, "DisapproveVote")
				.withArgs(owner, charityId);
		});
		it("should prevent a non-validator from voting", async function () {
			const { validateCharities, testAddresses, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			await expect(
				validateCharities.connect(testAddresses[0]).vote(charityId, true)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should prevent a validator from voting twice", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			expect(await validateCharities.vote(charityId, true))
				.to.emit(validateCharities, "ApproveVote")
				.withArgs(owner, charityId);
			await expect(validateCharities.vote(charityId, true)).to.be.revertedWith(
				"Validator has already voted for this charity"
			);
		});
		// it("should prevent a validator from voting for a charity that doesn't exist", async function () {
		// 	const { validateCharities, owner, populateCharities } =
		// 		await deployValidateCharitiesFixture();
		// 	const charityId: number = Math.random() * 100;
		// 	expect(await validateCharities.vote(charityId, true)).to.be.revertedWith(
		// 		"This charity does not exist"
		// 	);
		// });
		it("should prevent a validator from voting for a charity that has already been approved", async function () {
			const { validateCharities, owner, populateCharities,validatorAddresses } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, true);
			}
			await validateCharities.resolveCharity(charityId);

			await expect(validateCharities.vote(charityId, true)).to.be.revertedWith("Charity is not pending, Cannot vote on it")


		});
		it("should prevent a charity from being approved if it has already been approved", async function () {
			const { validateCharities, owner, populateCharities,validatorAddresses } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, true);
			}
			await validateCharities.resolveCharity(charityId);
			await expect(validateCharities.resolveCharity(charityId)).to.be.revertedWith("Charity is not pending, Cannot approve it")
		});
	});
	describe("Approving/Disapproving Charities", function () {
		it("should prevent a non-validator from approving a charity", async function () {
			const { validateCharities, testAddresses, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			await expect(
				validateCharities.connect(testAddresses[0]).resolveCharity(charityId)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should allow a charity with enough aproval votes to be approved", async function () {
		
			const { validateCharities, owner, populateCharities, validatorAddresses } =
				await deployValidateCharitiesFixture();
			await populateCharities();

			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, true);
			}
			
			expect(await validateCharities.resolveCharity(charityId))
				.to.emit(validateCharities, "CharityApproved")
				.withArgs(charityId, charities[1].walletAddress, charities[1].name);
		});

		it("should not allow a charity with enough aproval votes to be approved", async function () {
			const { validateCharities, owner, populateCharities, validatorAddresses } =
				await deployValidateCharitiesFixture();
			await populateCharities();

			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, false);
			}
			
			expect(await validateCharities.resolveCharity(charityId))
				.to.emit(validateCharities, "CharityDisapproved")
				.withArgs(charityId, charities[1].walletAddress, charities[1].name);
		});
		
	});

	describe("Charity Resgitry", function () {
		it("should add a new charity for donations", async function () {
			const { validateCharities, charityRegistry,populateCharities, owner, validatorAddresses } = await deployValidateCharitiesFixture();

			await populateCharities(
				validatorAddresses[1].address,
				validatorAddresses[2].address,
				validatorAddresses[3].address
			);
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
	

			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, true);
			}

			await validateCharities.resolveCharity(charityId);
			//@ts-ignore
			await waitForEvent(charityRegistry, "CharityAdded");

			const storedCharity = await charityRegistry.getCharity(1);
			expect(storedCharity.name).to.equal(charities[1].name);
			expect(storedCharity.wallet).to.equal(charities[1].walletAddress);
			expect(storedCharity.donationPool).to.equal(charity.donationPool);
			expect(storedCharity.lastReleaseTimestamp).to.equal(
				charity.lastReleaseTimestamp
			);
			expect(storedCharity.isRemoved).to.equal(charity.isRemoved);
			expect(storedCharity.isDonationLimitEnabled).to.equal(
				charity.isDonationLimitEnabled
			);
			expect(storedCharity.donationLimit).to.equal(charity.donationLimit);
			expect(storedCharity.isEmergencyStopEnabled).to.equal(
				charity.isEmergencyStopEnabled
			);
			expect(storedCharity.isDonationReleasePaused).to.equal(
				charity.isDonationReleasePaused
			);
		});

		it("should make a donation", async function () {
			const { validateCharities, charityRegistry,populateCharities, owner, validatorAddresses } = await deployValidateCharitiesFixture();

			await populateCharities(
				validatorAddresses[1].address,
				validatorAddresses[2].address,
				validatorAddresses[3].address
			);
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;

			for (let i = 0; i < validatorAddresses.length; i++) {
				await validateCharities.connect(validatorAddresses[i]).vote(charityId, true);
			}

			await validateCharities.resolveCharity(charityId);
			expect(await charityRegistry.makeDonation(1, {value: ethers.utils.parseEther("1"),})
			).to.emit(charityRegistry, "DonationMade").withArgs(1, owner.address, ethers.utils.parseEther("1"));
			const sb = await charityRegistry.charities(1);		
			expect(sb.donationPool).to.equal(ethers.utils.parseEther("1"));
		});
	});
});
