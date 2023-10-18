import React, {
  MouseEvent,
  ReactElement,
  useContext,
  useEffect,
  useState
} from 'react';
import Logo from '../logo.png';
import '../index.css';
import { Provider } from '../utils/provider';
import { Signer, ethers } from 'ethers';
import { ContractContext, ContractContextType } from '../App';
import TicketSystemArtifact from '../artifacts/contracts/TicketingSystem.sol/TicketingSystem.json';
import { useEagerConnect, useInactiveListener } from '../utils/hooks';
import { injected } from '../utils/connectors';
import { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError
} from '@web3-react/injected-connector';
import { Link, Outlet, useLocation } from 'react-router-dom';

type CleanupFunction = (() => void) | undefined;

type ActivateFunction = (
  connector: AbstractConnector,
  onError?: (error: Error) => void,
  throwErrors?: boolean
) => Promise<void>;

function getErrorMessage(error: Error): string {
  let errorMessage: string;

  switch (error.constructor) {
    case NoEthereumProviderError:
      errorMessage = `No Ethereum browser extension detected. Please install MetaMask extension.`;
      break;
    case UnsupportedChainIdError:
      errorMessage = `You're connected to an unsupported network.`;
      break;
    case UserRejectedRequestError:
      errorMessage = `Please authorize this website to access your Ethereum account.`;
      break;
    default:
      errorMessage = error.message;
  }

  return errorMessage;
}

const MainWrapper = (): ReactElement => {
  const location = useLocation();

  return (
    <div className="bg-gray-100 h-screen w-screen overflow-hidden flex ">
      <section className="w-1/3 space-y-6 flex flex-col p-4 px-8">
        <div className="flex space-x-4 items-center">
          <img src={Logo} alt="" className="h-32 w-auto" />
          <div className="space-y-1">
            <h1 className="text-3xl text-sky-900 font-black">dAppTickets</h1>
            <div className="text-xl text-sky-700">
              Decentralized Movie Ticketing System
            </div>
          </div>
        </div>
        <ActivatorSection />
        <SignerDeployerSection />
        <div className="flex-1"></div>
        {location.pathname === '/book-ticket' ? (
          <Link to="/get-ticket" className="hover:shadow-2xl w-full border-4 border-sky-800 bg-sky-100 py-2 text-xl text-center text-sky-800 font-bold rounded-full">
            View your tickets
          </Link>
        ) : (
          <Link to="/book-ticket" className="hover:shadow-2xl w-full border-4 border-sky-800 bg-sky-100 py-2 text-xl text-center text-sky-800 font-bold rounded-full">
            Book new tickets
          </Link>
        )}
      </section>
      <section className="w-2/3 px-8 p-4">
        <Outlet />
      </section>
    </div>
  );
};

