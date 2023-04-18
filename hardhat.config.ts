import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const ALCHEMY_API: string = `${process.env.ALCHEMY_API_KEY}`;
const PRIVATE_KEY: string = `${process.env.GOERLI_PRIVATE_KEY}`;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      
      url: ``,
      accounts: [PRIVATE_KEY]
    },
    mumbai: {
      url: ``,
      accounts: [PRIVATE_KEY]
    }
  }
};

export default config;
