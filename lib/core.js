const Q = require('q');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const namespaces = require('./namespaces');
const {SemanticChess, Loader} = require('semantic-chess');
const winston = require('winston');
const {format} = require('date-fns');
const rdfjsSourceFromUrl = require('./rdfjssourcefactory').fromUrl;

class ChatCore {

  constructor(fetch) {
    this.inboxUrls = {};
    this.fetch = fetch;
    this.alreadyCheckedResources = [];
    this.logger = winston.createLogger({
      level: 'error',
      transports: [
        new winston.transports.Console(),
      ],
      format: winston.format.cli()
    });
  };

  /**
   * This method returns the inbox of a WebId.
   * @param {string} webId: the WebId for which to find the inbox
   * @returns {Promise}: a promise that resolves with the inbox found via the WebId.
   */
  async getInboxUrl(webId) {
    if (!this.inboxUrls[webId]) {
      this.inboxUrls[webId] = (await this.getObjectFromPredicateForResource(webId, namespaces.ldp + 'inbox')).value;
    }
    return this.inboxUrls[webId];
  }

  /**
   * This method returns a formatted name for a WebId.
   * @param webid: the WebId for which a formatted name needs to be created.
   * @returns {Promise<string|null>}: a promise that resolvew with the formatted name (string) or
   * null if no name details were found.
   */
  async getFormattedName(webid) {
    let formattedName = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'name');

    if (!formattedName) {
      formattedName = null;
      const firstname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'givenName');
      const lastname = await this.getObjectFromPredicateForResource(webid, namespaces.foaf + 'lastName');

      if (firstname) {
        formattedName = firstname;
      }

      if (lastname) {
        if (formattedName) {
          formattedName += ' ';
        } else {
          formattedName = '';
        }

        formattedName += lastname;
      }

      if (!formattedName) {
        formattedName = webid;
      }
    } else {
      formattedName = formattedName.value;
    }

    return formattedName;
  }

  /**
   * This method returns a formatted name for a WebId.
   * @param webid: the WebId for which a formatted name needs to be created.
   * @returns {Promise<string|null>}: a promise that resolvew with the formatted name (string) or
   * null if no name details were found.
   */
  getUsername(text) {
    var array = text.split('.');
    var another = array[0].split('/')
    var username = another[another.length-1]
    return username;
  }

  checkNotMe(text, myUser) {
    if(text.includes("card") && !text.includes(myUser))
      return true;
    return false;
  }

  isFriend(text, myUser){
    try{
      this.getUsername(text);
      if(this.checkNotMe(text, myUser))
        return true;
      return false;
    } catch (TypeError){
      return false;
    }
  }

  getFriendOfList(friendList, expected){
    for(var i=0; i<friendList.length; i++){
      if(friendList[i].username == expected)
        return friendList[i];
    }
    return null;
  }; 

  /**
   * This method returns the object of resource via a predicate.
   * @param url: the url of the resource.
   * @param predicate: the predicate for which to look.
   * @returns {Promise}: a promise that resolves with the object or null if none is found.
   */
  async getObjectFromPredicateForResource(url, predicate) {
    const deferred = Q.defer();
    const rdfjsSource = await rdfjsSourceFromUrl(url, this.fetch);

    if (rdfjsSource) {
      const engine = newEngine();

      engine.query(`SELECT ?o {
    <${url}> <${predicate}> ?o.
  }`,
        {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
        .then(function (result) {
          result.bindingsStream.on('data', function (data) {
            data = data.toObject();

            deferred.resolve(data['?o']);
          });

          result.bindingsStream.on('end', function () {
            deferred.resolve(null);
          });
        });
      } else {
        deferred.resolve(null);
      }

      return deferred.promise;
  };

}

module.exports = ChatCore;
