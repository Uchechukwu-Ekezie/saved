// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SavingsCircleV2} from "./SavingsCircleV2";

/// @title SavingsCircleV2Factory
/// @notice Factory for deploying SavingsCircleV2 instances
contract SavingsCircleV2Factory is Ownable {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error InvalidParams();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event CircleCreated(
        address indexed circle,
        address indexed creator,
        address indexed token,
        uint256 contribution,
        uint256 maxMembers,
        uint256 cycleDuration
    );

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    address[] public allCircles;
    mapping(address => address[]) public circlesByCreator;

    /// Optional: restrict creation to owner / DAO
    bool public permissionless = true;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address _owner) Ownable(_owner) {}

    /*//////////////////////////////////////////////////////////////
                        CONFIGURATION
    //////////////////////////////////////////////////////////////*/
    function setPermissionless(bool enabled) external onlyOwner {
        permissionless = enabled;
    }

    /*//////////////////////////////////////////////////////////////
                        CIRCLE CREATION
    //////////////////////////////////////////////////////////////*/
    function createCircle(
        address token,
        uint256 contribution,
        uint256 maxMembers,
        uint256 cycleDuration
    ) external returns (address circle) {
        if (!permissionless && msg.sender != owner()) {
            revert Unauthorized();
        }

        if (
            token == address(0) ||
            contribution == 0 ||
            maxMembers == 0 ||
            cycleDuration == 0
        ) {
            revert InvalidParams();
        }

        circle = address(
            new SavingsCircleV2(
                token,
                contribution,
                maxMembers,
                cycleDuration,
                msg.sender
            )
        );

        allCircles.push(circle);
        circlesByCreator[msg.sender].push(circle);

        emit CircleCreated(
            circle,
            msg.sender,
            token,
            contribution,
            maxMembers,
            cycleDuration
        );
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW HELPERS
    //////////////////////////////////////////////////////////////*/
    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }

    function getCirclesByCreator(
        address creator
    ) external view returns (address[] memory) {
        return circlesByCreator[creator];
    }

    function totalCircles() external view returns (uint256) {
        return allCircles.length;
    }
}
