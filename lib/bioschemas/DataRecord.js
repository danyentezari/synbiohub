
var extend = require('xtend')
var config = require('../config')
var uriToUrl = require('../uriToUrl')

module.exports = function generateDataRecord (metadata) {
  let url = config.get('instanceUrl').slice(0, -1) + uriToUrl(metadata.uri)

  return extend({

    'identifier': [
      metadata.name
    ],
    'mainEntity': {
      '@type': metadata.rdfType,
      'identifier': metadata.name,
      'hasBioChemRole': metadata.roles ? metadata.roles.map((role) => role.uri) : [],
      'url': url,
      'description': (metadata.description || '').trim()
    },
    'url': url

  }, config.get('bioschemas').DataRecord)
}
