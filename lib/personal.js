const fc = require('solid-file-client');

class Personal {

  constructor(core) {
    this.core = core;
    this.friendList = new Array();
    this.userWebId = null;
  };

  async loadNames(userWebId){
    // Para sacar el username
    this.userWebId = userWebId;
    this.username = await this.core.getUsername(userWebId);    
    // Para sacar el nombre
    //this.name = await this.core.getFormattedName(userWebId);
    return this.username;
  }

  async loadFriendList(userWebId){
    if(this.friendList.length == 0){
      var predicate = "http://xmlns.com/foaf/0.1/name";

      var friends = null;
  
      fc.fetchAndParse( userWebId ).then( store => {
        this.searchFriendsOnList(store.statements);
      }, err => console.log("could not fetch : "+err) ) ;

    } 
  }

  async loadInbox(){
    this.myFiles = await this.core.getAllResourcesInInbox(await this.core.getInboxUrl(this.userWebId));
  }

  clearInfo(){
    this.friendList = new Array();
    this.username = null;
  }

  /**
  * This method search friends of the user's list
  * @param possibleList is the list of friends of the user
  */
  async searchFriendsOnList(possibleList) {
    for(var i=0; i<possibleList.length; i++){
      if(this.core.isFriend(possibleList[i].object.value, this.username))
        this.friendList.push({username: this.core.getUsername(possibleList[i].object.value), 
                        //name: await this.core.getFormattedName(possibleList[i].object.value),
                        inbox: "https://"+this.core.getUsername(possibleList[i].object.value)+".solid.community/inbox/"});
    }
  };

  
}


module.exports = Personal;
