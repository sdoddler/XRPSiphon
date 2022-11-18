let accountInfo = async function (client, account, ledger) {
    const result = await client.request({
        "command": "account_info",
        "account": account,
        "ledger_index": ledger
    })

    return result
}

module.exports = { accountInfo };