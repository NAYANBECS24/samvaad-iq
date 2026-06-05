const http = require('http')
const handleRequest = require('../api')

if (require.main === module) {
  const port = Number(process.env.PORT || 3001)
  http.createServer(handleRequest).listen(port, () => {
    console.log(`SAMVAAD-IQ API listening on http://localhost:${port}`)
  })
}

module.exports = handleRequest
