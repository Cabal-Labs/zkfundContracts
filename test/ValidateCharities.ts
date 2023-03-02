import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValidateCharities", function () {
	// We define a fixture to reuse the same setup in every test."
	async function deployValidateCharitiesFixture() {
		const ValidateCharities = await ethers.getContractFactory(
			"ValidateCharities"
		);
		const validateCharities = await ValidateCharities.deploy();

		const _addresses = await ethers.getSigners();
		const owner = _addresses[0];
		const testAddresses = _addresses.slice(1, 5);
		const validatorAddresses = _addresses.slice(5, 10);
		for (let i = 0; i < validatorAddresses.length; i++) {
			await validateCharities.addValidator(validatorAddresses[i].address);
		}

		async function populateCharities() {
			const _charities = [
				{
					charityAddress: ethers.Wallet.createRandom().address,
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
			// loop through validators and vote pass for charity 1, fail for charity 2, pending for charity 3
			for (let i = 0; i < validatorAddresses.length; i++) {
				// all validators will vote for charity1 and charity2, only 20% of validators will vote for charity3
				//90% of validators will vote approve (true) for charity1 and 50% will approve for charity2
				//getVote one is a function that returns true x% of the time
				function getVote(x: number) {
					return Math.random() < x;
				}
				//approved
				await validateCharities
					.connect(validatorAddresses[i])
					.vote(_charities[0].charityAddress, getVote(0.9));
				// has turnout, not approval
				await validateCharities
					.connect(validatorAddresses[i])
					.vote(_charities[1].charityAddress, getVote(0.5));
				// doesn't have turnout, but has approval
				if (i < validatorAddresses.length * 0.2) {
					await validateCharities
						.connect(validatorAddresses[i])
						.vote(_charities[2].charityAddress, getVote(1));
					// not enough support or approval
					await validateCharities
						.connect(validatorAddresses[i])
						.vote(_charities[3].charityAddress, getVote(0.4));
				}
				// doesn't  have an wallet
				await validateCharities
					.connect(validatorAddresses[i])
					.vote(_charities[4].charityAddress, getVote(1));
			}
		}
		return {
			validateCharities,
			owner,
			testAddresses,
			validatorAddresses,
			populateCharities,
		};
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
			const _charityName = "Charity 101";
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
			await expect(
				validateCharities.initCharity(_charityAddress, _charityName, _hasWallet)
			).to.be.revertedWith("Charity With This Name Already Exists");
		});
		it("should prevent two charities with the same address from being created", async function () {});
	});
	describe("Voting", function () {
		it("should allow a validator to vote to approve", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			expect(await validateCharities.vote(charityId, true))
				.to.emit(validateCharities, "ApproveVote")
				.withArgs(owner, charityId);
		});
		it("should allow a validator to disapprove", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			expect(await validateCharities.vote(charityId, false))
				.to.emit(validateCharities, "DisapproveVote")
				.withArgs(owner, charityId);
		});
		it("should prevent a non-validator from voting", async function () {
			const { validateCharities, testAddresses, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			await expect(
				validateCharities.connect(testAddresses[0]).vote(charityId, true)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should prevent a validator from voting twice", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
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
			// also do i need this test case?
		});
		it("should prevent a validator from voting for a charity that has already been rejected", async function () {
			// also do i need this test case? something could come back into review
		});

		it("should prevent a charity from being approved if it has been rejected", async function () {
			// right, can't things come up for review again?
		});
		it("should prevent a charity from being rejected if it has already been rejected", async function () {
			// also fine, could fail the process twice
		});
		it("should prevent a charity from being rejected if it has been approved", async function () {
			// this would be the "emergecyStop" function but i'm not sure if this needs to get tested here
		});
		it("should prevent a charity from being approved if it has already been approved", async function () {
			// also harmless, unless it would incur unnecessary gas costs that a guard case it to revert
		});
	});
	describe("Approving/Disapproving Charities", function () {
		it("should prevent a non-validator from approving a charity", async function () {
			const { validateCharities, testAddresses, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			await expect(
				validateCharities.connect(testAddresses[0]).approveCharity(charityId)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should allow a charity: >=75% approval >=66% turnout to be approved", async function () {
			//this is broken
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			console.log(charities[0].walletAddress);
			expect(await validateCharities.approveCharity(charityId))
				.to.emit(validateCharities, "CharityApproved")
				.withArgs(charityId, charities[0].walletAddress, charities[0].name);
		});

		it("should not allow a charity: <75% approval >=66% turnout from being approved", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[1].charityId;
			await expect(
				validateCharities.approveCharity(charityId)
			).to.be.revertedWith("Less than 70% of validators have voted");
		});
		it("should not allow a charity: >=75% approval <66% turnout from being approved", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[2].charityId;
			await expect(
				validateCharities.approveCharity(charityId)
			).to.be.revertedWith(
				"This charity does not have enough votes to be validated"
			);
		});
		it("should not allow a charity: <75% approval <66% turnout from being approved", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[3].charityId;
			await expect(
				validateCharities.approveCharity(charityId)
			).to.be.revertedWith("Less than 70% of validators have voted");
		});
		it("should prevent a charity without a wallet from being approved", async function () {
			const { validateCharities, owner, populateCharities } =
				await deployValidateCharitiesFixture();
			await populateCharities();
			const charities = await validateCharities.getCharities();
			const charityId = charities[4].charityId;
			await expect(
				validateCharities.approveCharity(charityId)
			).to.be.revertedWith("A charity must have a wallet to be validated");
		});
	});
});
