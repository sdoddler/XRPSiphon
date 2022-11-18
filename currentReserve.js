let currentReserve = async function (client, ledger_index) {
    var serverstate = await client.request({
        "command": "server_state",
        "ledger_index": ledger_index
    })

    return [((serverstate.result.state.validated_ledger.reserve_inc) / 1000000), ((serverstate.result.state.validated_ledger.reserve_base) / 1000000)]
}
module.exports = { currentReserve };