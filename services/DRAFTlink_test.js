var unirest = require('unirest');
var _ = require('lodash');
var async = require('async');
var google = require('googleapis');
/// maybe seperate
var json2csv = require('json2csv');
var fs = require('fs');

//var mainDomain = 'www.hospitalmedicine.org';
function BrokenList(mainDomain,finPaginationPage,initKeyWordIndex,finKeyWordIndex,socket){
    this.mainDomain = mainDomain;
    this.finPaginationPage = finPaginationPage;
    this.initKeyWordI = initKeyWordIndex;
    this.finKeyWordI = finKeyWordIndex;
    this.socket = socket;
}

BrokenList.prototype.linkTest = function(domain,cb){
var self = this;

unirest.get(domain.link)//.followRedirect(false) ORIGINAL CALL
          .followAllRedirects(true) // ADDED TO RETRIEVE THE END PAGE
          .maxRedirects(9)     // REMOVE IF REDIRECTS ARE OK? 
          // .qs(args)
          .end(function(response) {
           
              if(response.body &&(/*error == response.body.substr(0,52) || ORIGININAL CONDITIONAL*/ 
                response.body.search('Your session has timed out. Please try your operation again.') >-1 || 
                response.body.search('Page not found')>-1)){ // This use to find the error its more performant(error == response.body.substr(0,52)){
                
                    
                    console.log(domain.link, "BROKEN!");
                    self.socket.emit('Broken',domain.link);
                    return cb(null,domain.link);
               
              }else if(!response.body){
                
               
                    self.socket.emit('Undefined',domain.link);
                    console.log('Undefined: '+domain.link);
                    return cb(null,domain.link+' - undefined');
                 
              }
              else{
              // console.log(response.body.substr(0,100));
                console.log(domain.link,'Not Broken');
                self.socket.emit('Not Broken',domain.link);
                
                
                    self.socket.emit('Undefined',domain.link);
                    console.log('Undefined: '+domain.link);
                    return cb(null,null);
                
              }
             
          });
          
};


var query =  'https://www.googleapis.com/customsearch/v1';//q=gc&start=1&siteSearch=www.hospitalmedicine.org&key=AIzaSyCMGfdDaSfjqv5zYoS0mTJnOT3e9MURWkU&cx=002669942597687766721:sku0gobf9n8';

BrokenList.prototype.paginationLoopPerSearch = function(webSearch,mainDomain,i,cb){
  var requestParams;
  var self = this;
        requestParams = {"q":webSearch,
                        "start":i,
                        "siteSearch":mainDomain,
                        "key":process.env.GOOGLE_CSE_KEY,
                        "cx":process.env.GOOGLE_CSE_CX 
                        };
       console.log('inside for loop',webSearch);               
       console.log(self.mainDomain);
        unirest.get(query)
          .qs(requestParams)
          .end(function(response){
   
              var items =response.body.items;
     
              async.map(items, self.linkTest.bind(self),function(err,res){
                    //links=res;
                    console.log(res,"Inside map of webTest");
                    
                     setTimeout(function(){
                      return cb(null,_.uniq(_.flatten(res)));
                    }, 8000);
                });
                //console.log("Links",links);
                return;
            });
  
};




//paginationLoopPerSearch(2,'gc',callback1,callback2);
console.log('/////////////////////////////////////////////////////////////////////////////////');
 BrokenList.prototype.querySearch = function(mainDomain,pagination,keyWordArr ){
  var arr =[];
  var self = this;
  for(var i=0;i<pagination;i++){
    arr.push(i+1);
  }

  function search(mainDomain,searchQuery, cb){
    console.log('inside search',searchQuery);
  
    async.map(arr,self.paginationLoopPerSearch.bind(self,searchQuery,mainDomain),function(err,res){
      if(err){
        console.log(err);
        return err;
      }
      console.log(_.uniq(_.flatten(res)),'INSIDE FIRST MAP!');
      setTimeout(function(){
        return cb(null,_.uniq(_.flatten(res)));
      }, 8000);
      
    });
  }
 
  async.mapSeries(keyWordArr,search.bind(null,mainDomain),function(err,res){
    console.log(_.uniq(_.flatten(res)),'INSIDE SECOND MAP!');
    var linkCategory ={'broken':[],'undefined':[]};
    //var broken =[];
    //var undef;
      _.unique(_.flatten(res)).forEach(function(word){
                if(word && word.search('- undefined')>-1){
                   word = word.replace(" - undefined", "");
                   linkCategory['undefined'].push({"Broken Link":"","Questionable Link":word,"Marked Complete":""});
                }else{
                  linkCategory['broken'].push({"Broken Link":word,"Questionable Link":"","Marked Complete":""});
                }    
              });
      
      linkCategory['broken'].forEach(function(brokenWord){
        
         _.remove(linkCategory['undefined'],function(link){
            return brokenWord['Broken Link'] === link['Questionable Link'];
        });
      });
     
    var wordArr = _.flatten([linkCategory['broken'],linkCategory['undefined']]); 

    var fields = ['Broken Link','Questionable Link', 'Marked Complete'];
    json2csv({ data: wordArr, fields: fields }, function(err, csv) {
      if (err) {
        console.log(err);
        self.socket.emit('error','excel error');
      }
      if(wordArr.length ===0){
        self.socket.emit('no broken links','no broken links');
      }
      else{
        fs.writeFile('./public/file.csv', csv, function(err) {
          if (err) throw err;
          console.log('file saved');
          self.socket.emit('excel sheet','file saved');
        });
      }
});
  });
};



BrokenList.prototype.getBrokenList = function(){
    var self = this;
    console.log('INSIDE GET WEBSOCKET: '+ this.socket);
     this.socket.emit('start search','start search');
   /* var authClient = new google.auth.JWT(
                process.env.GA_EMAIL,
                './key.pem',
                null, ['https://www.googleapis.com/auth/analytics.readonly']);*/
                
   /* authClient.authorize(function (err, response) {
        if(err){
            console.log(err);
            self.socket.emit('app error','not authorized');
        }
        var access_token =response.access_token;
         console.log(access_token);*/
     // unirest.get('https://www.googleapis.com/analytics/v3/data/ga?ids=ga%3A6299600&start-date=30daysAgo&end-date=yesterday&metrics=ga%3Asessions&dimensions=ga%3Akeyword&key='+process.env.GA_KEY+'&access_token='+access_token)
      unirest.get('https://www.googleapis.com/analytics/v3/data/ga?ids=ga%3A6299600&start-date=30daysAgo&end-date=yesterday&metrics=ga%3Asessions&dimensions=ga%3Akeyword&key='+process.env.GA_KEY+'&access_token='+process.env.TOKEN)
              .end(function(response){
                
                var flatArr= _.flatten(response.body.rows);
                 var filteredArr= _.remove(flatArr,function(val){
                    if(isNaN(val)){
                      return val;
                    }
                  });

                  var selectedQuieriesArr = filteredArr.slice(self.initKeyWordI,self.finKeyWordI);
                
                 
                  return self.querySearch(self.mainDomain, self.finPaginationPage,selectedQuieriesArr);
                
              });

   // });
};


module.exports = BrokenList;




//console.log(BrokenList.getBrokenList())