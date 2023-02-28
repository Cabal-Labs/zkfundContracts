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
		const testAddresses = _addresses.slice(1);
		// create a list of 10 charities
		// const initialCharities = [
		// 	{
		// 		name: "Charity 1",
		// 		walletAddress: ethers.Wallet.createRandom().address,
		// 		hasWallet: true,
		// 	},
		// 	{
		// 		name: "Charity 2",
		// 		walletAddress: ethers.Wallet.createRandom().address,
		// 		hasWallet: true,
		// 	},
		// 	{
		// 		name: "Charity 3",
		// 		walletAddress: "",
		// 		hasWallet: false,
		// 	},
		// ];
		// // initialize those charities
		// for (let i = 0; i < initialCharities.length; i++) {
		// 	await validateCharities.initCharity(
		// 		initialCharities[i].name,
		// 		initialCharities[i].walletAddress,
		// 		initialCharities[i].hasWallet
		// 	);
		// }

		return { validateCharities, owner, testAddresses };
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
			const { validateCharities, owner } =
				await deployValidateCharitiesFixture();
			const newValidator = ethers.Wallet.createRandom().address;
			await validateCharities.addValidator(newValidator);
			expect(await validateCharities.validators(newValidator)).to.equal(true);
		});
		it("should prevent a non-validator from creating a validator", async function () {
			const { validateCharities, owner, testAddresses } =
				await deployValidateCharitiesFixture();
			const newValidator = testAddresses[1].address;

			await expect(
				validateCharities.connect(testAddresses[0]).addValidator(newValidator)
			).to.be.revertedWith("Only Validators Can Do This Action");
		});
		it("should prevent a validator from being created twice", async function () {});
	});
	describe("Charity Creation", function () {
		it("should allow the any validator to create a charity", async function () {});
		it("should prevent a non-validator from creating a charity", async function () {});
		it("should prevent two charities with the same name from being created", async function () {});
		it("should prevent two charities with the same address from being created", async function () {});
	});
	describe("Voting", function () {
		it("should allow a validator to vote", async function () {});
		it("should prevent a non-validator from voting", async function () {});
		it("should prevent a validator from voting twice", async function () {});
		it("should prevent a validator from voting for a charity that doesn't exist", async function () {});
		it("should prevent a validator from voting for a charity that has already been approved", async function () {});
		it("should prevent a validator from voting for a charity that has already been rejected", async function () {});
		it("should be able to approve a charity", async function () {});
		it("should be able to reject a charity", async function () {});
		it("should prevent a charity from being approved if it has been rejected", async function () {});
		it("should prevent a charity from being rejected if it has been approved", async function () {});
		it("should prevent a charity from being approved if it has already been approved", async function () {});
		it("should prevent a charity from being rejected if it has already been rejected", async function () {});
	});
	describe("Approving/Disapproving Charities", function () {
		it("should allow a charity with 75% approval and 66% validator turnout to be approved", async function () {});
	});
});
