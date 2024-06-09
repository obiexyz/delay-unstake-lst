const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

app.get('/delay-unstake/:wallet', (req, res) => {
    const wallet = req.params.wallet;
    exec(`docker run -it --rm delay-unstake-ron delay-unstake ${wallet}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
    res.send(`Delay unstake for wallet: ${wallet}`);
});