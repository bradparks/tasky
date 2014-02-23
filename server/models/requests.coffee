# See documentation on https://github.com/frankrousseau/americano-cozy/#requests

americano = require 'americano'

module.exports =
    task:
        all: americano.defaultRequests.all
        byState: (doc) -> emit  doc.state, doc

    cozy_instance:
        all: americano.defaultRequests.all