// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Counters.sol";

contract CharityRegistry {

    using Counters for Counters.Counter;
    Counters.Counter public _CharityIds;

    struct Charity {
        uint256 id;
        string name;
        address wallet;
        uint256 donationPool;
        uint256 lastReleaseTimestamp;
        bool isRemoved;
        bool isDonationLimitEnabled;
        uint256 donationLimit;
        bool isEmergencyStopEnabled;
        bool isDonationReleasePaused;
    }

    mapping(uint256 => Charity) public charities;

    event CharityAdded(uint256 id, string name, address wallet);
    event CharityUpdated(uint256 id, string name, address wallet);
    event DonationMade(uint256 charityId, address donor, uint256 amount);
    event DonationReleased(uint256 charityId, address wallet, uint256 amount);
    event CharityRemoved(uint256 id);
    event DonationLimited(uint256 id, uint256 limit);
    event DonationUnlimited(uint256 id);
    event EmergencyStopEnabled(uint256 id);
    event EmergencyStopDisabled(uint256 id);
    event DonationReleasePaused(uint256 id);
    event DonationReleaseUnpaused(uint256 id);

    address public votingContract;

    constructor(address _votingContract) {
        votingContract = _votingContract;
    }

    modifier onlyVotingContract() {
        require(msg.sender == votingContract, "Only voting contract can call this function");
        _;
    }

    function addCharity(string memory _name, address _wallet) public onlyVotingContract {
        _CharityIds.increment();
        uint256 id = _CharityIds.current();
        charities[id] = Charity(id, _name, _wallet, 0, 0, false, false, 0, false, false);
        emit CharityAdded(id, _name, _wallet);
    }

    function updateCharity(uint256 _charityId, string memory _name, address _wallet) public {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.name = _name;
        charity.wallet = _wallet;
        emit CharityUpdated(_charityId, _name, _wallet);
    }

    function removeCharity(uint256 _charityId) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isRemoved = true;
        emit CharityRemoved(_charityId);
    }

    function limitDonation(uint256 _charityId, uint256 _donationLimit) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isDonationLimitEnabled = true;
        charity.donationLimit = _donationLimit;
        emit DonationLimited(_charityId, _donationLimit);
    }

    function unlimitedDonation(uint256 _charityId) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isDonationLimitEnabled = false;
        charity.donationLimit = 0;
        emit DonationUnlimited(_charityId);
    }

    function enableEmergencyStop(uint256 _charityId) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isEmergencyStopEnabled = true;
        emit EmergencyStopEnabled(_charityId);
    }

    function disableEmergencyStop(uint256 _charityId) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isEmergencyStopEnabled = false;
        emit EmergencyStopDisabled(_charityId);
    }

    function pauseDonationRelease(uint256 _charityId) public onlyVotingContract {
    Charity storage charity = charities[_charityId];
    require(charity.id != 0, "Charity does not exist");
    charity.isDonationReleasePaused = true;
    emit DonationReleasePaused(_charityId);
    }

    function resumeDonationRelease(uint256 _charityId) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        charity.isDonationReleasePaused = false;
        emit DonationReleaseUnpaused(_charityId);
    }

    function makeDonation(uint256 _charityId) public payable {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        require(!charity.isRemoved, "Charity has been removed");
        require(!charity.isEmergencyStopEnabled, "Charity has been paused due to emergency");
        require(!charity.isDonationReleasePaused, "Donation release has been paused by the charity");
        if (charity.isDonationLimitEnabled) {
            require(charity.donationPool + msg.value <= charity.donationLimit, "Donation limit exceeded");
        }
        charity.donationPool += msg.value;
        emit DonationMade(_charityId, msg.sender, msg.value);
    }

    function releaseDonation(uint256 _charityId, uint256 _amount) public onlyVotingContract {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        require(charity.wallet != address(0), "Charity wallet not set");
        require(_amount <= charity.donationPool, "Amount requested exceeds donation pool");
        payable(charity.wallet).transfer(_amount);
        charity.donationPool -= _amount;
        charity.lastReleaseTimestamp = block.timestamp; //todo: investigate timestamp warning
        emit DonationReleased(_charityId, charity.wallet, _amount);
    }

    function getCharity(uint256 _charityId) public view returns (Charity memory) {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        return (charity);
    }

}