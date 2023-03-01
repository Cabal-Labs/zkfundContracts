// SPDX-License-Identifier: GPL-3.0
pragma solidity >0.7.0 <=0.8.18;
import "./Counters.sol"; 
import "./Charities.sol"; 

contract ValidateCharities {
    using Counters for Counters.Counter;
    address public owner;

    address public charityRegistry;

    mapping (address => bool) public validators;
    mapping (uint256 => CharitySnapshot) public charities;
    Counters.Counter private _validatorCount;
    Counters.Counter private _charityIds;
    constructor() payable {
        owner = msg.sender;
        validators[msg.sender] = true;
        _validatorCount.increment();
    }
    event CharityCreated(address charityAddress, string name, uint256 charityId);
    event CharityApproved(address charityAddress, string name, uint256 charityId);
    event ApproveVote(address validator, uint256 charityId);
    event DisapproveVote(address validator, uint256 charityId);
    enum CharityStatus {
        Pending, Disapproved, Approved
    }
    struct CharitySnapshot {
        string name;
        uint256 charityId; // from mongodb _id
        address walletAddress; // might not have one, if not it will be address(0)
        bool ownsWallet; // if true, then the wallet address is theirs
        CharityStatus status;
    }

    // ========== Validator System ================
    // have a way to require that only validators can do certain things
    function getValidatorCount() public view returns (uint256){
        return _validatorCount.current();
    }
    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == owner, "Only validators can do this action");_;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this action");_;
    }
    modifier votingProcess(uint256 charity) {
        uint256 totalValidators = _validatorCount.current();
        uint256 votesCount = approveVotes[charity] + disapproveVotes[charity];
        uint256 approvalsCount = approveVotes[charity];


        // Check that more than 70% of validators have voted on the charity
        require((votesCount * 100 / totalValidators) > 70, "Less than 70% of validators have voted");

        // Check that more than 75% of validators have approved the charity
        require((approvalsCount * 100 / votesCount) > 75, "Less than 75% of validators approved");

        _; // Continue executing the function
    }

    function addValidator(address newValidator) external onlyValidator{
        if (validators[newValidator] == false){

            _validatorCount.increment();
            validators[newValidator] = true;
        }
        else{
            revert("Validator already exists");
        }
    }
    function removeValidator(address removingValidator) external onlyValidator{
        _validatorCount.decrement();
        validators[removingValidator] = false;
    }
    // ===========================================
    // ============ Charity Voting System ========
    // maps a charity to a number of approvedVotes
    mapping (uint256 => uint256) private approveVotes;
    // maps a charity to a nubmer of disapproveVotes
    mapping (uint256 => uint256) private disapproveVotes;
    // tracks if a validator has voted for a specific charity or not
    mapping (address => mapping(uint256 => bool)) public validatorToCharity;
    // ex: validatorToCharity[validatorAddress][charityId] = bool

    modifier notVoted(address validator, uint256 charityId) {
        require(!validatorToCharity[validator][charityId], "Validator has already voted for this charity");
        _;
    }
    function getCharities() public view returns (CharitySnapshot[] memory){
        // returns all charities
        CharitySnapshot[] memory _charities = new CharitySnapshot[](_charityIds.current());
        for (uint256 i = 0; i < _charityIds.current(); i++) {
            _charities[i] = charities[i];
        }
        return _charities;
    }
    function getCharityStatus(uint256 charityId) public view returns (CharityStatus) {
        // returns the status of a charity
        return charities[charityId].status;
    }
    function initCharity (address walletAddress, string memory name, bool ownsWallet) public onlyValidator{
        //check if any charity already has this name
        for (uint256 i = 0; i < _charityIds.current(); i++) {
            if (keccak256(abi.encodePacked(charities[i].name)) == keccak256(abi.encodePacked(name))){
                revert("Charity with this name already exists");
            }
        }
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
    function voteApprove(uint256 charityId) public onlyValidator notVoted(msg.sender, charityId){
        validatorToCharity[msg.sender][charityId] = true;
        approveVotes[charityId]++;
        emit ApproveVote(msg.sender, charityId);
        approveCharity(charityId);
    }

    function voteDisapprove(uint256 charityId) external onlyValidator notVoted(msg.sender, charityId){
        validatorToCharity[msg.sender][charityId] = true;
        disapproveVotes[charityId]++;
        emit DisapproveVote(msg.sender, charityId);
        approveCharity(charityId);
    }
    // TODO: Fix voting logic, it is currently not working
    function approveCharity(uint256 charityId) internal votingProcess(charityId){
      
        
        charities[charityId].status = CharityStatus.Approved;
        CharityRegistry charityRegistryContract = CharityRegistry(charityRegistry);

        string memory name = charities[charityId].name;
        address wallet = charities[charityId].walletAddress;

        charityRegistryContract.addCharity(name, wallet);

        emit CharityApproved(charities[charityId].walletAddress, charities[charityId].name, charityId);
    

    }
    // requirements
    // have a way to check if the charity being voted on is already validated (done)
    // have a way for charities that are pending to be stored (done)
    // generate a temporary wallet address for those that don't have a wallet (done -> needs implementation)
    // be able to replace a temporary wallet with one that they have created - todo much later
    // be able to know how many votes (approve and disapprove) each charity has received - needs implementation
    // have a way to finish the validtion process for valid charities

    function setCharityRegistry(address _charityRegistry) external onlyOwner{
        charityRegistry = _charityRegistry;
    }
}