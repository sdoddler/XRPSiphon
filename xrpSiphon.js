const xrpl = require('xrpl');

const { node, wallets,frequency } = require('./config.json');

const {
	currentReserve
} = require(`./currentReserve.js`)
const {
	accountInfo
} = require(`./accountInfo`)

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let xrpClient;
let explorer;

let ownerReserve = 10;
let accountReserve = 2;

xconnect().then(function () { main() })

xrpClient.on('error', async () => {
	console.log('XRPL Error found!');
	await xReconnect();
});



async function main() {
	await getReserves();

	console.log("owner: "+ownerReserve)
	console.log("account: " + accountReserve)

	for (let i = 0; i < wallets.length; i++) {
		if (!xrpl.isValidSecret(wallets[i].walletSeed)) continue;
		var siphoningWallet = xrpl.Wallet.fromSeed(wallets[i].walletSeed);

		console.log(siphoningWallet.classicAddress)
		try {
			console.log()

			var accInfo = await accountInfo(xrpClient, siphoningWallet.classicAddress, "validated")

			var ownerCount = accInfo.result.account_data.OwnerCount;

			var xrpBalance = xrpl.dropsToXrp(Number(accInfo.result.account_data.Balance))

			var reservedXRP = (accountReserve + (ownerCount * ownerReserve))

			console.log("Reserved XRP: " + reservedXRP)
			console.log("Total Balance:" + xrpBalance)

			var availableXRP = (xrpBalance - reservedXRP)

			console.log("\nAvaialble Balance:" + availableXRP)

			var aboveThreshold = availableXRP - wallets[i].threshold

			console.log("Balance above threshold: "+ aboveThreshold)

			if (aboveThreshold <= 0.0001) {
				console.log(`XRP Below or equal to threshold - skipping: ${siphoningWallet.classicAddress}`)
				continue;
			}

			if (wallets[i]?.minimum) {
				if (aboveThreshold < wallets[i].minimum) {
					console.log(`XRP Below above threshold is below the minimum to transfer - skipping: ${siphoningWallet.classicAddress}`)
					continue;
				}
            }

			var percentage = 0;
			for (let j = 0; j < wallets[i].destinations.length; j++) {
				percentage += wallets[i].destinations[j].percentage
				
			}

			if (percentage > 100) {
				console.log("invalid percentages (above 100) - skipping account: " + siphoningWallet.classicAddress)
				continue;
			}

			var transactions = [];

			var defaultAddress = null;

			var remaining = aboveThreshold

			for (let j = 0; j < wallets[i].destinations.length; j++) {
				var perc = wallets[i].destinations[j].percentage / 100
				var amountToSend = aboveThreshold * perc;
				var dest = wallets[i].destinations[j].wallet

				remaining -= amountToSend;

				if (wallets[i].destinations[j].default) defaultAddress = wallets[i].destinations[j].wallet;

				
				var tx = {
					"destination": dest,
					"amount": amountToSend,

				}

				if (wallets[i].destinations[j]?.destinationTag) tx.destinationTag = wallets[i].destinations[j].destinationTag;

				transactions.push(tx);
			}

			if (remaining > 0.0001) {
				if (defaultAddress == null) {
					console.log("Not all funds accounted for and no default address - skipping: " + siphoningWallet.classicAddress)
					continue;
                }
				console.log("Not all funds assigned, routing extra to default: " + defaultAddress)

				transactions.find(o => o.destination == defaultAddress).amount += remaining;

            }

			console.log(transactions)

			for (let j = 0; j < transactions.length; j++) {
				console.log(`Sending ${transactions[j].amount} to ${transactions[j].destination}`)
				var destTag = -1;
				if (transactions[j]?.destinationTag) {
					destTag = transactions[j].destinationTag
				}	
				
				await xSend(transactions[j].amount, wallets[i].walletSeed, transactions[j].destination, destTag)
            }

			} catch (e){
			console.log("Error on account: " + siphoningWallet.classicAddress + "\n"+e+"\n continuuing..")
			continue;
		
        }
	}

	setTimeout(main,frequency*1000*60)
}

async function xconnect(testnet = false) {
 console.log('connecting to **MAINNET** - ' + node);

	
		xrpClient = new xrpl.Client(node)
		explorer = `https://livenet.xrpl.org/transactions/`;


	await xrpClient.connect()

}

