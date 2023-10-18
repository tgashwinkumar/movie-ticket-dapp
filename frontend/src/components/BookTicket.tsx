import { Contract } from 'ethers';
import React, {
  MouseEvent,
  ReactElement,
  useContext,
  useEffect,
  useState
} from 'react';
import { ContractContext, ContractContextType } from '../App';
import { Provider } from '../utils/provider';
import { useWeb3React } from '@web3-react/core';

type SeatState = {
  id: string;
  selected: boolean;
  bought: boolean;
};

const BookTicket = (): ReactElement => {
  const context = useWeb3React<Provider>();
  const { library, account, active } = context;

  const getInitialSeats = (): SeatState[] => {
    let initialSeats: SeatState[] = [];
    for (let i = 65; i <= 74; i++) {
      for (let j = 1; j <= 20; j++) {
        initialSeats.push({
          id: `${String.fromCharCode(i)}${j}`,
          selected: false,
          bought: false
        });
      }
    }

    return initialSeats;
  };

  const [seats, setSeats] = useState<SeatState[]>(getInitialSeats());

  const selectSeat = (id: string) => {
    const seatIndex = seats.findIndex((seat) => seat.id === id);
    const newSeats = [...seats];
    newSeats[seatIndex].selected = !newSeats[seatIndex].selected;
    setSeats(newSeats);
  };

  const [ticketSystemContract, setTicketSystemContract] = useContext(
    ContractContext
  ) as ContractContextType;

  function handleBookTickets(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    if (!ticketSystemContract) {
      window.alert('Undefined Registrar Contract');
      return;
    }

    let have_selected_any = false;

    for (let i = 0; i < seats.length; i++) {
      if (seats[i].selected) {
        have_selected_any = true;
        break;
      }
    }

    if (!have_selected_any) {
      window.alert('Please select at least one seat');
      return;
    }

    let selected_seats = seats
      .filter((seat) => seat.selected)
      .map((seat) => seat.id);

    async function bookTickets(contract: Contract): Promise<void> {
      try {
        const setRegTxn = await contract.bookSeats(selected_seats);

        await setRegTxn.wait();

        window.alert(
          `Success! ${selected_seats.length} seats are booked!}. Transaction hash: ${setRegTxn.hash}`
        );
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    bookTickets(ticketSystemContract);
  }

  useEffect((): void => {
    if (!ticketSystemContract) return;

    async function getSeats(contract: Contract): Promise<void> {
      try {
        const bookedSeats = await contract.getAllBookedSeats();
        const newSeats = [...seats];

        for (let i = 0; i < newSeats.length; i++) {
          newSeats[i].selected = false;
        }

        for (let i = 0; i < bookedSeats.length; i++) {
          const bookedId = bookedSeats[i];
          const seatIndex = newSeats.findIndex((seat) => seat.id === bookedId);
          newSeats[seatIndex].bought = true;
          newSeats[seatIndex].selected = false;
        }

        setSeats(newSeats);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    getSeats(ticketSystemContract);
  }, [library, account, ticketSystemContract]);

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="text-sm text-gray-500">Screen here</div>
      <div className="border border-gray-700 bg-gray-300 h-2 mt-2 w-1/2"></div>
      <div
        className="bg-gradient-to-b from-sky-200 to-transparent h-12 w-full mt-2"
        style={{ clipPath: 'polygon(25% 0%, 75% 0, 100% 100%, 0% 100%)' }}
      ></div>
      <section
        className="gap-4 mt-8"
        style={{
          display: 'grid',
          gridTemplateColumns:
            '3fr ' +
            '1fr '.repeat(3) +
            '3fr ' +
            '1fr '.repeat(9) +
            '3fr ' +
            '1fr '.repeat(4) +
            '3fr',
          gridTemplateRows: '20'
        }}
      >
        {seats.map((seat, idx) => (
          <div
            className={`w-full flex ${
              idx % 20 === 0 ? 'justify-end' : 'justify-start'
            } items-center`}
          >
            {idx % 20 === 0 && (
              <p className="mr-6 text-sm text-center text-gray-400">
                {seat?.id.slice(0, 1)}
              </p>
            )}
            <button
              onClick={() => !seat?.bought && selectSeat(seat?.id)}
              className={`rounded-md flex justify-center items-center h-6 w-6 border ${
                seat?.bought
                  ? 'bg-gray-400 text-gray-200 border-gray-400 cursor-not-allowed'
                  : seat?.selected
                  ? 'bg-blue-500 text-white border-sky-300'
                  : 'bg-gray-200 text-gray-400 border-gray-400'
              } text-xs`}
            >
              {seat?.id.slice(1)}
            </button>
            {idx % 20 === 19 && (
              <p className="ml-6 text-sm text-center text-gray-400">
                {seat?.id.slice(0, 1)}
              </p>
            )}
          </div>
        ))}
      </section>
      <section className="flex w-full mt-8">
        <div className="w-1/2 text-xl">
          <p className="text-xl font-bold mb-4 uppercase tracking-widest">
            Selected Seats
          </p>
          {seats
            .filter((seat) => seat.selected)
            .map((seat) => (
              <span>{seat.id}, </span>
            ))}
        </div>
        <div className="w-1/2 space-y-4">
          <button
            onClick={handleBookTickets}
            className="hover:shadow-2xl w-full text-2xl py-2 rounded-full bg-sky-300 border-4 text-sky-700 font-bold border-sky-700"
          >
            Book your tickets
          </button>
          <button className="hover:shadow-2xl w-full text-2xl py-2 rounded-full bg-gray-300 border-4 text-gray-700 font-bold border-gray-700">
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
};

export default BookTicket;
