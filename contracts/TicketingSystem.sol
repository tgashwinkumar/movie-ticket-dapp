// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketingSystem {
    address public owner;

    mapping(uint256 => address) public seatToBuyer;
    mapping(address => uint256[]) public buyerToSeats;
    uint256[] public allBookedSeats;

    event SeatsBooked(uint256[] seatNumbers, address buyer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function bookSeats(uint256[] memory seatNumbers) public {
        for (uint256 i = 0; i < seatNumbers.length; i++) {
            require(seatToBuyer[seatNumbers[i]] == address(0), "Seat already booked");

            seatToBuyer[seatNumbers[i]] = msg.sender;
            buyerToSeats[msg.sender].push(seatNumbers[i]);
            allBookedSeats.push(seatNumbers[i]);
        }

        emit SeatsBooked(seatNumbers, msg.sender);
    }

    function getSeatsByUser(address user) public view returns (uint256[] memory) {
        return buyerToSeats[user];
    }

    function getUsersBySeat(uint256 seatNumber) public view returns (address) {
        return seatToBuyer[seatNumber];
    }

    function getAllBookedSeats() public view returns (uint256[] memory) {
        return allBookedSeats;
    }
}
