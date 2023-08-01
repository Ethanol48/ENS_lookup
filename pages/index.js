import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { ethers, providers } from "ethers";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // ENS
  const [ens, setENS] = useState("");
  // Save the address of the currently connected account
  const [address, setAddress] = useState("");

  const [newAddress, setNewAddress] = useState("");

  async function formatAddress(address) {
    // Assuming the constant length is 10 characters for the first and last parts
    const firstPart = address.slice(0, 5);
    const lastPart = address.slice(-5);
    const middlePart = "...";

    return `${firstPart}${middlePart}${lastPart}`;
  }

  /**
   * Sets the ENS, if the current connected address has an associated ENS or else it sets
   * the address of the connected account
   */
  const setENSOrAddress = async (address, web3Provider) => {
    // Lookup the ENS related to the given address
    var _ens = await web3Provider.lookupAddress(address);
    // If the address has an ENS set the ENS or else just set the address
    if (_ens) {
      setENS(_ens);
    } else {
      // address;

      setNewAddress(await formatAddress(address));
    }
  };

  /**
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }
    const signer = web3Provider.getSigner();
    // Get the address associated to the signer which is connected to  MetaMask
    const address = await signer.getAddress();
    // Calls the function to set the ENS or Address
    await setENSOrAddress(address, web3Provider);
    return signer;
  };

  /*
    connectWallet: Connects the MetaMask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner(true);
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /*
    renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    if (walletConnected) {
      <div>Wallet connected</div>;
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  const ENSResolverForm = () => {
    const [inputValue, setInputValue] = useState("");
    const [newAddress, setNewAddress] = useState("");

    // const setNewAddressForm = () => {
    //   // Perform any processing with the inputValue here, for example, resolve the ENS domain.
    //   // For demonstration purposes, we will simply set the inputValue as the new address.
    //   setNewAddress(inputValue);
    // };
    const setNewAddressForm = async () => {
      // const web3Provider = window.ethereum;

      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      try {
        let _address = await web3Provider._getAddress(inputValue);
        if (_address) {
          setNewAddress(_address);
        }
      } catch (err) {
        ("the name isn't registered :(");

        setNewAddress("the name isn't registered :(");
      }
    };

    const handleInputChange = (event) => {
      setInputValue(event.target.value);
    };

    if (walletConnected) {
      return (
        <div>
          <div className={styles.separate}>
            <input
              className={styles.input}
              placeholder="vitalik.eth"
              value={inputValue}
              onChange={handleInputChange}
            />
            <button className={styles.button} onClick={setNewAddressForm}>
              Resolve address
            </button>
          </div>
          <div className={styles.displayAddress}>
            {newAddress
              ? newAddress
              : "0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165"}
          </div>
        </div>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div className={styles.background}>
      <Head>
        <title>ENS Lookup</title>
        <meta name="description" content="ENS-Resolver-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome {ens ? ens : newAddress}!</h1>
          <div className={styles.description}>This is a ENS resolver app</div>
          {renderButton()}
          {ENSResolverForm()}
        </div>
      </div>
    </div>
  );
}
