
# Example CLI using Solar Blockchain SDK
This project is intended to provide an example of how to integrate the [Solar Network Blockchain](https://solar.org/) SDK into a node.js application. It implements a command line interface to perform tasks such as check wallet balance, sign / verify messages, and send transactions.

## Installation
`npm install`

In package.json file configure the ip address of your Solar relay node via **nodeIP** parameter. 

In package.json file configure the network(testnet or mainnet) via **network** parameter.

## Using the CLI
To get list of commands: `solar-cli --help`

To get help on each command: `solar-cli <command> --help`

### Commands
* **solar-cli relay**   Get status of relay node used for accessing blockchain
* **solar-cli validate**   Validate a wallet address
* **solar-cli peers**   Get list of peers
* **solar-cli nonce**   Get nonce of wallet
* **solar-cli balance** Get balance of wallet
* **solar-cli sign**   Sign message using Schnorr algorithm
* **solar-cli verify**   Verify Signature using Schnorr algorithm
* **solar-cli tx**   Send transaction with optional smartbridge message
* **solar-cli tx-ipfs**   Send IPFS transaction with optional smartbridge message


### **solar-cli relay**
**Description:** Get status of relay node used for accessing blockchain  
**Options:** none  

###  **solar-cli validate**
**Description:** Validate a wallet address  
**Options:**  
  --adr  wallet address  

###  **solar-cli peers**
**Description:** Get list of peers  
**Options:** none  

###  **solar-cli nonce**
**Description:** Get nonce of a wallet  
**Options:**   
  --adr wallet address  

### **solar-cli balance**
**Description:** Get balance of a wallet  
**Options:**   
  --adr wallet address  

###  **solar-cli sign**
**Description**: Sign message using Schnorr algorithm  
**Options:**  
  --msg  Message to be signed  
  --passphrase  Your Private Passphrase(12 words)  

###  **solar-cli verify**
**Description:** Verify Signature using Schnorr algorithm  
**Options:**  
  --msg  Message to be signed  
  --publicKey   Public key of sender  
  --signature   Message signature  

###  **solar-cli tx**
**Description:** Send transaction with optional smartbridge message  
**Options:**  
  --adr  Recipient's Address  
  --amt  Amount of coins to send  
  --passphrase  Your Private Passphrase(12 words)  
  --smartbridge  Message to include with transaction(optional)  

###  **solar-cli tx-ipfs**
**Description:** Send IFPS transaction with optional smartbridge message  
**Options:**  
  --adr  Recipient's Address  
  --passphrase  Your Private Passphrase(12 words)  
  --smartbridge  Message to include with transaction(optional)  