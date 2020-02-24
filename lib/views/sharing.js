const config = require('../config')
const db = require('../db')
const getUrisFromReq = require('../getUrisFromReq')
const privileges = require('../auth/privileges')
const pug = require('pug')

module.exports = async function (req, res, type) {
  let { uri, url } = getUrisFromReq(req, res)

  let shares = await db.model.Auth.findAll({
    where: {
      rootAuth: null,
      uri: uri
    },
    include: [{
      model: db.model.User,
      where: {
        virtual: false
      }
    }]
  })

  shares = shares.map(share => {
    share.removeUrl = config.get('instanceUrl') + 'share/' + share.id + '/delete'
    share.privilege = {
      text: privileges.toText(share.privilege),
      value: share.privilege
    }

    return share
  })

  let shareLinks = await db.model.Alias.findAll({
    where: {
      url: config.get('instanceUrl') + url.substring(1)
    }
  })

  shareLinks = await Promise.all(shareLinks.map(async shareLink => {
    shareLink.url = config.get('instanceUrl') + 'alias/' + shareLink.tag
    shareLink.removeUrl = config.get('instanceUrl') + 'alias/' + shareLink.tag + '/delete'

    let auth = await db.model.Auth.findOne({
      where: {
        rootAuth: null,
        uri: uri,
        userId: shareLink.userId
      }
    })

    shareLink.privilege = {
      text: privileges.toText(auth.privilege),
      value: auth.privilege
    }

    shareLink.authId = auth.id

    return shareLink
  }))

  var locals = {
    config: config.get(),
    user: req.user,
    shares: shares,
    shareLinks: shareLinks,
    url: url
  }

  res.send(pug.renderFile('templates/views/manageSharing.jade', locals))
}
