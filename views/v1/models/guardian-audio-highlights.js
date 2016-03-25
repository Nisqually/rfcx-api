var util = require("util");
function getAllViews() { return require("../../../views/v1"); }

exports.models = {

  guardianAudioHighlights: function(req,res,dbAudioHighlights) {

    var views = getAllViews();
    
    if (!util.isArray(dbAudioHighlights)) { dbAudioHighlights = [dbAudioHighlights]; }
    
    var jsonArray = [];

    for (i in dbAudioHighlights) {

      var dbRow = dbAudioHighlights[i];

      var guardianAudioHighlight = {
        guid: dbRow.guid,
        type: dbRow.type,
        shortname: dbRow.label,
        name: dbRow.name,
        location: null,
        timezone_offset: 0,
        description: dbRow.description,
        flickr_photoset_id:  null,
        urls: { audio: null }
      };

      if (dbRow.Guardian != null) {
        guardianAudioHighlight.urls.audio = "/v1/guardians/"+dbRow.Guardian.guid+"/audio.json";

        if (dbRow.begins_at != null) {
          guardianAudioHighlight.urls.audio += "?starting_after="+dbRow.begins_at.toISOString()+"&order=ascending"+"&limit=3";
        }
                  
      }
      if (dbRow.Site != null) {
        guardianAudioHighlight.flickr_photoset_id = dbRow.Site.flickr_photoset_id;
        guardianAudioHighlight.timezone_offset = dbRow.Site.timezone_offset;
        guardianAudioHighlight.location = dbRow.Site.description;
      }

      jsonArray.push(guardianAudioHighlight);
    }
    return jsonArray;

  }


};

