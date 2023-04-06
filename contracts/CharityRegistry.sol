// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IFundToken.sol";






contract CharityRegistry is ReentrancyGuard, Ownable {

    using SafeMath for uint256;

    address public fundToken;
  

  
   
    uint256[] public charitiesIds;

    struct Charity {
        uint256 id;
        mapping(address => uint256) donationPools;
        mapping(address => bool) userHasDonated;
        string name;
        string info;
        address wallet;
        bool isRemoved;
        bool isEmergencyStopEnabled;
        bool isDonationReleasePaused;
    }

    struct TokenDonationPool {
        address token;
        uint256 amount;
    }

    mapping(address => bool) private whitelistedTokensM;

    mapping(uint256 => Charity) public charities;

    event CharityAdded(uint256 indexed id, string name, address indexed wallet, string indexed info);
    event CharityUpdated(uint256 indexed id, string name, address indexed wallet);
    event DonationMade(uint256 charityId, address donor, uint256 amount);
    event DonationsReleased(uint256 charityId, address wallet, uint256 amount);
    event ETHDonationMade(uint256 charityId, address donor, uint256 amount);
    event CharityRemoved(uint256 id);
    event EmergencyStopEnabled(uint256 id);
    event EmergencyStopDisabled(uint256 id);


    address public votingContract;

    address[] public whitelistedTokens;

    uint256 public defaultCharityId;

    constructor(address _votingContract, address _erc20, string memory _defaultInfo) Ownable(){
        votingContract = _votingContract;
         fundToken = _erc20;
        defaultCharityId = 0;
        Charity storage defaultCharity = charities[defaultCharityId];
        defaultCharity.id = defaultCharityId;
        defaultCharity.name = "ZK Fund";
        defaultCharity.info = _defaultInfo;
        defaultCharity.wallet = payable(msg.sender);
        defaultCharity.isRemoved = false;
        defaultCharity.isEmergencyStopEnabled = false;
        defaultCharity.isDonationReleasePaused = false;
        charitiesIds.push(defaultCharityId);

    
    }



   
    modifier onlyVotingContract() {
        require(msg.sender == votingContract, "Only voting contract can call this function");
        _;
    }

  

    function validateCharity(uint256 _charityId) private view returns (Charity storage) {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");
        require(!charity.isRemoved, "Charity has been removed");
        return charity;
    }


    function addCharity(uint256 _id, string memory _name, address _wallet, string memory _info) external onlyVotingContract {
        require(charities[_id].id == 0, "Charity already exists");

        Charity storage newCharity = charities[_id];
        newCharity.id = _id;
        newCharity.name = _name;
        newCharity.info = _info;
        newCharity.wallet = _wallet;
        newCharity.isRemoved = false;
        newCharity.isEmergencyStopEnabled = false;
        newCharity.isDonationReleasePaused = false;
        charitiesIds.push(_id);
        
        emit CharityAdded(_id, _name, _wallet, _info);
    }

    function updateCharity(uint256 _charityId, string memory _name, address _wallet) external onlyVotingContract {
        Charity storage charity = validateCharity(_charityId);
        charity.name = _name;
        charity.wallet = _wallet;
        emit CharityUpdated(_charityId, _name, _wallet);
    }

    function removeCharity(uint256 _charityId) external onlyVotingContract {
        Charity storage charity = validateCharity(_charityId);
        charity.isRemoved = true;
        emit CharityRemoved(_charityId);
    }

    function enableEmergencyStop(uint256 _charityId) external onlyVotingContract {
        Charity storage charity = validateCharity(_charityId);
        charity.isEmergencyStopEnabled = true;
        emit EmergencyStopEnabled(_charityId);
    }

    function disableEmergencyStop(uint256 _charityId) external onlyVotingContract {
        Charity storage charity = validateCharity(_charityId);
        charity.isEmergencyStopEnabled = false;
        emit EmergencyStopDisabled(_charityId);
    }


    function isTokenWhitelisted(address _token) public view returns (bool) {
        return whitelistedTokensM[_token];
    }

    function addTokenToWhitelist(address _token) external onlyVotingContract {
        require(!isTokenWhitelisted(_token), "Token is already whitelisted");
        whitelistedTokensM[_token] = true;
        whitelistedTokens.push(_token);
    }

    function removeWhitelistedToken(address _token) external onlyVotingContract {
        require(isTokenWhitelisted(_token), "Token is not whitelisted");
        require(_token == address(0), "Cannot ETH from the whitelist");

        uint256 tokenIndex = whitelistedTokens.length; // Set to an invalid index initially
        for (uint256 i = 0; i < whitelistedTokens.length; i++) {
            if (whitelistedTokens[i] == _token) {
                tokenIndex = i;
                break;
            }
        }

        require(tokenIndex != whitelistedTokens.length, "Token not found in the whitelist");

        whitelistedTokens[tokenIndex] = whitelistedTokens[whitelistedTokens.length - 1];


        whitelistedTokens.pop();
        whitelistedTokensM[_token] = false;
    }

    function makeDonation(uint256 _charityId, address _token, uint256 _amount) external payable {
        Charity storage charity = validateCharity(_charityId);
        require(!charity.isEmergencyStopEnabled, "Charity has been paused due to emergency");

        if (_token == address(0)) { // Ether donation
            uint256 etherAmount = msg.value;
            charity.donationPools[_token] = charity.donationPools[_token].add(etherAmount);
            _amount = etherAmount;
        } else { // ERC20 token donation
            require(isTokenWhitelisted(_token), "Token is not whitelisted");
            IERC20 token = IERC20(_token);
            require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
            charity.donationPools[_token] = charity.donationPools[_token].add(_amount);
        }

        
        IFundToken _fundToken = IFundToken(fundToken);
        _fundToken.mint(msg.sender);
    

        emit DonationMade(_charityId, msg.sender, _amount);
    }

  
    receive() external payable {
        // Forward the received Ether to the donateETH function for the default charity.
        donateETHToDefaultCharity();
    }   

    function donateETHToDefaultCharity() internal {
        Charity storage charity = validateCharity(defaultCharityId);
        require(!charity.isEmergencyStopEnabled, "Charity has been paused due to emergency");

        // Update the donation pool for Ether.
        charity.donationPools[address(0)] = charity.donationPools[address(0)].add(msg.value);

        
        IFundToken _fundToken = IFundToken(fundToken);
        _fundToken.mint(msg.sender);
    

        emit ETHDonationMade(defaultCharityId, msg.sender, msg.value);
    }

    function withdrawDonations(uint256 _charityId) external nonReentrant {
        Charity storage charity = validateCharity(_charityId);
        require(charity.wallet == msg.sender, "Only charity wallet can withdraw");

        for (uint256 i = 0; i < whitelistedTokens.length; i++) {
            address tokenAddress = whitelistedTokens[i];
            uint256 tokenBalance = charity.donationPools[tokenAddress];

            if (tokenBalance > 0) {
                if (tokenAddress == address(0)) {
                    // Withdraw Ether
                    payable(charity.wallet).transfer(tokenBalance);
                    emit DonationsReleased(_charityId, charity.wallet, tokenBalance);
                } else {
                    // Withdraw ERC20 tokens
                    IERC20 token = IERC20(tokenAddress);
                    require(token.transfer(charity.wallet, tokenBalance), "Token transfer failed");
                    emit DonationsReleased(_charityId, charity.wallet, tokenBalance);
                }
                charity.donationPools[tokenAddress] = 0;
            }
        }
    }

    function getCharity(uint256 _charityId) external view returns (
        uint256 id,
        string memory name,
        string memory info,
        address wallet,
        bool isRemoved,
        bool isEmergencyStopEnabled,
        bool isDonationReleasePaused
    ) {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");

        return (
            charity.id,
            charity.name,
            charity.info,
            charity.wallet,
            charity.isRemoved,
            charity.isEmergencyStopEnabled,
            charity.isDonationReleasePaused
        );
    }

    function getDonationPools(uint256 _charityId) external view returns (TokenDonationPool[] memory) {
        Charity storage charity = charities[_charityId];
        require(charity.id != 0, "Charity does not exist");

        TokenDonationPool[] memory donationPools = new TokenDonationPool[](whitelistedTokens.length);

        for (uint256 i = 0; i < whitelistedTokens.length; i++) {
            donationPools[i] = TokenDonationPool({
                token: whitelistedTokens[i],
                amount: charity.donationPools[whitelistedTokens[i]]
            });
        }

        return donationPools;
    }


}