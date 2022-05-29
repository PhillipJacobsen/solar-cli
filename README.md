# solar-cli

**Example CLI using Solar Blockchain SDK**

Installation: `npm install`

In package.json file configure the ip address of your Solar relay node via **nodeIP** parameter. 

In package.json file configure the network(testnet or mainnet) via **network** parameter.

To get list of commands: `solar-cli --help`

To get help on each command: `solar-cli <command> --help`

**Commands:**

* s-cli relay Get status of relay node used for accessing blockchain
* s-cli validate Validate a wallet address
* s-cli peers Get list of peers
* s-cli nonce Get nonce of wallet
* s-cli sign Sign message using Schnorr algorithm
* s-cli verify Verify Signature using Schnorr algorithm
* s-cli tx Send transaction with optional smartbridge message

**s-cli relay**

Description: Get status of relay node used for accessing blockchain

no Options:

**s-cli validate**

Description: Validate a wallet address

Options: 

  --adr  wallet address

**s-cli peers**

Description: Get list of peers

no Options:

**s-cli nonce**

Description: Get nonce of a wallet

Options: 

  --adr wallet address

**s-cli sign**

Description: Sign message using Schnorr algorithm

Options: 

  --msg  Message to be signed

  --passphrase  Your Private Passphrase(12 words)          

**s-cli verify**

Description: Verify Signature using Schnorr algorithm

Options:

  --msg  Message to be signed

  --publicKey   Public key of sender

  --signature   Message signature

**s-cli tx**

Description: Send transaction with optional smartbridge message

Options:

  --adr  Recipient's Address

  --passphrase  Your Private Passphrase(12 words)

  --smartbridge  Message to include with transaction(optional)
