// SPDX-License-Identifier: GPL-3.0
pragma solidity >0.7.0 <=0.8.18;

contract Charities {
    // contract roadmap / requirements
    // be able to get and return all important information about the charity - maybe store this on ipfs
    // at deployment, the charity will be initialized
    // be able to initiate a donation to a charty -> from here we will interact with aztec... or wait
    // a user will interact with the aztec bridge and then this contract will facilitate the donation
    //
    struct Charity {
        string name;
        string charityId; // from mongodb _id
        address walletAddress; // might not have one, if not it will be address(0)
        // other stuff - descritpion ect later
    }
    // function createCharity(){
    //     // takes in charity address, and id, asks db for additional info, stores charity on ipfs
    // }
    // function getCharity(address charityAddress) public returns (Charity) {
    //     // bla
    // }
}
