var built;

function revisaContingut () {
    if (document.getElementById("uriii").value.length>30 || document.getElementById("uriii").value.indexOf(" ")!=-1 ) document.getElementById("uriii").style.height="300px";
}
                          
                                                    
function actualitzaRegistres(currentUri) {
    if (currentUri !== '' && typeof currentUri !== "undefined" && currentUri!='http://synchronizing.me') {
        typee=(currentUri.substr(0,5)=="http:")?"url":(currentUri.substr(0,12)=="BEGIN:VEVENT")?"ical":(currentUri.substr(0,4)=="geo:")?"geo":"text";

        
        switch(typee) {
            case "url":
                document.getElementById("uriii").innerHTML="<a target=blank href='"+currentUri+"' title='URL' value='"+currentUri+"x'>URL "+currentUri+"</a>";
                document.getElementById("uriiiLabel").innerHTML="<a target=blank href='"+currentUri+"' title='URL' value='"+currentUri+"x'>URL "+currentUri+"</a>";
                break;
                
            case "text":
                
                document.getElementById("uriiiLabel").innerHTML=currentUri;
                document.getElementById("uriii").value=currentUri;
                break;
            
            case "ical":
                document.getElementById("uriiiLabel").innerHTML="<a target=blank href='ical://doesNotMatterWhatGoesHere.ics' title='URL' value='"+currentUri+"x'>URL "+currentUri+"</a>";                
                document.getElementById("uriii").value="<a href='ical://doesNotMatterWhatGoesHere.ics'>Open iCal with Hyperlink</a>";
                break;
                
                
            case "geo":
                
                document.getElementById("uriiiLabel").innerHTML="<img src='http://staticmap.openstreetmap.de/staticmap.php?center="+currentUri.replace("geo:","")+"&zoom=14&size=865x512&maptype=mapnik-28.643387%2C%20153.612224&zoom=10&format=png&maptype=roadmap&mobile=false&language=en&size=500x500&key=&sensor=false'></img>";                
                document.getElementById("uriii").value=currentUri;
                break;                
                
        }
        
        
        
        document.getElementById("uriii").setAttribute('value',currentUri);
        
        
    }
    
}

    function getParameterByName( name ){
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
                              
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        
        var results = regex.exec( window.location.href );
        if( results == null )
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    
    function goo() {
    
        urii=document.getElementById("uriii").value;
        
        
        
        if (urii == null || urii == ""){
            alert("Please define some data to share");
            document.getElementById("uriii").focus();
        return false;
            urii="http://synchronizing.me";
        }
        
        
        if (urii.length > 1296 ) { alert ("The lenght of the data to share can't exceed 1296 characters."); return false;  }
    
        actualitzaRegistres(urii);
        document.getElementById("qr2").src='https://api.qrserver.com/v1/create-qr-code/?size=350x350&data='+encodeURIComponent(urii);
        
        
        //document.getElementById("uriii").value="<a target=blank href='"+urii+"' title='URL' value='"+urii+"x'>URL "+urii+"</a>";
        
        document.getElementById("uriiiLabel").value="<a target=blank href='"+urii+"' title='URL' value='"+urii+"'>[URL] "+urii+"</a>";
        document.getElementById("reset").innerHTML="Reset";
        
        document.getElementById("reset").onclick=function() { document.getElementById("reset").onclick=function() { goo(); }; document.getElementById("uriii").value=document.getElementById("uriiiLabel").innerHTML=""; document.getElementById("reset").innerHTML="Generate QR"; } ;
        
        
        
        document.getElementById("pas2").style.visibility = "visible";
        document.getElementById("usagee").style.display = "block";
        document.getElementById("usagee").style.visibility = "visible";
        
        document.getElementById("rolf").style.display = "block";
        
        document.getElementById("pricingLink").click();
        //                          history.pushState(null, null, '#');
        
    }
                          



    function mostraSessions() {
        
    
        $('#sessions').toggle();
        /*
                                  document.getElementById("tipps").innerHTML="TIP";

      quinn=document.getElementById("urii");

      if (quinn.value.length>3 || quinn.value.indexOf("geo:")!=-1 ){

        document.getElementById("tipps").style.marginTop=$("#tipp").offset().top+"px";
        //document.getElementById("sessions").style.marginTop="10px";
        
      }
      
      */

    }


                          
    /*
     function comparteixme () {
     
     
     window.setInterval(function(){
     
     valor=document.getElementById("comparteix").innerHTML;
     document.getElementById("comparteix").innerHTML=(valor.indexOf(".")!==-1)?"-":".";
     }, 2000);
     comparteixme();
     }
     
     comparteixme();
     
     */

    function setSessio(sess) {
        //console.log("LOLx");
        //prev=$('#sessions').text();
                
      built = new Built();
      
      built.initialize('blt9bfa2b005faf9360', '1') ;                    

        $('#sessions').empty();

      
      var myQuery = new built.Query('post');
      myQuery.where('id_telf', sess);
      myQuery.exec({
            onSuccess: function(data) {
                //console.log("succ");

                $(data).each(function(index, value) {
                  sessForm="<br><a class='lolz' href='/?uri="+encodeURIComponent(value.get('data'))+"' title='Post #" + value.get('title') +"'>  #"+value.get('title')+"</a>";
                  $('#sessions').append(sessForm);

                });
                sessForm="<img style=' -webkit-filter: invert(100%);' onclick='iniSessions();' width='15px' height='15px' src='images/close-icon.png'></img>";
                $('#sessions').append(sessForm);
                // data is array of Built.Object
                // data[0].get('name') --> ricky
            },
            onError: function(err) {
               console.log("error"+  err);  }
          });

    }    
                          
    
    
    function creaSessio(sess) {
        sessForm="<a class='lolz' onclick='setSessio("+sess+");' title='Session #" + sess+"'>  #"+sess+"</a><br>";
        $('#sessions').append(sessForm);

    }
    
    function iniSessions(sess) {
        $('#sessions').empty();        
        getSessions();
    }
  
    function getSessions() {
      built = new Built();
      
      built.initialize('blt9bfa2b005faf9360', '1') ;                    
      
      var myQuery = new built.Query('telf');
      //myQuery.where('name', '7');
      myQuery.exec({
            onSuccess: function(data) {
              $(data).each(function(index, value) {
                 creaSessio(value.get('name'));
              });

              // data is array of Built.Object
              // data[0].get('name') --> ricky
            },
            onError: function(err) {
                alert("error"+  err);  }
          });
                    
    }
    
                          
    window.onload=function(e){
            $('#sessions').hide();
            


//alert(getParameterByName("uri"));


            
            var currentUri=getParameterByName("uri");

            if (currentUri !== '' && typeof currentUri !== "undefined" && currentUri!='http://synchronizing.me') {  actualitzaRegistres(currentUri); goo(); }




            var currentGeo=getParameterByName("geo");

            if (currentGeo !== '' && typeof currentGeo !== "undefined") {  actualitzaRegistres("geo:"+currentGeo); goo(); }
            

            

            var currentNumber=getParameterByName("num");

            if (currentNumber !== '' && typeof currentNumber !== "undefined") {  actualitzaRegistreNumber(currentNumber); goo(); }


            revisaContingut();
            
            getSessions();
                //alert("a");

    }