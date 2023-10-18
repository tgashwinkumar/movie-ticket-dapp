import { ReactElement, createContext, useState } from 'react';
import './index.css';
import { Contract } from 'ethers';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainWrapper from './components/MainWrapper';
import BookTicket from './components/BookTicket';
import GetTicket from './components/GetTicket';

export type ContractContextType = [
  Contract | null,
  React.Dispatch<React.SetStateAction<Contract | null>>
];

export const ContractContext = createContext<ContractContextType | null>(null);

export const App = (): ReactElement => {
  const [contract, setContract] = useState<Contract | null>(null);

  return (
    <ContractContext.Provider value={[contract, setContract]}>
      <BrowserRouter>
        <Routes>
          <Route path="" element={<MainWrapper />}>
            <Route path="book-ticket" element={<BookTicket />} />
            <Route path="get-ticket" element={<GetTicket />} />
            <Route index element={<Navigate to="/book-ticket" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ContractContext.Provider>
  );
};