async function xReconnect() {

	if (!xrpClient.isConnected()) {
		await xconnect();
	}

	if (!xrpClient.isConnected()) {
		await delay(1000);
		xReconnect();
	}
}

async function getfee(type = "open_ledger", debug = false) {
	var fees = await xrpClient.request({
		command: "fee",
	})


	if (debug) console.log(fees.result);

	switch (type) {
		case "base":
			console.log(fees.result.drops.base_fee)
			return fees.result.drops.base_fee;
			break;
		case "median":
			console.log(fees.result.drops.median_fee)
			return fees.result.drops.median_fee;
			break;
		case "open_ledger":
			console.log(fees.result.drops.open_ledger_fee)
			return fees.result.drops.open_ledger_fee;
			break;
	}
}

async function xSend(amount, fromSeed, destinationAddress, destinationTag = -1) {
	var fromWallet = xrpl.Wallet.fromSeed(fromSeed);

	// Send token ----------------------------------------------------------------
	const issue_quantity = amount;
	const send_token_tx = {
		"TransactionType": "Payment",
		"Account": fromWallet.address,
		"Amount": (amount * 1000000).toFixed(0).toString(),
		"Destination": destinationAddress,		
	}

	if (destinationTag > -1) {
		send_token_tx["DestinationTag"] = destinationTag;
    }

	const pay_prepared = await xrpClient.autofill(send_token_tx)
	const pay_signed = fromWallet.sign(pay_prepared)
	console.log(`Sending ${issue_quantity} XRP to ${destinationAddress}...`)
	const pay_result = await xrpClient.submitAndWait(pay_signed.tx_blob)
	if (pay_result.result.meta.TransactionResult == "tesSUCCESS") {
		console.log(`Transaction succeeded: ` + explorer + `${pay_signed.hash}`)
	} else {
		throw `Error sending transaction: ${pay_result.result.meta.TransactionResult}`
	}
}

async function isSend(amount, currencyCode, issueAddress, destinationAddress, fee = "0") {
	var fromWallet = xrpl.Wallet.fromSeed(rewardsSeed);

	// Send token ----------------------------------------------------------------

	if (fee == "0") {
		fee = await getfee("open_ledger");

	}



	const send_token_tx = {
		"TransactionType": "Payment",
		"Account": fromWallet.address,
		"Amount": {
			"currency": currencyCode,
			"value": amount.toString(),
			"issuer": issueAddress
		},
		"Fee": fee,
		"Destination": destinationAddress,
		"Flags": xrpl.PaymentFlags.tfPartialPayment
	}

	// console.log(send_token_tx);
	const pay_prepared = await xrpClient.autofill(send_token_tx)

	//console.log(pay_prepared);


	const pay_signed = fromWallet.sign(pay_prepared)


	try {
		console.log(`Sending ${amount} ${currencyCode} to ${destinationAddress}...`)
		const pay_result = await xrpClient.submitAndWait(pay_signed.tx_blob);
		if (pay_result.result.meta.TransactionResult == "tesSUCCESS") {
			console.log(`Transaction succeeded: ` + explorer + `${pay_signed.hash}`)
			return `Transaction succeeded: ` + explorer + `${pay_signed.hash}`;
		} else {
			console.log(`Error sending transaction: ${pay_result.result.meta.TransactionResult}`)
			return `Transaction Failed: ` + explorer + `${pay_signed.hash}`;
		}
	}
	catch (error) {
		console.log(error)
		return `Transaction Failed: Lost Transaction - Please Contact KegsRP admin if you are the owner of this wallet.`;
	}
}


async function getReserves() {
	var attemptCount = 0;
	while (attemptCount < 5) {
		try {
			var reserves = await currentReserve(xrpClient, "validated")
			ownerReserve = reserves[0]
			accountReserve = reserves[1]

			
			break
		} catch (err) {
			attemptCount += 1
			var message = `ERROR Retrieving Reserve}`
			console.log(`${message} -> Attempt #${attemptCount}`)

			if (attemptCount == 5) {
				console.log(`FAILED`)
				//fs.appendFileSync(`${hP}/ERRORs.txt`, `\n. _ . _ .\n. _ . _ .\nDistribution Bot #${botDetails.number}\n${message}\nReason\n${err}\n\nThe Bot RESTARTED\nTime: ${new Date(Date.now()).toISOString()}`);
				process.exit(1)
			}
		}
	}

}