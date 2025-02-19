const app = require('./app');
const { 
    DEFAULT_PORT_LOCAL_HOST 
} = require('./constants');

const PORT = process.env.PORT || DEFAULT_PORT_LOCAL_HOST;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
