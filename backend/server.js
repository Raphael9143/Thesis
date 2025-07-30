require('dotenv').config()

const app = require('./routes/index')

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})