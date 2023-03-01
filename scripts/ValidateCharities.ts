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

		return {
			validateCharities,
			owner,
			testAddresses,
			validatorAddresses,
		};
	}
	async function populateCharities(initCharity: Function) {
		const charities = [
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
		];
		for (let i = 0; i < charities.length; i++) {
			await initCharity(
				charities[i].charityAddress,
				charities[i].charityName,
				charities[i].hasWallet
			);
		}
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
		it("should allow a validator to vote", async function () {
			const { validateCharities, owner } =
				await deployValidateCharitiesFixture();
			await populateCharities(validateCharities.initCharity);
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			expect(await validateCharities.voteApprove(charityId))
				.to.emit(validateCharities, "ApproveVote")
				.withArgs(owner, charityId);
		});
		it("should prevent a non-validator from voting", async function () {
			const { validateCharities, testAddresses } =
				await deployValidateCharitiesFixture();
			await populateCharities(validateCharities.initCharity);
			const charities = await validateCharities.getCharities();
			const charityId = charities[0].charityId;
			await expect(
				validateCharities.connect(testAddresses[0]).voteApprove(charityId)
			).to.be.revertedWith("Only validators can do this action");
		});
		it("should prevent a validator from voting twice", async function () {});
		it("should prevent a validator from voting for a charity that doesn't exist", async function () {});
		it("should prevent a validator from voting for a charity that has already been approved", async function () {});
		it("should prevent a validator from voting for a charity that has already been rejected", async function () {});
		it("should be able to approve a charity", async function () {});
		it("should be able to reject a charity", async function () {});
		it("should prevent a charity from being approved if it has been rejected", async function () {});
		it("should prevent a charity from being rejected if it has already been rejected", async function () {});
		it("should prevent a charity from being rejected if it has been approved", async function () {});
		it("should prevent a charity from being approved if it has already been approved", async function () {});
	});
	describe("Approving/Disapproving Charities", function () {
		it("should allow a charity with 75% approval and 66% validator turnout to be approved", async function () {});
	});
});
