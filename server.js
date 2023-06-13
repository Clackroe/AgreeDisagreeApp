const express = require('express');
const jsonl = require('node-jsonl');
const fs = require('fs');
const app = express();
const port = 3330; // Replace with your desired port number

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let doneConvos = [];

let conversations;


    fs.readFile('public/conversations/CORP1/conversations.json', 'utf8', (err, data) => {

        conversations = JSON.parse(data);

    });

//TODO: Need api endpoint to download all the found data


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



app.post('/checkedConvo', (req, res) => {

    let id = req.headers.conversation_id;
    let name = req.headers.name;

    // console.log(req.headers)

    

    let data = JSON.parse(JSON.stringify(req.body));

    // console.log(data)


    


    fs.writeFile('public/Data/' + name + '_'+id+".json", JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    })

    doneConvos.push(id)

    res.send("success");


});

app.get('/download', (req, res) => {
    const directoryPath = 'public/Data/';
    const targetDirectory = 'public/Downloads/';

    let falsePositives = 0;
    let falseNegatives = 0;

    let totalUtterances = 0;

    

    

    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        if (files.length == 0) {
            res.status(500).send('No files to download');
            return;
        }

        let csv = "Conversation ID, Utterance ID, Speaker, CRAFT Prediction (Heated?), Agree With Craft\n";
        const readFilePromises = [];

        files.forEach(function (file) {
            let convID = '';

            

            const filePath = directoryPath + file;

            const readFilePromise = new Promise((resolve, reject) => {
                fs.readFile(filePath, 'utf8', function (err, data) {
                    if (err) {
                        reject('Unable to read file: ' + err + '\nFile path in question: ' + filePath + file);
                        return;
                    }

                   

                    let json = JSON.parse(data);

                    for (const [key, value] of Object.entries(json)) {
            
                        if (file.includes("ROOT")) {
                            convID = file.replace(".json", "");
                            convID = convID.substring(convID.indexOf("ROOT"), convID.length);
                        }

                        // console.log(conversations[convID])

                        if (value.checked == false && conversations[convID]['heated'] == false) {
                            falseNegatives++;
                        }
                        else if (value.checked == false && conversations[convID]['heated'] == true) {
                            falsePositives++;
                        }

                        totalUtterances++;


                        
                        let line = convID + ", " + key + ", " + value.speaker + ", " + conversations[convID].heated +", " + value.checked + "\n";
                        csv += line;
                    }

                    resolve();
                });
            });

            readFilePromises.push(readFilePromise);
        });

        


        Promise.all(readFilePromises)
            .then(() => {
                try {
                    fs.mkdirSync(targetDirectory, { recursive: true });
                } catch (err) {
                    throw new Error('Unable to create directory: ' + err);
                }
                csv = "\n\nFalse Positives: " + falsePositives + "\nFalse Negatives: " + falseNegatives + "\nTotal Utterances: " + totalUtterances + "\n\n" + csv;

                let successRatio = (totalUtterances - (falsePositives + falseNegatives)) / totalUtterances * 100;

                csv = "Success Ratio: " + successRatio + "%\n\n" + csv;

                fs.writeFile(targetDirectory + 'data.csv', csv, function (err) {
                    if (err) {
                        throw new Error('Unable to write file: ' + err);
                    }

                    res.download(targetDirectory + 'data.csv', 'data.csv');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });
});





// Serve static files (HTML, CSS, JavaScript)
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
