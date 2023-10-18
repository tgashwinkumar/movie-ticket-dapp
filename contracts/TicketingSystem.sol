// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketingSystem {
    address public owner;

    mapping(string => address) public seatToBuyer;
    mapping(address => string[]) public buyerToSeats;
    string[] public allBookedSeats;

    event SeatsBooked(string[] seatNumbers, address buyer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function bookSeats(string[] memory seatNumbers) public {
        for (uint256 i = 0; i < seatNumbers.length; i++) {
            require(seatToBuyer[seatNumbers[i]] == address(0), "Seat already booked");

            seatToBuyer[seatNumbers[i]] = msg.sender;
            buyerToSeats[msg.sender].push(seatNumbers[i]);
            allBookedSeats.push(seatNumbers[i]);
        }

        emit SeatsBooked(seatNumbers, msg.sender);
    }

    function getSeatsByUser(address user) public view returns (string[] memory) {
        return buyerToSeats[user];
    }

    function getUsersBySeat(string memory seatNumber) public view returns (address) {
        return seatToBuyer[seatNumber];
    }

    function getSeatsByBuyer() public view returns (string[] memory) {
        return buyerToSeats[msg.sender];
    }

    function getAllBookedSeats() public view returns (string[] memory) {
        return allBookedSeats;
    }
}
