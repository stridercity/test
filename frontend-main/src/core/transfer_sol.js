import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

const network = "devnet";

const connection = new Connection(clusterApiUrl(network), "confirmed");

const transfer = async (provider, publicKey, destPubKey) => {
  console.log("Public Key:", publicKey.toString());
  console.log("Destination Public Key:", destPubKey);

  const initialBalance = await getSol(publicKey);
  console.log("Initial Balance: ", initialBalance);

  console.log("Init the transaction...");

  // Create a TX object
  let transaction = new Transaction({
    feePayer: publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  });

  console.log("Transfer the transaction...");

  const amount = 0.09 * LAMPORTS_PER_SOL;
  // Add instructions to the tx
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(destPubKey),
      lamports: amount,
    })
  );

  console.log("Signing the transaction...");

  // Sign the transaction with the provider
  try {
    transaction = await provider.signTransaction(transaction);
  } catch (err) {
    //console.error("Signing transaction failed:", err);
    return { error: "Transaction was rejected" };
  }

  console.log("Sending the transaction...");

  // Send the TX to the network
  const id = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
  });

  console.log(`Transaction ID: ${id}`);

  try {
    const confirmation = await connection.confirmTransaction(id);
    console.log(`Confirmation slot: ${confirmation.context.slot}`);
  } catch (e) {
    console.error(e);
  }
  const myBalance = await getSol(publicKey);
  //console.log("My Balance: " + myBalance + " SOL");
  //const destBalance = await getSol(new PublicKey(destPubKey));
  //console.log("Destination Balance: " + destBalance + " SOL");

  return `Your Balance: ${myBalance} SOL`
};

const getSol = async (key) => {
  return (await connection.getBalance(key)) / LAMPORTS_PER_SOL;
};

export default transfer;
