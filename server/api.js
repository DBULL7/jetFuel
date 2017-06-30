const environment = process.env.NODE_ENV || 'development'
const configuration = require('../knexfile')[environment]
const database = require('knex')(configuration)

const folders = (req, res) => {
  database('folders').select()
  .then(folders => {
    res.status(200).json(folders);
  })
  .catch(error => {
    console.error('error: ', error)
    res.status(500)
  });
}

const newFolder = (req, res) => {
  const { name, urls } = req.body
  database('folders').insert({name: name}, 'id')
  .then((folder) => {
    let urlPromises = []

    urls.forEach((url) => {
      urlPromises.push(insertUrlToDB(url, folder))
    })
    Promise.all(urlPromises)
    .then(data => {
      // NOTE: need to fix at some point
      req.body.urls[0].id = data[0][0]
      req.body.urls[1].id = data[1][0]
      res.status(201).json(req.body)
    })
  })
  .catch(error => res.status(500).json({error}))
}

const insertUrlToDB = (url, folder) => {
  console.log(folder)
  return database('urls').insert({url: url.url,
                                  description: url.description,
                                  folder_id: folder[0]}, 'id')
}

const retrieveFolderUrls = (req, res) => {
  const { id } = req.params
  database('urls').where('folder_id', id).select()
  .then(urls => {
      if (urls.length) {
        // let response = Object.assign({}, urls, {id: id})
        // console.log(response);
        res.status(200).json(urls);
      } else {
        res.status(404).json({
          error: `Could not find urls with folder id ${id}`
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    })
}

const reRouteLink = (req, res) => {
  const { id } = req.params
  database('urls').where('id', id).select('url')
  .then(longUrl => {
    const { url } = longUrl[0]
    res.redirect(302, `http://${url}`)
  })
}

const increasePopularity = (req, res) => {
  const { id } = req.params
  database('urls').where('id', id).increment('popularity', 1)
  .then((data) => {
  })
}

const addNewUrl = (req, res) => {
  console.log('adding a new url')
  const { url, description, folder_id } = req.body
  console.log(url);
  database('urls').insert(req.body, 'id')
  .then(data => {
    res.status(201).send(data)
  })
}

module.exports = {
  folders: folders,
  newFolder: newFolder,
  retrieveFolderUrls: retrieveFolderUrls,
  reRouteLink: reRouteLink,
  increasePopularity: increasePopularity,
  addNewUrl: addNewUrl
}
