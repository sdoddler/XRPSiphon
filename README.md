# XRPSiphon
 A tool for transferring percentages of XRP from accounts to other destinations. Intended for use with NFT Royalty  accounts.

# Installation

For those of you that know NodeJS - this only requires the `xrpl` module. For those of you that don't read on:

1. Go to Digital Ocean (or vps of choice) & Create a droplet of the smallest size
2. Wait for Droplet to finish creating - connect to console.
3. sudo apt install nodejs
4. sudo apt install npm
5. npm install xrpl
6. git clone https://github.com/sdoddler/XRPSiphon
7. sudo npm i -g pm2
8. nano XRPSiphon/config.json
9. --> Input relevant details to the config.json
 i) ctrl+x to exit
 ii) Y to save
 iii) Press enter
10. pm2 start XRPSiphon/xrpSiphon.js

Config - (Take out //Comments)
```
{
  "node": "wss://xrplcluster.com/", // XRPL Node to connect to
  "frequency": 60, // frequency the bot checks (In Minutes)
  "wallets": [ // Array of Wallets to check, there can be multiple.
    {
      "walletSeed": "sYourSeedHere", // Seed of wallet
      "threshold": 800,  // XRP Threshold - XRP will never go below this amount
      "minimum": 300, // Minimum amount of XRP to allow to be split up
      "destinations": [ // Array of destinations for XRP to be transferred too
        {
          "wallet": "rGnBUCwMJSX57QDecdyT5drdG3gvsmVqxD",
          "percentage": 70, // Percentage of XRP 
          "default": true, // Only set 1 wallet to default - This will be used for excess, or if Percentages do not add up to 100
          "destinationTag": 1111 // Optional: Destination Tag
        },
        {
          "wallet": "rSVxSCcUfgXBhqHeiaECf1WAe3vKq7XgD",
          "percentage": 30,
          "default": false
        }

      ]
    }
  ]
}
```
