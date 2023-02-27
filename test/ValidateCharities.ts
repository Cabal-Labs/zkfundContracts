import { expect } from "chai";
import { ethers } from "hardhat";

describe("ValidateCharities", function () {
	// We define a fixture to reuse the same setup in every test."
	async function deployValidateCharitiesFixture() {
		const ValidateCharities = await ethers.getContractFactory(
			"ValidateCharities"
		);
		const validateCharities = await ValidateCharities.deploy();
		return validateCharities;
	}
	describe("Deployment", function () {
		it("should return an empty list of charities", async function () {
			const validateCharities = await deployValidateCharitiesFixture();
			expect(await validateCharities.getCharities()).to.be.empty;
		});
	});
});
