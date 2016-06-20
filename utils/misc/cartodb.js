var CartoDB = require('cartodb');
var Promise = require("bluebird");

var sql = new CartoDB.SQL({
  user: process.env.CARTODB_USER,
  api_key: process.env.CARTODB_KEY
});

exports.cdb = {

  /**
   * Find nearest guardians by coordinates using CartoDB service
   * @param {Object} opts
   * @param {string} opts.table - Cartodb table row where to search
   * @param {Object} opts.coord - Coordinates object
   * @param {number} opts.coord.lat - Latitude
   * @param {number} opts.coord.lng - Longitude
   * @param {number} opts.radius - Search radius
   * @param {number} opts.limit - Response length limit
   * @returns {Object} Promise
   */

  findNearestGuardians: function(opts) {

    return new Promise(function(resolve, reject) {

      var str = 'SELECT * FROM ' + opts.table + ' WHERE ST_DWithin(ST_Transform(CDB_LatLng(' + opts.coord.lat + ', ' +
                opts.coord.lng + '), 3857),the_geom_webmercator,' + opts.radius + ' / cos(' + opts.coord.lat +
                ' * pi()/180)) LIMIT ' + opts.limit;

      sql.execute(str)
        .done(function(res) {
          resolve(res.rows);
        }).error(function(err){
          console.log('CartoDB util error | ', err);
          reject(new Error(err));
        });

    }.bind(this));

  }

};