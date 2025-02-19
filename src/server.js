const { DEFAULT_PORT_LOCAL_HOST } = require('./constants');
const app = require('./app');
const PORT = process.env.PORT || DEFAULT_PORT_LOCAL_HOST;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
