import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const ALCHEMY_API: string = `${process.env.ALCHEMY_API_KEY}`;
const GOERLI_PRIVATE_KEY: string = `${process.env.GOERLI_PRIVATE_KEY}`;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      
      url: `https://eth-goerli.g.alchemy.com/v2/tb14Hsk3uF7yilSybLouN-sdaLnsC_DD`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};

export default config;
