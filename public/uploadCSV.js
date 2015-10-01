
$(document).ready(function() {
    
    var socket  = io.connect();
    var input = $('input');
    var messages = $('#messages');
    $('button').on('click',function(e){
        e.preventDefault();
        $('#report').css('display','block');
        var pagination = $('form input')[0].value;
        var maxQuery = $('form input')[1].value;
        var url = $("form select option:selected" ).text();
        console.log(pagination);
        console.log(maxQuery);
        console.log(url);
        socket.on('connectionTEST1',function(){console.log('connectionTEST1')});
        socket.emit('start search',pagination, maxQuery,url);
        socket.on('connectionTEST2',function(){console.log('connectionTEST2')});
        socket.on('connectionTEST3',function(){console.log('connectionTEST3')});
        socket.on('start search',function(msg){console.log(msg)});
        socket.on('app error',function(error){console.log(error)});
        socket.on('Not Broken',function(link){
            $('ul').prepend('<li style=" color:green">Not Broken: '+link+'</li>');
            console.log('Not Broken: '+link)
        });
        socket.on('Broken',function(link){
            $('ul').prepend('<li style=" color:red">Broken: '+link+'</li>');
            console.log('Broken: '+link)
        });
        socket.on('Undefined',function(link){
            $('ul').prepend('<li style=" color:purple">undefined: '+link+'</li>');
            console.log('Not Broken: '+link)
        });
        socket.on('no broken links',function(msg){
            alert(msg);
            console.log(msg)
        });
        socket.on('excel sheet',function(msg){ 
            alert(msg);
            window.location.href ='/file.csv'; 
            console.log(msg)
        });
        
    });
    
    
});