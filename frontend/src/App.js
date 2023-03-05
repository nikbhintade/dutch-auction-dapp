import "./App.css";
import DutchAuction from "./DutchAuction.json";
import NFT from "./NFT.json";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CONTRACTADDRESS = "0x60b9752bF3e616f4Aa40e12cdB6B615fe5e14807";

function App() {
    const [state, setState] = useState({
        contract: undefined,
        address: "",
        metadata: {},
        sold: false,
    });
    const [price, setPrice] = useState();

    useEffect(() => {
        const getPrice = async () => {
            if (state.contract !== undefined) {
                try {
                    const price = await state.contract.getPrice();
                    setPrice(ethers.utils.formatEther(price));
                } catch (e) {
                    console.log(e);
                }
            }
        };

        const interval = setInterval(() => {
            getPrice();
        }, 5000);
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [state.contract]);

    // connect to wallet
    const connect = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                console.error("Install any Celo wallet");
                return toast.error("No wallet installed!");
            }

            const provider = new ethers.providers.Web3Provider(ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const account = accounts[0];

            const signer = provider.getSigner();
            const auction = new ethers.Contract(
                CONTRACTADDRESS,
                DutchAuction.abi,
                signer
            );

            const [sold, nftAddress] = await Promise.all([
                auction.sold(),
                auction.nft(),
            ]);

            const nft = new ethers.Contract(nftAddress, NFT.abi, signer);
            const metadata = await fetch(await nft.tokenURI(0)).then((res) =>
                res.json()
            );

            setState({
                contract: auction,
                address: `${account.slice(0, 5)}...${account.slice(-5)}`,
                metadata,
                sold,
            });
        } catch (error) {
            toast.error(error.reason);
        }
    };

    const buy = async () => {
        try {
            const buyTxn = await state.contract.buy({
                value: ethers.utils.parseEther(price),
            });
            await toast.promise(buyTxn.wait(), {
                pending: "transaction executing",
                success: "NFT bought",
            });
            const isSold = await state.contract.sold();
            setState({ ...state, sold: isSold });
        } catch (error) {
            console.error(error);
            toast.error(error.data?.message || error.message);
        }
    };

    return (
        <div className="App">
            <nav>
                <p>Dutch Auction</p>
                <button onClick={connect}>
                    {state.address ? `${state.address}` : "Connect"}
                </button>
            </nav>

            {state.address ? (
                <div className="container">
                    <div>
                        <img
                            id="nft"
                            src={state.metadata.image}
                            alt={state.metadata.description}
                        />
                    </div>

                    <div className="buy">
                        <h2>{state.metadata.name}</h2>
                        <h4>{price}</h4>
                        <button onClick={buy} disabled={state.sold}>
                            {state.sold ? "NFT Sold" : "Buy Now!"}
                        </button>
                    </div>
                </div>
            ) : (
                <h2>Not connected</h2>
            )}

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeButton={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </div>
    );
}

export default App;
