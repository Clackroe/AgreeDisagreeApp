let app = $('#app');

var checkedConvos = new Map();

var currentConvo = "ROOT4";

$(() => {
    console.log("Document ready");
    // createConversation().then((conversations) => {
    //     getMessages(currentConvo).then((messages) => {
    //         insertConversation(conversations, messages);
    //     });
    // });
});

function insertConversation(conversations, messages) {
    app.html('');

    $('#title').html('')
    $('#title').html('Conversation ' + messages[0].conversation_id);

    let html = '';
    for (let i = 0; i < messages.length; i++) {
        html += createMessage(messages[i], i);
    }

    app.html(html);


}

function createConversation() {
    return new Promise((resolve, reject) => {
        $.getJSON('/conversation', (data) => {
            let conversations = [];
            for (let key in data) {
                conversations.push(key);
            }
            resolve(conversations);
        }).fail((error) => {
            reject(error);
        });
    });
}

function getMessages(conv) {


    checkedConvos.clear();
    


    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/utterances',
            type: 'GET',
            dataType: 'json',
            headers: {"conversation_id": conv}
        }).done((data) => {
            // console.log("Data: " + JSON.parse(JSON.stringify(data))[0].id);
            currentConvo = JSON.parse(JSON.stringify(data))[0].id;

            resolve(data);
        }).fail((error) => {
            reject(error);
        });
    });
}

function createMessage(content, i) {

    let willDerail = "Won't Derail";
    if (content.meta['prediction'] == 1) {
        willDerail = "Will Derail";
    }

    checkedConvos.set(content.id, {"speaker": content.speaker});

    

    return "<body><div id='post' class='"+ content.id +"'><span class='username'>" + content.speaker + "</span><span class=posreactions> 👍"+ content.meta['posReactions'] +"</span><span class=negreactions> 👎"+ content.meta['negReactions'] +"</span>"+ "<span id='" + willDerail.replace(" ", '').replace("'", '') + "' class='prediction' style='float: right;'> CRAFT Prediction: "+ willDerail + " </span> <div> <div style='display: inline-block; float: right; margin-left: 15px;'><label for='myCheckbox"+ content.id +"'>◽</label><input type='checkbox' id='myCheckbox"+ content.id +"' class='myCheckbox"+ content.id +"' onchange='changeColor(this)'></div> </div> " +"<div class='message'>" + content.text + "</div></div></body>";
}

function changeColor(checkbox) {
    var div = checkbox.parentNode;
    
    var label = $(div).find('label')
    if (checkbox.checked) {
    //   div.style.backgroundColor = "green";
      $(label).text('✅')
    } else {
    //   div.style.backgroundColor = "yellow";
        $(label).text('❌')
    }
  }


function doneWithConvo(){

    // window.scrollTo(0, 0);

    var name = $('.name').val();

    if (name == "") {
        alert("Please enter your name");
        return;
    }

    else{
        checkedConvos.forEach((value, key) => {
            console.log(key);
            var checkbox = $('.myCheckbox'+key);
            if (checkbox.is(':checked')) {
                checkedConvos.set(key, {"speaker": value.speaker, "checked": true})
            } else {
                checkedConvos.set(key, {"speaker": value.speaker, "checked": false})
            }
        });
    
        
    
    
        var obj = Object.fromEntries(checkedConvos);
        var jsonString  = obj;
    
        console.log(jsonString)
    
    
        $.ajax({
            url: '/checkedConvo',
            type: 'POST',
            // dataType: 'json',
            headers: {"conversation_id": currentConvo, "name": name},
            data: jsonString
            
        }).then((data) => {

            console.log("post convo success DATA: " + data);

            var num = parseInt(this.currentConvo.replace("ROOT", "")) + 1;

            console.log("GOTO: " + num);

            goTo(num);
        }).catch((error) => {
            console.log("post convo error: " + error);
        });      



    }

    

}

function goToSubmit(){
    var convo = $('.convoNum').val();
    goTo(convo);
}


function goTo(num){
    
    let conv = "ROOT"+num;

    getMessages(conv).then((messages) => {
        insertConversation(conv, messages);
        console.log("Test")
    });
}
