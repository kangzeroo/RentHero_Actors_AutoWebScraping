const http = require('http')

console.log('Starting http server...')

const app = http.createServer((request, response) => {
  console.log('Got hit!')
  console.log(request.Body)
});

app.listen(3000);
