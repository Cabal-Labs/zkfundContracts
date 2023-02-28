import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValidateCharities", function () {
	// We define a fixture to reuse the same setup in every test."
	async function deployValidateCharitiesFixture() {
		const ValidateCharities = await ethers.getContractFactory(
			"ValidateCharities"
		);
		const validateCharities = await ValidateCharities.deploy();
		let owner = await validateCharities.owner();
		// create a list of 10 charities
		const initialCharities = [
			{
				name: "Charity 1",
				walletAddress: `0x${Math.floor(Math.random() * 100)}`,
				//?^ is this the right way to generate a random address?
				hasWallet: true,
			},
			{
				name: "Charity 2",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 3",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 4",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 5",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 6",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 7",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 8",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 9",
				walletAddress: "",
				hasWallet: false,
			},
			{
				name: "Charity 10",
				walletAddress: "",
				hasWallet: false,
			},
		];
		// initialize those charities
		for (let i = 0; i < initialCharities.length; i++) {
			await validateCharities.initCharity(
				initialCharities[i].name,
				initialCharities[i].walletAddress,
				initialCharities[i].hasWallet
			);
		}

		return { validateCharities, owner };
	}
	describe("Deployment", function () {
		it("should return 10 charities", async function () {
			const { validateCharities } = await deployValidateCharitiesFixture();
			expect(await validateCharities.getCharities()).length.to.equal(10);
		});
		it("should have the owner as the only validator", async function () {
			const { validateCharities, owner } =
				await deployValidateCharitiesFixture();
			console.log(owner);
			expect(await validateCharities.getValidatorCount()).to.equal(1);
			expect(await validateCharities.validators.call(owner, "")).to.equal(true);
		});
	});
	describe("Validator Creation", function () {
		it("should allow the owner to create a new validator", async function () {});
		it("should prevent a non-owner from creating a validator", async function () {});
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
