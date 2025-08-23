from ccip_sdk import CCIPClient
from dotenv import load_dotenv
import os

load_dotenv()

client = CCIPClient(private_key=os.environ.get("PRIVATE_KEY"))

contract = client.deploy_sender_contract("avalanche_fuji")
print(f"Deployed contract address: {contract}\n")
txn_hash = client.send_tokens_to_sender_contract("avalanche_fuji", "CCIP-BnM", 0.5)
print(f"Token sent via this transaction hash : {txn_hash}\n")
txn_hash = client.send_eth_to_contract("avalanche_fuji", 0.05)
print(f"ETH sent via this transaction hash : {txn_hash}\n")
txn_hash = client.allow_destination_chain(current_chain="avalanche_fuji", destination_chain="base_sepolia")
print(f"Allowed destination chain base_sepolia done with txnHash : {txn_hash}\n")

contract = client.deploy_receiver_contract("base_sepolia")
print(f"Deployed contract address: {contract}\n")
txn_hash = client.allow_source_chain(current_chain="base_sepolia", sender_chain="avalanche_fuji")
print(f"Allowed sender chain avalanche_fuji done with txnHash : {txn_hash}\n")
txn_hash = client.allow_sender_on_receiver(sender_chain="avalanche_fuji", receiver_chain="base_sepolia")
print(f"Allowed the sender contract to send messages on reciever chain with txnHash : {txn_hash}\n")

txn_url = client.transfer(sender_chain="avalanche_fuji", receiver_chain="base_sepolia", text="Hi dj boi", amount=0.1)
print(f"You can watch the CCIP Transfer here : {txn_url}\n")
