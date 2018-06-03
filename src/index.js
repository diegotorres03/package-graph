'use strict'

const program = require('commander')

const fs = require('fs')

const neo4j = require('neo4j-driver')

const neoConf = {
  url: process.env.NEO4J_URL || 'bolt://localhost',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'neo4j'
}

const driver = neo4j.v1
  .driver(neoConf.url, neo4j.v1.auth.basic(neoConf.user, neoConf.password))
const neo = driver.session()


program
  .command('analize <dir>')
  // .option('-r, --recursive', 'Remove recursively')
  .action(runAnalysis)

program
  .version('1.0.0')
  .parse(process.argv)


function runAnalysis(dir) {
  const appName = 'MANGO_RegV2'
  analize(appName, dir, true)
}

function analize(appName, dir, isApp = false) {
   readPackage(dir)
    .then(pkg => {
      let promises
      if (pkg && pkg.dependencies) {
        promises = Object.keys(pkg.dependencies).map(dep =>
          saveDependencies(appName, dep, pkg.dependencies[dep], { isDev: false, isApp })
        )
      } else {
        promises = []
      }

      let devPromises
      if (pkg && pkg.devDependencies) {
        devPromises = Object.keys(pkg.devDependencies).map(dep =>
          saveDependencies(appName, dep, pkg.devDependencies[dep], { isDev: false, isApp })
        )
      } else {
        devPromises = []
      }

      Promise.all([...promises, ...devPromises])
        .then(() => {
          return listChildPackages(dir)
        })
        .then(list => {
          let promises
          if (Array.isArray(list)) {
            promises = list.map(item => analize(item, `${dir}node_modules\\${item}\\`))
          } else {
            promises = [Promise.resolve()]
          }
          return Promise.all(promises)
        })
    })
}


function saveDependencies(appName, depName, version, options = {}) {
  // console.log(depName, ' => ', version, `[${isDev}]`)
  const relationType = options && options.isDev ? 'hasDevDependency' : 'hasDependency'
  const dependencyType = options && options.isDev ? 'DevDependency' : 'Dependency'
  const nodeType = options && options.isApp ? 'App' : dependencyType
  const query = `
    MERGE (app:${nodeType} {name: {appName} })
    MERGE (dep:${dependencyType} {name: {depName} })
    MERGE (app)-[:${relationType} { version: {version} }]->(dep)
  `
  const params = {
    appName,
    depName,
    version
  }

  return neo.run(query, params)
}


function readPackage(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(`${path}package.json`, 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(JSON.parse(data))
    })
  })
}

function listChildPackages(path) {
  return readdir(`${path}node_modules`)
    .then(list => {
      // console.log(list)
      return list
    })
    .catch(() => [])
}


function readdir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, stats) => {
      // if (err) reject(err)
      // if folder does not extist just return an empty array
      if (err) resolve([]) 
      else resolve(stats)
    })
  })
}