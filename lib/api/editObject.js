const config = require('../config')
const getUrisFromReq = require('../getUrisFromReq')
const loadTemplate = require('../loadTemplate')
const sparql = require('../sparql/sparql')
const lookupRole = require('../role')
const lookupType = require('../type')

const PREDICATES = {
  'title': 'http://purl.org/dc/terms/title',
  'description': 'http://purl.org/dc/terms/description',
  'role': 'http://sbols.org/v2#role',
  'wasDerivedFrom': 'http://sbols.org/v2#wasDerivedFrom',
  'type': 'http://sbols.org/v2#type'
}

function subjectIsValid (subject) {
  let defaultGraph = config.get('triplestore').defaultGraph

  return !subject.startsWith(defaultGraph)
}

function predicateIsValid (predicate) {
  return predicate !== undefined
}

function objectIsValid (object) {
  return object && object !== ''
}

function tripleIsValid (subject, predicate, object) {
  if (predicate === PREDICATES['role']) {
    // this needs to actually validate roles
    return true
  }

  return true
}

function getDisplayString (type, object) {
  switch (type) {
    case 'role':
      let role = lookupRole(object)
      return role.description.name || role.term || role.uri
    case 'type':
      let type = lookupType(object)
      return type.description.name || type.term || type.uri
    default:
      return object
  }
}

function formatObject (object) {
  if (object.startsWith('http')) {
    return `<${object}>`
  } else {
    return `"${object}"`
  }
}

function serve (req, res) {
  let { graphUri, uri } = getUrisFromReq(req, res)
  let field = req.params.field

  let d = new Date()
  let modified = d.toISOString()
  modified = modified.substring(0, modified.indexOf('.'))
  modified = JSON.stringify(modified)

  let subject = uri
  let predicate = PREDICATES[field]
  let object = req.body.object || ''
  let previous = req.body.previous || ''

  if (!subjectIsValid(subject)) {
    res.sendStatus(403).end()
    return
  } else if (!predicateIsValid(predicate)) {
    res.sendStatus(404).end()
    return
  } else if (!objectIsValid(object)) {
    res.sendStatus(400).end()
    return
  } else if (!tripleIsValid(subject, predicate, object)) {
    res.sendStatus(400).end()
    return
  }

  const params = {
    subject: subject,
    predicate: predicate,
    object: formatObject(object),
    previous: formatObject(previous),
    modified: modified
  }

  const query = loadTemplate('./sparql/UpdateTriple.sparql', params)
  console.log(query)

  sparql.updateQueryJson(query, graphUri).then(result => {
    res.send(getDisplayString(field, object))
  }).catch(error => {
    console.error(error)
    res.sendStatus(500).end()
  })
}

module.exports = serve
