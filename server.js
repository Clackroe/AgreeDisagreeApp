const express = require('express');
const jsonl = require('node-jsonl');
const fs = require('fs');
const app = express();
const port = 3330; // Replace with your desired port number

let doneConvos = [];


app.get('/utterances', (req, res) => {
    let messages = []

    fs.readFile('public/conversations/CORP1/utterances.jsonl', 'utf8', async (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading Utterance file');
            return;
        }

        

        let conversation = req.headers.conversation_id;

        while (doneConvos.includes(conversation)) {
            var num = parseInt(conversation.replace("ROOT", "")) + 1
            conversation = "ROOT"+num
            if (num > 1000) {
                break;
            }
        }


        const rl = jsonl.readlines('public/conversations/CORP1/utterances.jsonl')

        while (true){
            const {value, done} = await rl.next()
            if (done) break;
            // console.log(value)
            let utterance = value
            
            if (utterance.conversation_id == conversation) {
                messages.push(utterance)
            }

        }

        utterances = JSON.stringify(messages)

        // console.log(utterances)
        // console.log(messages)

        res.json(messages);


    });

});






// Define a route to handle the request for fetching the conversation data from JSON
app.get('/conversation', (req, res) => {
    // Read and parse the conversation JSON file here
    fs.readFile('public/conversations/CORP1/conversations.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error reading conversation file');
            return;
        }

        const conversation = JSON.parse(data);

        res.json(conversation);

    });
    // Send the conversation data as a JSON response
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/checkedConvo', (req, res) => {

    let id = req.headers.conversation_id;
    let name = req.headers.name;

    console.log(req.headers)

    

    let data = JSON.parse(JSON.stringify(req.body));

    console.log(data)


    


    fs.writeFile('public/Data/' + name + '_'+id+".json", JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    })

    doneConvos.push(id)




});



// Serve static files (HTML, CSS, JavaScript)
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
