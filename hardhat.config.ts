import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const ALCHEMY_API: string = `${process.env.ALCHEMY_API_KEY}`;
const PRIVATE_KEY: string = `${process.env.GOERLI_PRIVATE_KEY}`;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      
      url: `https://eth-goerli.g.alchemy.com/v2/tb14Hsk3uF7yilSybLouN-sdaLnsC_DD`,
      accounts: [PRIVATE_KEY]
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/fd71bb96e10248c6a49bed5bc7a16516`,
      accounts: [PRIVATE_KEY]
    }
  }
};

export default config;
