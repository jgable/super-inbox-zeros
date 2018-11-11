const express = require('express')
const path = require('path')
const request = require('request-promise')

const {PORT, BITLY_API_TOKEN} = process.env
const BUILD_DIR = path.join(__dirname, 'build')

const app = require('express')()

// Serve assets from build dir
app.use(express.static(BUILD_DIR))

// Gallery
app.get('/', (req, res) => {
  res.sendFile(path.resolve(BUILD_DIR, 'index.html'))
})

// Get shortened links from bit.ly through the server to preserve our API key
app.get('/image_link', (req, res) => {
  if (BITLY_API_TOKEN == null || BITLY_API_TOKEN === '') {
    return res.status(500, 'Missing Bitly API token')
  }

  getBitlyLink(req.query.url)
    .then((resp) => {
      if (Array.isArray(resp.tags) && resp.tags.length > 0) {
        return Promise.resolve(resp);
      }

      // Add a special tag to our links for tracking
      return addSuperHumanInboxTags(resp);
    })
    .then((resp) => {
      res.json(resp)
    })
    .catch((err) => {
      console.error({err})
      res.status(500, 'Error: ' + err)
    })
})

function getBitlyLink(long_url) {
  return request
    .post('https://api-ssl.bitly.com/v4/bitlinks', {
      headers: {
        Authorization: `Bearer ${BITLY_API_TOKEN}`,
        'User-Agent': 'request',
      },
      body: {
        long_url,
      },
      json: true,
    })
}

function addSuperHumanInboxTags(bitlyResponse) {
  return request
    .patch(`https://api-ssl.bitly.com/v4/bitlinks/${bitlyResponse.id}`, {
      headers: {
        Authorization: `Bearer ${BITLY_API_TOKEN}`,
        'User-Agent': 'request',
      },
      body: {
        tags: ['superhuman-inbox-fav']
      },
      json: true,
    })
    .then((resp) => ({
      ...bitlyResponse,
      tags: ['superhuman-inbox-fav'],
    }))
}

app.listen(PORT || 3000, () => {
  console.log('Now listening...')
})
