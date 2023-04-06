// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./ICharityRegistry.sol";

contract RequestCharities is ReentrancyGuard {
    using Counters for Counters.Counter;
    
    address payable public owner;

    ICharityRegistry public charityRegistry;

    mapping (address => bool) public validators;
    mapping (uint256 => CharitySnapshot) public charities;
    Counters.Counter private _validatorCount;
    Counters.Counter private _charityIds;
    
    constructor() payable {
        owner = payable(msg.sender);
        validators[msg.sender] = true;
        _validatorCount.increment();
    }

    event CharityCreated(address charityAddress, string name, uint256 charityId, string info, CharityStatus status);
    event CharityApproved(uint256 charityId,address charityAddress, string name,CharityStatus status );
    event CharityDisapproved(address charityAddress,uint256 charityId, string name,CharityStatus status );
    event ApproveVote(address validator, uint256 charityId);
    event DisapproveVote(address validator, uint256 charityId);

    enum CharityStatus {
        Pending, Disapproved, Approved
    }

    struct CharitySnapshot {
        string name;
        uint256 charityId;
        address walletAddress;
        string info;
        bool ownsWallet;
        CharityStatus status;
    }

    function getValidatorCount() public view returns (uint256){
        return _validatorCount.current();
    }
    
    modifier onlyValidator() {
        require(validators[msg.sender] || msg.sender == owner, "Only validators can do this action");_;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this action");_;
    }
    
    modifier hasCharityRegistry() {
        require(address(charityRegistry) != address(0), "Charity registry not set");
        _;
    }

    function setCharityRegistry(address _charityRegistry) external onlyOwner {
        charityRegistry = ICharityRegistry(_charityRegistry);
    }

    function changeOwner(address payable newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
    }

    function addValidator(address newValidator) external onlyValidator {
        if (validators[newValidator] == false) {
            _validatorCount.increment();
            validators[newValidator] = true;
        } else {
            revert("Validator already exists");
        }
    }

    function removeValidator(address removingValidator) external onlyValidator {
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
 
    function getCharityStatus(uint256 charityId) public view returns (CharityStatus) {
        // returns the status of a charity
        return charities[charityId].status;
    }
    function initCharity (address walletAddress, string memory name, bool ownsWallet, string memory _info ) public onlyValidator{
        require(walletAddress != address(0), "Invalid wallet address");
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid charity name length");
        

        //check if any charity already has this name
        for (uint256 i = 1; i <= _charityIds.current(); i++) {
            if (keccak256(abi.encodePacked(charities[i].name)) == keccak256(abi.encodePacked(name)) || charities[i].walletAddress == walletAddress){
                revert("Charity with this name already exists");
            }
        }
        _charityIds.increment();

        uint256 newItemId = _charityIds.current();

        CharitySnapshot storage newcharity = charities[newItemId];
        
        newcharity.name=name;
        newcharity.charityId= newItemId;
        newcharity.walletAddress= walletAddress;
        newcharity.info= _info;
        newcharity.ownsWallet= ownsWallet;
        newcharity.status= CharityStatus.Pending;
    
        
        emit CharityCreated(walletAddress, name, newItemId, _info, CharityStatus.Pending);
        //emit Charity(walletAddress, name, newItemId, _info, CharityStatus.Pending);
    }

    function vote(uint256 charityId, bool votedApprove) public nonReentrant onlyValidator notVoted(msg.sender, charityId){
        require(charities[charityId].status == CharityStatus.Pending, "Charity is not pending, Cannot vote on it");
        validatorToCharity[msg.sender][charityId] = votedApprove;
        if (votedApprove){
            approveVotes[charityId]++;
            emit ApproveVote(msg.sender, charityId);
        }
        else{
            disapproveVotes[charityId]++;
            emit DisapproveVote(msg.sender, charityId);
        }
        
    }
    function getVotes(uint256 charityId) public view returns (uint256, uint256){
        return (approveVotes[charityId], disapproveVotes[charityId]);
    }
    function resolveCharity(uint256 charityId) public hasCharityRegistry onlyValidator{
        uint256 totalValidators = _validatorCount.current();
        uint256 votesCount = approveVotes[charityId] + disapproveVotes[charityId];
        uint256 approvalsCount = approveVotes[charityId];
        require(charities[charityId].status == CharityStatus.Pending, "Charity is not pending, Cannot approve it");  
        require((votesCount * 100 / totalValidators) > 70, "Less than 70% of validators have voted");
    
        if((approvalsCount * 100 / votesCount) > 75){
            charities[charityId].status = CharityStatus.Approved;

            string memory name = charities[charityId].name;
            address wallet = charities[charityId].walletAddress;
            charityRegistry.addCharity(charityId,name, wallet, charities[charityId].info );

            emit CharityApproved(charityId, charities[charityId].walletAddress, charities[charityId].name,  CharityStatus.Approved);
            //emit Charity(charities[charityId].walletAddress, charities[charityId].name,charityId, charities[charityId].info, CharityStatus.Approved);
        }
        else{
            charities[charityId].status = CharityStatus.Disapproved;
            emit CharityDisapproved( charities[charityId].walletAddress,charityId, charities[charityId].name, CharityStatus.Disapproved);
            //emit Charity(charities[charityId].walletAddress, charities[charityId].name,charityId, charities[charityId].info, CharityStatus.Disapproved);
        }
        
    }

    function addTokenToWhitelist(address token) public hasCharityRegistry onlyValidator{
        charityRegistry.addTokenToWhitelist(token);
    }

 
}