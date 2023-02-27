// SPDX-License-Identifier: GPL-3.0
pragma solidity >0.7.0 <=0.8.18;
import "./Counters.sol";

contract ValidateCharities{
    using Counters for Counters.Counter;
    address public owner;
    constructor(){
        owner = msg.sender;
        validators[owner] = true;
    }
    enum CharityStatus {
        Pending, Disapproved, Approved
    }
    struct CharitySnapshot {
        string name;
        uint256 charityId; // from mongodb _id
        address walletAddress; // might not have one, if not it will be address(0)
        bool ownsWallet; // if true, then the wallet address is theirs
        //if false, they need to generate a wallet, and replace it before they can be validated
        CharityStatus status;
    }
    // only contains pertainent information to ensure charities are unique, the rest of the information will be stored on the db
    // when a charity is validated, another contract will be responsible for transferring all the data on chain
    // persitantly storing ---------------------------
    // TODO: Look into ARWave
    // struct Charity {
        // ... snapshot
        // all other info (mission, description, ect)
    // }
    // -------------------------------------------------

    // ========== Validator System ================
    // keep a store of who is a validator
    mapping (address => bool) public validators;
    Counters.Counter private _validatorCount;
    // have a way to require that only validators can do certain things (done)
    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == owner, "Only Validators Can Do This Action");_;
    }

    function addValidator(address newValidator) external onlyValidator{
        _validatorCount.increment();
        validators[newValidator] = true;
    }
    function removeValidator(address removingValidator) external onlyValidator{
        _validatorCount.decrement();
        validators[removingValidator] = false;
    }
    // ===========================================
    // ============ Charity Voting System ========
    Counters.Counter private _charityIds;
    mapping (uint256 => CharitySnapshot) public charities;

    event CharityCreated(address charityAddress, string name, uint256 charityId);
    event CharityApproved(address charityAddress, string name, uint256 charityId);
    // maps a charity to a number of approvedVotes
    mapping (address => uint256) private approveVotes;
    // maps a charity to a nubmer of disapproveVotes
    mapping (address => uint256) private disapproveVotes;
    // tracks if a validator has voted for a specific charity or not
    mapping (address => mapping(address => bool)) private validatorToCharity;
    // ex: validatorToCharity[validatorAddress][charityAddress] = bool
    // cant know what someone voted for, might want to change this going forward
    modifier notVoted(address validator, address charityAddress) {
        require(!validatorToCharity[validator][charityAddress], "Validator has already voted for this charity");
        _;
    }
    // todo
    function getCharites() public returns (CharitySnapshot[] memory){
        // returns all charities
        CharitySnapshot[] memory _charities = new CharitySnapshot[](_charityIds.current());
        for (uint256 i = 0; i < _charityIds.current(); i++) {
            _charities[i] = charities[i];
        }
        return _charities;
    }
    // function getPendingCharities() public returns (CharitySnapshot[] memory){
    //     // returns all pending charities
    //     CharitySnapshot[] memory _charities = new CharitySnapshot[](_charityIds.current());
    //     for (uint256 i = 0; i < _charityIds.current(); i++) {
    //         if (charities[i].status == charityStatus.Pending){
    //             _charities[i] = charities[i];
    //         }
    //     }
    //     return _charities;
    // }
    function getCharityStatus(uint256 charityId) public returns (CharityStatus) {
        // returns the status of a charity
        return charities[charityId].status;
    }
    function inititlizeCharity (address walletAddress, string memory name,string memory charityId, bool ownsWallet) public onlyValidator{
        _charityIds.increment();

        uint256 newItemId = _charityIds.current();
        CharitySnapshot memory charity = CharitySnapshot({
            name:name,
            charityId: newItemId,
            walletAddress: walletAddress,
            ownsWallet: ownsWallet,
            status: CharityStatus.Pending
        });
        charities[newItemId] = charity;
        emit CharityCreated(walletAddress, name, newItemId);
    }

    function voteApprove(address charityAddress) external onlyValidator notVoted(msg.sender, charityAddress){
        validatorToCharity[msg.sender][charityAddress] = true;
        approveVotes[charityAddress]++;
        isCharityApproved(charityAddress);
    }

    function voteDisapprove(address charityAddress) external onlyValidator notVoted(msg.sender, charityAddress){
        validatorToCharity[msg.sender][charityAddress] = true;
        disapproveVotes[charityAddress]++;
        isCharityApproved(charityAddress);
    }

    function isCharityApproved(address charityAddress) external view returns (bool){
        uint256 minimumVotes = _validatorCount * 100 / 66; // require at least 2/3 turnout
        uint256 totalVotes = approveVotes[charityAddress] + disapproveVotes[charityAddress];
        bool result = (totalVotes > minimumVotes && approveVotes[charityAddress] * 100 / totalVotes >= 75);// 75% approval
        if (result){
            charities[charityAddress].status = CharityStatus.Approved;
            emit CharityApproved(charityAddress, charities[charityAddress].name, charities[charityAddress].charityId);
        }
        return result;
    }
    // requirements
    // have a way to check if the charity being voted on is already validated (done)
    // have a way for charities that are pending to be stored (done)
    // generate a temporary wallet address for those that don't have a wallet (done -> needs implementation)
    // be able to replace a temporary wallet with one that they have created - todo much later
    // be able to know how many votes (approve and disapprove) each charity has received - needs implementation
    // have a way to finish the validtion process for valid charities
}