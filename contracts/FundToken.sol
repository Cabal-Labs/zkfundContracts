// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FundToken is ERC20, Ownable{
    uint8 private _decimals;

    address public charityRegistry;

   event MintError(address indexed user, string message);


    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    modifier onlyMinter() {
        require(msg.sender == charityRegistry || msg.sender == owner() , "Only minter can mint");
        _;
    }

    function mint(address _to) external onlyMinter returns (bool) {
       require(_to != address(0), "ERC20: mint to the zero address");  
       

        _mint(_to, 1);

        return true;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function setRegistry(address _charityRegistry) public onlyOwner {
        charityRegistry = _charityRegistry;
    }
}

