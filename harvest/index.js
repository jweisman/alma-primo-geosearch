const request   = require('request-promise-native');
const dom       = require('xmldom').DOMParser;
const xpath     = require('xpath');
const nconf     = require('nconf');
const pino      = require('pino');
const MongoClient = require('../utilities/mongodb.js');

nconf.env().file({ file: './config.json' });

const select    = xpath.useNamespaces({
    "oai":      "http://www.openarchives.org/OAI/2.0/",
    "dc":       "http://purl.org/dc/elements/1.1/",
    "dcterms":  "http://purl.org/dc/terms/1.1/", 
    "oai_qdc":  "http://alma.exlibrisgroup.com/schemas/qdc-1.0/",
    "xsi":      "http://www.w3.org/2001/XMLSchema-instance"
  });
const OAI_XPATH = "/oai:OAI-PMH/oai:ListRecords/oai:record";
const logger = pino({ level: nconf.get('LOG_LEVEL') || 'info' });
const until = new Date().toISOString().split('.')[0]+"Z";

var client;

process(nconf.get('OAI_URL') + '&until=' + until);

async function process(url) {
  try {
    client = await new MongoClient(nconf.get('MONGODB_URI'), 'geosearch');

    // Retrieve from time
    const settings = await client.findOne({ _id: '_settings' }, { collection: 'settings' });
    if (settings) { url += `&from=${settings.from}`};

    logger.info('Begin harvesting @ %s', url);
    var oai = await request(url);
    oai = new dom().parseFromString(oai);
    var actions = [];
    select(OAI_XPATH, oai).forEach((record) => {
      select("oai:metadata/oai_qdc:dc/dc:identifier[@xsi:type='dcterms:URI']", record)
        .filter(identifier => identifier.firstChild.data.startsWith('https://'))
        .forEach(representation => { actions.push(processRep(representation.firstChild.data)); });
      });
    await Promise.all(actions);
    logger.info('Harvested %d representations', actions.length);

    // If resumption token, go again
    var resumptionToken = select('/oai:OAI-PMH/oai:ListRecords/oai:resumptionToken', oai, true);
    if (resumptionToken) {
      resumptionToken = resumptionToken.firstChild.data;
      process(url.substr(0, url.indexOf('?')) + `?verb=ListRecords&resumptionToken=${resumptionToken}`);
    } else {
      await client.findOneAndUpdate({ _id: '_settings' }, { $set: { 'from': until }}, { collection: 'settings' }); 
      logger.debug('Saved from time %s', until);
    }
  } catch(e) {
    logger.error(e.message);
  } finally {
    client.close();
  }
}

async function processRep(url) {
  try {
    logger.info('Processing rep @ %s', url);
    var rep = await request(url + ".json", { json: true });
    logger.debug('Retrieved info for rep %s', rep.id);
    var files = rep.files.map(async file => { return processFile(file) });
    var response = await Promise.all(files);
    var title = rep.metadata.find((item) => item.label === 'Title');
    response.forEach(item => {
      item = Object.assign(item, {
        mms_id: rep.mms_id,
        rep_id: rep.id,
        title: title ? title.value : '',
        viewer_url: url
      }) 
    });
    logger.debug('Deleting DB entries for rep %s', rep.id);
    await client.deleteMany({ rep_id: rep.id });
    logger.debug('Inserting DB entries for rep %s', rep.id);
    await client.insertMany(response);
  } catch(e) {
    logger.error(e.message);
  }
}

async function processFile(file) {
  try {
    logger.debug('Processing file %s', file.label);
    var buffer = await getBuffer(file.url, '0-65635');
    var exif = extractExif(buffer)
    var lat = exif.tags.GPSLatitude;
    if (exif.tags.GPSLatitudeRef === 'S') { lat = -Math.abs(lat) };
    var long = exif.tags.GPSLongitude;
    if (exif.tags.GPSLongitudeRef === 'W') { long = -Math.abs(long) };
    return { file_id: file.pid, gps: [lat, long], 
      thumbnail_url: file.thumbnail_url, label: file.label };
  } catch(e) {
    logger.error("Could not process %s (%s)", url, e.message);
  }
}

function extractExif(buffer) {
  var parser = require('exif-parser').create(buffer);
  return parser.parse();
}

async function getBuffer(url, bytes = null) {
  var options = { encoding: null, resolveWithFullResponse: true };
  if (bytes) { options.headers = { 'Range': 'bytes=' + bytes } };
  const response = await request(url, options);
  if (response.statusCode >= 200 && response.statusCode < 210) {
    return response.body;
  } else {
    throw response;
  }
}
