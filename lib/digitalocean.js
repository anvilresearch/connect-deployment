/**
 * Module dependencies
 */

var async = require('async')
var inquirer = require('inquirer')
var request = require('superagent')
var ProgressBar = require('progress')

/**
 * Digital Ocean API
 */

var DigitalOcean = {}

/**
 * List SSH Keys
 */

function listSSHKeys (done) {
  request
    .get('https://api.digitalocean.com/v2/account/keys')
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.ssh_keys)
    })
}

DigitalOcean.listSSHKeys = listSSHKeys

/**
 * List Regions
 */

function listRegions (done) {
  request
    .get('https://api.digitalocean.com/v2/regions')
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.regions)
    })
}

DigitalOcean.listRegions = listRegions

/**
 * List Sizes
 */

function listSizes (done) {
  request
    .get('https://api.digitalocean.com/v2/sizes')
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.sizes)
    })
}

DigitalOcean.listSizes = listSizes

/**
 * Create Droplet
 */

function createDroplet (options, done) {
  request
    .post('https://api.digitalocean.com/v2/droplets')
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .set('Content-Type', 'application/json')
    .send(options)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.droplet)
    })
}

DigitalOcean.createDroplet = createDroplet

/**
 * List Droplets
 */

function listDroplets (done) {
  request
    .get('https://api.digitalocean.com/v2/droplets')
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.droplets)
    })
}

DigitalOcean.listDroplets = listDroplets

/**
 * Get Droplet By ID
 */

function getDropletById (id, done) {
  request
    .get('https://api.digitalocean.com/v2/droplets/' + id)
    .set('Authorization', 'Bearer ' + DigitalOcean.token)
    .end(function (err, res) {
      if (err) { return done(err) }
      done(null, res.body.droplet)
    })
}

DigitalOcean.getDropletById = getDropletById

/**
 * Get Droplet IP By ID
 */

function getDropletIPById (id, done) {
  getDropletById(id, function (err, droplet) {
    if (err) { return done(err) }

    var ip = droplet
      && droplet.networks
      && droplet.networks.v4
      && droplet.networks.v4[0].ip_address

    done(null, ip)
  })
}

DigitalOcean.getDropletIPById = getDropletIPById

/**
 * Fetch options for prompt
 */

function dropletOptions (done) {
  async.parallel({
    sizes: DigitalOcean.listSizes,
    regions: DigitalOcean.listRegions,
    sshKeys: DigitalOcean.listSSHKeys
  }, function (err, results) {
    if (err) { done(err) }

    function sorter (key) {
      return function (a, b) {
        if (a[key] < b[key]) { return -1 }
        if (a[key] > b[key]) { return 1 }
        return 0
      }
    }

    results.regions.sort(sorter('slug'))
    results.sshKeys.sort(sorter('name'))

    done(null, results)
  })
}

DigitalOcean.dropletOptions = dropletOptions

/**
 * Prompt user for options
 */

function promptDropletOptions (done) {
  DigitalOcean.dropletOptions(function (err, options) {
    if (err) { done(err) }

    inquirer.prompt([
      {
        name: 'name',
        message: 'Name your new auth server',
        default: 'anvil-connect'
      },
      {
        name: 'region',
        type: 'list',
        message: 'Select a region',
        choices: options.regions.map(function (region) {
          return {
            name: region.name,
            value: region.slug
          }
        }),
        default: 'sfo1'
      },
      {
        name: 'size',
        type: 'list',
        message: 'Select a size',
        choices: options.sizes.map(function (size) {
          return {
            name: size.slug + ' ($' + size.price_monthly + '/mo)',
            value: size.slug
          }
        })
      },
      {
        name: 'sshKeys',
        type: 'checkbox',
        message: 'Select ssh keys',
        choices: options.sshKeys.map(function (key, idx) {
          return {
            name: key.name,
            value: key.id,
            checked: (idx === 0)
          }
        })
      }
    ], function (answers) {
      done(answers)
    })
  })
}

DigitalOcean.promptDropletOptions = promptDropletOptions

/**
 * Wait for Droplet
 */

function waitForDroplet (id, done) {
  var bar = new ProgressBar(':bar', { total: 70 })
  var timer = setInterval(function () {
    if (bar.complete) {
      getDropletIPById(id, function (err, ip) {
        if (err) { return done(err) }

        if (ip) {
          clearInterval(timer)
          done(null, ip)
        }
      })
    } else {
      bar.tick()
    }
  }, 1000)
}

DigitalOcean.waitForDroplet = waitForDroplet

/**
 * Exports
 */

module.exports = DigitalOcean