const ActivatorSection = (): ReactElement => {
  const context = useWeb3React<Provider>();
  const { library, chainId, account, error, deactivate, activate, active } =
    context;

  const [balance, setBalance] = useState<ethers.BigNumber>();

  useEffect((): CleanupFunction => {
    if (typeof account === 'undefined' || account === null || !library) {
      return;
    }

    let stale = false;

    async function getBalance(
      library: Provider,
      account: string
    ): Promise<void> {
      const balance: ethers.BigNumber = await library.getBalance(account);

      try {
        if (!stale) {
          setBalance(balance);
        }
      } catch (error: any) {
        if (!stale) {
          setBalance(undefined);

          window.alert(
            'Error!' + (error && error.message ? `\n\n${error.message}` : '')
          );
        }
      }
    }

    getBalance(library, account);

    // create a named balancer handler function to fetch the balance each block. in the
    // cleanup function use the fucntion name to remove the listener
    const getBalanceHandler = (): void => {
      getBalance(library, account);
    };

    library.on('block', getBalanceHandler);

    // cleanup function
    return (): void => {
      stale = true;
      library.removeListener('block', getBalanceHandler);
      setBalance(undefined);
    };
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  const handleConnect = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    async function _activate(activate: ActivateFunction): Promise<void> {
      await activate(injected);
    }

    _activate(activate);
  };

  const handleDisconnect = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    deactivate();
  };

  const eagerConnectionSuccessful = useEagerConnect();
  useInactiveListener(!eagerConnectionSuccessful);

  if (!!error) {
    window.alert(getErrorMessage(error));
  }

  return (
    <div className="w-full">
      {active ? (
        <div className="w-full space-y-6 flex flex-col items-center">
          <div className="flex w-full space-x-4 items-center text-sky-600">
            <div className="flex-1 text-center">
              <p className="tracking-widest uppercase">ChainID</p>
              <p className="text-2xl font-bold">{chainId}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="tracking-widest uppercase">Address</p>
              <p className="text-2xl font-bold">
                {account?.slice(0, 5)}...{account?.slice(-5)}
              </p>
            </div>
            <div className="flex-1 text-center">
              <p className="tracking-widest uppercase">Balance</p>
              <p className="text-2xl font-bold">
                {balance === null
                  ? 'Error'
                  : balance
                  ? Math.round(+ethers.utils.formatEther(balance) * 1e4) / 1e4
                  : ''}
                <span className="text-lg">ETH</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-12 py-2 rounded-full border-sky-700 border-4  hover:shadow-xl text-sky-700 text-xl font-bold"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="w-full justify-center items-center flex">
          <button
            onClick={handleConnect}
            className="px-12 py-2 rounded-full border-sky-700 border-4  hover:shadow-xl text-sky-700 text-xl font-bold"
          >
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

const SignerDeployerSection = (): ReactElement => {
  const context = useWeb3React<Provider>();
  const { library, account, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [ticketSystemContract, setTicketSystemContract] = useContext(
    ContractContext
  ) as ContractContextType;
  const [ticketSystemContractAddr, setTicketSystemContractAddr] =
    useState<string>();

  function handleSignMessage(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    if (!library || !account) {
      window.alert('Wallet not connected');
      return;
    }

    async function signMessage(
      library: Provider,
      account: string
    ): Promise<void> {
      try {
        const signature = await library
          .getSigner(account)
          .signMessage(
            'Thanks for authorizing dAppTickets: A decentralized Movie Ticketing System'
          );
        window.alert(`Success!\n\n${signature}`);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    signMessage(library, account);
  }

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the Greeter contract one time, when a signer is defined
    if (ticketSystemContract || !signer) {
      return;
    }

    async function deployRegistrarContract(signer: Signer): Promise<void> {
      const TicketSystemizer = new ethers.ContractFactory(
        TicketSystemArtifact.abi,
        TicketSystemArtifact.bytecode,
        signer
      );

      try {
        const _ticketSystemContract = await TicketSystemizer.deploy();

        await _ticketSystemContract.deployed();

        window.alert(
          `TicketSystemContract deployed to: ${_ticketSystemContract.address}`
        );

        setTicketSystemContract(_ticketSystemContract);
        setTicketSystemContractAddr(_ticketSystemContract.address);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployRegistrarContract(signer);
  }

  return (
    <div className="w-full pt-16 flex space-x-8 text-center text-sky-800">
      <div className="flex flex-1 flex-col space-y-2 items-center">
        <p className="text-xl  font-semibold">
          {!active
            ? 'You are disconnected'
            : library?.getSigner()
            ? 'Authorized ✅'
            : 'Authorize this App!'}
        </p>
        <button
          disabled={!active}
          onClick={handleSignMessage}
          className={`${
            !active && library?.getSigner() !== null && 'opacity-20'
          } rounded-full hover:bg-sky-100 border-sky-800 border-4 px-8 py-1 font-semibold shadow-2xl`}
        >
          <p className="text-lg font-bold  ">Sign</p>
        </button>
      </div>
      <div className="flex flex-1 flex-col space-y-2 items-center">
        <p className="text-xl font-semibold">
          {!active
            ? 'Connect already'
            : ticketSystemContract
            ? 'Contract deployed ✅'
            : 'Deploy contract'}
        </p>
        <button
          disabled={!active}
          onClick={handleDeployContract}
          className={`${
            !active && 'opacity-20'
          } rounded-full  hover:bg-sky-100 border-sky-900 border-4 px-8 py-1 shadow-2xl`}
        >
          <p className="text-lg font-bold">Proceed</p>
        </button>
      </div>
    </div>
  );
};

export default MainWrapper;
