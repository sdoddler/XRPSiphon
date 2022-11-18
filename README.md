# XRPSiphon
 A tool for transferring percentages of XRP from accounts to other destinations. Intended for use with NFT Royalty  accounts.

Config - (Take out //Comments)
```
{
  "node": "wss://xrplcluster.com/", // XRPL Node to connect to
  "frequency": 60, // frequency the bot checks (In Minutes)
  "wallets": [ // Array of Wallets to check, there can be multiple.
    {
      "walletSeed": "sYourSeedHere", // Seed of wallet
      "threshold": 800,  // XRP Threshold
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
