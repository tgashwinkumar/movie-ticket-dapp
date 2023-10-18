import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { ContractContext, ContractContextType } from '../App';
import { Contract } from 'ethers';

const GetTicket = (): ReactElement => {
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [ticketSystemContract, setTicketSystemContract] = useContext(
    ContractContext
  ) as ContractContextType;

  useEffect((): void => {
    if (!ticketSystemContract) return;

    async function getSeats(contract: Contract): Promise<void> {
      try {
        const bookedSeats = await contract.getSeatsByBuyer();
        setBookedSeats(bookedSeats);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    getSeats(ticketSystemContract);
  }, [ticketSystemContract]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-1/2 bg-white border-dashed border-2 border-gray-700 py-8 text-center flex flex-col items-center justify-center">
        <img
          src="https://filmfare.wwmindia.com/content/2023/sep/leovijay11695026272.jpg"
          alt=""
          className="h-52 mb-4 border"
        />
        <p className="text-3xl font-bold">LEO</p>
        <p className="text-lg">Tamil</p>
        <p className="text-lg">19 Oct 2023 - 4.30 am</p>
        <div className="h-1 border-dashed border-b-2 border-gray-700 w-full my-8"></div>
        <p className="text-xl tracking-widest uppercase px-8">Seats</p>
        <div className="text-2xl flex justify-center items-center px-8">
          {bookedSeats.map((seat) => (
            <p className="p-2 text-center w-16 font-bold">{seat}</p>
          ))}
        </div>
        <div className="h-1 border-dashed border-b-2 border-gray-700 w-full my-8"></div>
        <p className="text-2xl font-bold">Enjoy your show!!!</p>
        <p className="text-base mt-2">Lokesh Kanagaraj</p>
      </div>
    </div>
  );
};

export default GetTicket;
